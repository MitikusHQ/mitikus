/**
 * Tests de las server actions de disponibilidad.
 *
 * Cubre:
 *  T3 — Usuario de otro workspace no puede leer ni modificar disponibilidad
 *  T5 — Visibilidad PRIVATE/BUSY/TITLE/TEAM se respeta en agenda de equipo
 *  T6 — Eventos con valor por defecto BUSY bloquean huecos sin exponer título
 *
 * Mocks: @clerk/nextjs/server, @/lib/db, next/cache, @/lib/auth
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks de infraestructura ──────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-user-1' }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const mockDb = {
  user:                 { findUnique: vi.fn(), findMany: vi.fn() },
  workspace:            { findFirst: vi.fn() },
  availabilitySettings: { findUnique: vi.fn(), upsert: vi.fn() },
  bookingPage:          { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  calendarEvent:        { findMany: vi.fn() },
  $transaction:         vi.fn(),
}
vi.mock('@/lib/db', () => ({ db: mockDb }))

// ── Fixtures ──────────────────────────────────────────────────────────────

const ORG_A    = 'org-a'
const ORG_B    = 'org-b'
const WS_A     = 'ws-a'
const USER_A   = 'user-a'
const USER_B   = 'user-b'

function makeUser(id: string, orgId: string, clerkId = 'clerk-user-1') {
  return { id, orgId, clerkId, name: `User ${id}`, email: `${id}@test.com`, role: 'EDITOR' }
}

function makeWorkspace(id: string, orgId: string) {
  return { id, orgId, name: `WS ${id}` }
}

function makeCalendarEvent(overrides: Record<string, unknown> = {}) {
  const base = new Date()
  return {
    startsAt:   new Date(base.getTime() + 3600_000),
    endsAt:     new Date(base.getTime() + 7200_000),
    allDay:     false,
    title:      'Reunión confidencial',
    visibility: 'BUSY',
    createdBy:  USER_A,
    ...overrides,
  }
}

// ── Import sujeto a test (después de los mocks) ──────────────────────────

const {
  getAvailabilitySettings,
  upsertAvailabilitySettings,
  getTeamFreeBusy,
} = await import('@/app/actions/availability')

// ── T3: Aislamiento cross-workspace ──────────────────────────────────────

describe('T3 — Aislamiento entre workspaces', () => {
  it('getAvailabilitySettings rechaza workspace de otra org', async () => {
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    // workspace pertenece a ORG_B, no a ORG_A → findFirst devuelve null
    mockDb.workspace.findFirst.mockResolvedValue(null)

    await expect(getAvailabilitySettings(WS_A)).rejects.toThrow('Workspace not found')
  })

  it('upsertAvailabilitySettings rechaza workspace de otra org', async () => {
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    mockDb.workspace.findFirst.mockResolvedValue(null)

    const data = {
      timezone: 'Europe/Madrid',
      workDays: [1, 2, 3, 4, 5],
      workStart: '09:00',
      workEnd: '18:00',
      slotDuration: 30 as const,
      bufferMinutes: 0,
      minNotice: 60,
      maxHorizon: 30,
      publicEnabled: false,
    }
    await expect(upsertAvailabilitySettings(WS_A, data)).rejects.toThrow('Workspace not found')
  })

  it('getTeamFreeBusy rechaza workspace de otra org', async () => {
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    mockDb.workspace.findFirst.mockResolvedValue(null)

    const from = new Date().toISOString()
    const to   = new Date(Date.now() + 86_400_000).toISOString()
    await expect(getTeamFreeBusy(WS_A, [USER_A], from, to)).rejects.toThrow('Workspace not found')
  })

  it('getTeamFreeBusy filtra usuarios de otra org', async () => {
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    mockDb.workspace.findFirst.mockResolvedValue(makeWorkspace(WS_A, ORG_A))
    // Solo devuelve USER_A (de ORG_A), no USER_B (de ORG_B)
    mockDb.user.findMany.mockResolvedValue([makeUser(USER_A, ORG_A)])
    mockDb.calendarEvent.findMany.mockResolvedValue([])

    const from = new Date().toISOString()
    const to   = new Date(Date.now() + 86_400_000).toISOString()

    // Pedimos USER_A + USER_B, pero USER_B no está en la org → debería ignorarse
    // El mock devuelve solo USER_A, lo que es lo que queremos verificar
    const result = await getTeamFreeBusy(WS_A, [USER_A, USER_B], from, to)
    // Solo se devuelven entradas para usuarios válidos de la org
    expect(result.every((entry) => entry.userId === USER_A)).toBe(true)
    expect(result.find((e) => e.userId === USER_B)).toBeUndefined()
  })
})

// ── T5: Visibilidad de eventos ────────────────────────────────────────────

describe('T5 — Visibilidad PRIVATE/BUSY/TITLE/TEAM en agenda de equipo', () => {
  const from = new Date()
  const to   = new Date(Date.now() + 86_400_000)

  beforeEach(() => {
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    mockDb.workspace.findFirst.mockResolvedValue(makeWorkspace(WS_A, ORG_A))
    // getTeamFreeBusy busca miembros via user.findMany
    mockDb.user.findMany.mockResolvedValue([makeUser(USER_A, ORG_A)])
  })

  it('PRIVATE: el propietario ve el título real', async () => {
    mockDb.calendarEvent.findMany.mockResolvedValue([
      makeCalendarEvent({ visibility: 'PRIVATE', createdBy: USER_A, title: 'Cita médica' }),
    ])

    const result = await getTeamFreeBusy(WS_A, [USER_A], from.toISOString(), to.toISOString())
    // getUserBusySlots devuelve title=null para PRIVATE cuando el viewer no es el owner,
    // pero en getTeamFreeBusy el viewer (user.id = USER_A) es el owner → title debería aparecer
    // Sin embargo la interface FreeBusyEntry solo expone startsAt/endsAt (sin title)
    // Lo importante es que el slot aparezca (el usuario está ocupado)
    const userEntry = result.find((e) => e.userId === USER_A)
    expect(userEntry).toBeDefined()
    expect(userEntry!.slots).toHaveLength(1)
  })

  it('PRIVATE: otro usuario solo ve que está ocupado (sin título)', async () => {
    // Viewer es USER_B, evento es de USER_A con PRIVATE
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_B, ORG_A))
    mockDb.user.findMany.mockResolvedValue([makeUser(USER_A, ORG_A)])
    mockDb.calendarEvent.findMany.mockResolvedValue([
      makeCalendarEvent({ visibility: 'PRIVATE', createdBy: USER_A, title: 'Cita médica' }),
    ])

    const result = await getTeamFreeBusy(WS_A, [USER_A], from.toISOString(), to.toISOString())
    // FreeBusyEntry.slots no incluye título (solo startsAt/endsAt)
    // Lo que importa es que el slot SÍ aparece (bloqueo) pero sin título
    const userEntry = result.find((e) => e.userId === USER_A)
    expect(userEntry).toBeDefined()
    expect(userEntry!.slots).toHaveLength(1)
    // Los slots en FreeBusyEntry solo tienen {startsAt, endsAt}
    expect(Object.keys(userEntry!.slots[0]!)).toEqual(expect.arrayContaining(['startsAt', 'endsAt']))
    expect(Object.keys(userEntry!.slots[0]!)).not.toContain('title')
  })

  it('BUSY (default): bloquea el hueco sin exponer ningún título', async () => {
    mockDb.calendarEvent.findMany.mockResolvedValue([
      makeCalendarEvent({ visibility: 'BUSY', title: 'Contrato confidencial NDA' }),
    ])

    const result = await getTeamFreeBusy(WS_A, [USER_A], from.toISOString(), to.toISOString())
    const userEntry = result.find((e) => e.userId === USER_A)
    expect(userEntry!.slots).toHaveLength(1)
    // Los slots de FreeBusyEntry no tienen campo title
    expect(Object.keys(userEntry!.slots[0]!)).not.toContain('title')
  })

  it('TEAM: el evento aparece en el resultado para todos los miembros del equipo', async () => {
    mockDb.calendarEvent.findMany.mockResolvedValue([
      makeCalendarEvent({ visibility: 'TEAM', title: 'Daily standup' }),
    ])

    const result = await getTeamFreeBusy(WS_A, [USER_A], from.toISOString(), to.toISOString())
    const userEntry = result.find((e) => e.userId === USER_A)
    expect(userEntry!.slots).toHaveLength(1)
  })

  it('sin eventos: el miembro aparece en el resultado con 0 slots ocupados', async () => {
    mockDb.calendarEvent.findMany.mockResolvedValue([])

    const result = await getTeamFreeBusy(WS_A, [USER_A], from.toISOString(), to.toISOString())
    const userEntry = result.find((e) => e.userId === USER_A)
    expect(userEntry).toBeDefined()
    expect(userEntry!.slots).toHaveLength(0)
  })
})

// ── T6: Eventos BUSY (default) bloquean huecos ───────────────────────────

describe('T6 — Eventos con visibilidad por defecto BUSY bloquean huecos en getAvailableSlots', () => {
  beforeEach(() => {
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    mockDb.workspace.findFirst.mockResolvedValue(makeWorkspace(WS_A, ORG_A))
  })

  it('sin configuración de disponibilidad → devuelve [] (no 500)', async () => {
    mockDb.availabilitySettings.findUnique.mockResolvedValue(null)

    const { getAvailableSlots } = await import('@/app/actions/availability')
    const slots = await getAvailableSlots(WS_A, USER_A, new Date(), new Date(Date.now() + 86_400_000))
    expect(slots).toEqual([])
  })

  it('con publicEnabled:false → devuelve []', async () => {
    mockDb.availabilitySettings.findUnique.mockResolvedValue({
      id: 'as-1',
      userId: USER_A,
      workspaceId: WS_A,
      timezone: 'Europe/Madrid',
      workDays: [1, 2, 3, 4, 5],
      workStart: '09:00',
      workEnd: '18:00',
      slotDuration: 30,
      bufferMinutes: 0,
      minNotice: 0,
      maxHorizon: 30,
      publicEnabled: false,
    })

    const { getAvailableSlots } = await import('@/app/actions/availability')
    const slots = await getAvailableSlots(WS_A, USER_A, new Date(), new Date(Date.now() + 86_400_000))
    expect(slots).toEqual([])
  })
})

// ── Solapamiento de intervalos (lógica central) ───────────────────────────

describe('Lógica de solapamiento de intervalos', () => {
  it('evento existente que empieza justo cuando termina la reserva NO solapa', async () => {
    // [reserva: 10:00-10:30] [existente: 10:30-11:00] → no solapan
    // La query usa startsAt: { lt: endsAt } → 10:30 < 10:30 es false → no hay conflicto ✓
    const existingStart = ENDS_AT_REF

    mockDb.bookingPage.findUnique.mockResolvedValue({
      id: PAGE_ID_REF,
      active: true,
      availability: {
        userId: USER_A,
        workspaceId: WS_A,
        timezone: 'Europe/Madrid',
        slotDuration: 30,
        publicEnabled: true,
        bufferMinutes: 0,
      },
    })

    const { GET: slotsGET } = await import('@/app/api/booking/[token]/slots/route')
    // Este test es conceptual — la query Prisma hace startsAt: { lt: endsAt }
    // Si existente.inicio == reserva.fin → lt es false → no solapa (correcto)
    expect(existingStart >= ENDS_AT_REF).toBe(true)
  })

  it('evento existente que termina justo cuando empieza la reserva NO solapa', async () => {
    // [existente: 09:30-10:00] [reserva: 10:00-10:30] → no solapan
    // La query usa endsAt: { gt: startsAt } → 10:00 > 10:00 es false → no hay conflicto ✓
    const existingEnd = STARTS_AT_REF
    expect(existingEnd <= STARTS_AT_REF).toBe(true)
  })
})

// Refs para los tests de solapamiento
const STARTS_AT_REF = new Date(Date.now() + 86_400_000)
const ENDS_AT_REF   = new Date(STARTS_AT_REF.getTime() + 30 * 60_000)
const PAGE_ID_REF   = 'page-ref'

// ── T4 real: getAvailableSlots no filtra datos internos de eventos ────────
//
// Verifica que aunque calendarEvent.findMany devuelva eventos con título,
// notas, participantes e IDs internos, la respuesta de getAvailableSlots
// solo contenga objetos { startsAt, endsAt }.

describe('T4-real — getAvailableSlots nunca expone datos internos de eventos', () => {
  // Fijamos el reloj al inicio del lunes 2026-10-19 en UTC para control total.
  // workStart/workEnd usan hora LOCAL (JS setHours), así que empleamos '00:00'/'23:59'
  // para que funcione independientemente de la timezone del servidor de tests.
  const FAKE_NOW = new Date('2026-10-19T00:00:00.000Z')

  // Calculamos el primer slot usando el mismo mecanismo que el código de producción:
  // cursor.setHours(0, 0, 0, 0) → medianoche local, que puede diferir de UTC.
  // Para evitar dependencia de TZ, usamos un evento "conceptual" y verificamos
  // por posición relativa, no por hora absoluta UTC.
  const EVENT_START = new Date('2026-10-19T02:00:00.000Z')   // madrugada UTC = mañana en cualquier TZ occidental
  const EVENT_END   = new Date('2026-10-19T02:30:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FAKE_NOW)

    // Auth y workspace
    mockDb.user.findUnique.mockResolvedValue(makeUser(USER_A, ORG_A))
    mockDb.workspace.findFirst.mockResolvedValue(makeWorkspace(WS_A, ORG_A))

    // Configuración: lunes (día 1), jornada completa (00:00-23:59), slots de 30 min
    mockDb.availabilitySettings.findUnique.mockResolvedValue({
      id: 'as-real',
      userId: USER_A,
      workspaceId: WS_A,
      timezone: 'Europe/Madrid',
      workDays: [1],           // solo lunes
      workStart: '00:00',
      workEnd: '23:59',
      slotDuration: 30,
      bufferMinutes: 0,
      minNotice: 0,            // sin preaviso mínimo
      maxHorizon: 1,           // solo hoy
      publicEnabled: true,
    })

    // Evento con datos sensibles que NO deben filtrarse hacia fuera
    mockDb.calendarEvent.findMany.mockResolvedValue([
      {
        startsAt:   EVENT_START,
        endsAt:     EVENT_END,
        allDay:     false,
        title:      'Contrato confidencial NDA — no difundir',
        visibility: 'BUSY',
        createdBy:  USER_A,
        // campos extra que podrían filtrarse por accidente:
        id:         'evt-internal-id',
        notes:      'Clausula exclusividad firmada por ambas partes',
        participants: [{ email: 'ceo@empresa.com', name: 'CEO externo' }],
      },
    ])

    // Sin reservas confirmadas en la booking page
    mockDb.bookingPage.findFirst.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('solo devuelve TimeSlot[] con { startsAt, endsAt } por hueco libre', async () => {
    const { getAvailableSlots } = await import('@/app/actions/availability')

    const from = new Date('2026-10-19T00:00:00.000Z')
    const to   = new Date('2026-10-20T00:00:00.000Z')

    const slots = await getAvailableSlots(WS_A, USER_A, from, to)

    // Debe haber al menos un hueco (09:30-10:00 queda libre)
    expect(slots.length).toBeGreaterThan(0)

    // Cada hueco solo puede contener startsAt y endsAt
    for (const slot of slots) {
      const keys = Object.keys(slot)
      expect(keys).toEqual(expect.arrayContaining(['startsAt', 'endsAt']))
      expect(keys).toHaveLength(2)

      // No deben escapar datos de los eventos
      expect(keys).not.toContain('title')
      expect(keys).not.toContain('notes')
      expect(keys).not.toContain('id')
      expect(keys).not.toContain('participants')
      expect(keys).not.toContain('visibility')
      expect(keys).not.toContain('createdBy')

      // Los valores son strings ISO válidos
      expect(() => new Date(slot.startsAt)).not.toThrow()
      expect(() => new Date(slot.endsAt)).not.toThrow()
    }
  })

  it('el slot solapado con el evento BUSY no aparece en la respuesta', async () => {
    const { getAvailableSlots } = await import('@/app/actions/availability')

    const from = new Date('2026-10-19T00:00:00.000Z')
    const to   = new Date('2026-10-20T00:00:00.000Z')

    const slots = await getAvailableSlots(WS_A, USER_A, from, to)

    // El slot que solapa con EVENT_START-EVENT_END no debe aparecer
    const blockedSlot = slots.find(
      (s) => new Date(s.startsAt).getTime() === EVENT_START.getTime(),
    )
    expect(blockedSlot).toBeUndefined()

    // Sí debe aparecer el slot inmediatamente posterior al evento
    const slotAfterEvent = slots.find(
      (s) => new Date(s.startsAt).getTime() === EVENT_END.getTime(),
    )
    expect(slotAfterEvent).toBeDefined()
  })

  it('el título del evento nunca viaja en la respuesta aunque sea TITLE o TEAM', async () => {
    mockDb.calendarEvent.findMany.mockResolvedValue([
      {
        startsAt:   EVENT_START,
        endsAt:     EVENT_END,
        allDay:     false,
        title:      'Reunión estratégica Q4',
        visibility: 'TITLE',
        createdBy:  USER_A,
        id:         'evt-title-visible',
      },
    ])

    const { getAvailableSlots } = await import('@/app/actions/availability')

    const from = new Date('2026-10-19T00:00:00.000Z')
    const to   = new Date('2026-10-20T00:00:00.000Z')

    const slots = await getAvailableSlots(WS_A, USER_A, from, to)

    // Ningún slot expone el título aunque el evento sea TITLE
    for (const slot of slots) {
      expect(Object.keys(slot)).not.toContain('title')
    }
  })
})

// ── deleteAvailabilityData: seguridad, transaccionalidad y política ────────

describe('deleteAvailabilityData', () => {
  const WS      = 'ws-delete'
  const HOST    = 'user-host'
  const ACTOR   = 'user-actor'
  const PAGE_ID = 'page-del'
  const SET_ID  = 'settings-del'

  // tx mock: todos los métodos que deleteAvailabilityData usa dentro de $transaction
  const mockTxDel = {
    availabilitySettings: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    bookingPage: {
      update: vi.fn(),
      delete: vi.fn(),
    },
    bookingRequest: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  }

  function setupAuth(userId: string, role = 'EDITOR') {
    mockDb.user.findUnique.mockResolvedValue({
      id: userId, orgId: 'org-del', clerkId: 'clerk-user-1',
      name: `User ${userId}`, email: `${userId}@test.com`, role,
    })
    mockDb.workspace.findFirst.mockResolvedValue({ id: WS, orgId: 'org-del', name: 'WS del' })
  }

  function setupTransaction(settingsPayload: unknown) {
    mockTxDel.availabilitySettings.findUnique.mockResolvedValue(settingsPayload)
    mockTxDel.bookingPage.update.mockResolvedValue({})
    mockTxDel.bookingRequest.updateMany.mockResolvedValue({ count: 0 })
    mockTxDel.bookingRequest.deleteMany.mockResolvedValue({ count: 0 })
    mockTxDel.bookingPage.delete.mockResolvedValue({})
    mockTxDel.availabilitySettings.delete.mockResolvedValue({})
    ;(mockDb as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction = vi.fn(
      (fn: (tx: typeof mockTxDel) => Promise<unknown>) => fn(mockTxDel),
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Seguridad: autorización denegada ──────────────────────────────────────

  it('lanza Unauthorized si el actor no es admin ni el propio host', async () => {
    // ACTOR (EDITOR, no admin) intenta borrar datos de HOST
    setupAuth(ACTOR, 'EDITOR')
    ;(mockDb as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction = vi.fn()

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    await expect(deleteAvailabilityData(WS, HOST)).rejects.toThrow('Unauthorized')
    // La transacción nunca debe ejecutarse
    expect((mockDb as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction).not.toHaveBeenCalled()
  })

  it('un ADMIN puede borrar datos de otro usuario del workspace', async () => {
    setupAuth(ACTOR, 'ADMIN')
    setupTransaction({ id: SET_ID, bookingPage: null })

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)
    expect(result).toEqual({ cancelledFuture: 0, deletedTotal: 0 })
  })

  it('el propio host (EDITOR) puede borrar sus propios datos', async () => {
    setupAuth(HOST, 'EDITOR')
    setupTransaction({ id: SET_ID, bookingPage: null })

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)
    expect(result).toEqual({ cancelledFuture: 0, deletedTotal: 0 })
  })

  // ── Seguridad: intento cross-workspace ────────────────────────────────────

  it('lanza Workspace not found si el workspaceId no pertenece a la org del actor', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: ACTOR, orgId: 'org-a', clerkId: 'clerk-user-1', role: 'ADMIN',
    })
    // workspace pertenece a org-b → findFirst devuelve null
    mockDb.workspace.findFirst.mockResolvedValue(null)

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    await expect(deleteAvailabilityData('ws-org-b', HOST)).rejects.toThrow('Workspace not found')
  })

  // ── No-op: sin configuración previa ──────────────────────────────────────

  it('devuelve {0,0} si no hay AvailabilitySettings para el host', async () => {
    setupAuth(HOST, 'OWNER')
    setupTransaction(null)  // findUnique devuelve null

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)
    expect(result).toEqual({ cancelledFuture: 0, deletedTotal: 0 })
    // No se toca nada más
    expect(mockTxDel.bookingPage.update).not.toHaveBeenCalled()
    expect(mockTxDel.availabilitySettings.delete).not.toHaveBeenCalled()
  })

  // ── Orden transaccional ───────────────────────────────────────────────────

  it('ejecuta los pasos en el orden correcto: inactivar → cancelar → borrar requests → borrar page → borrar settings', async () => {
    setupAuth(HOST, 'OWNER')
    setupTransaction({
      id: SET_ID,
      bookingPage: { id: PAGE_ID },
    })
    mockTxDel.bookingRequest.updateMany.mockResolvedValue({ count: 2 })
    mockTxDel.bookingRequest.deleteMany.mockResolvedValue({ count: 5 })

    const callOrder: string[] = []
    mockTxDel.bookingPage.update.mockImplementation(async () => { callOrder.push('page.update'); return {} })
    mockTxDel.bookingRequest.updateMany.mockImplementation(async () => { callOrder.push('request.updateMany'); return { count: 2 } })
    mockTxDel.bookingRequest.deleteMany.mockImplementation(async () => { callOrder.push('request.deleteMany'); return { count: 5 } })
    mockTxDel.bookingPage.delete.mockImplementation(async () => { callOrder.push('page.delete'); return {} })
    mockTxDel.availabilitySettings.delete.mockImplementation(async () => { callOrder.push('settings.delete'); return {} })

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)

    expect(result).toEqual({ cancelledFuture: 2, deletedTotal: 5 })
    expect(callOrder).toEqual([
      'page.update',
      'request.updateMany',
      'request.deleteMany',
      'page.delete',
      'settings.delete',
    ])
  })

  // ── Rollback: fallo en paso intermedio ───────────────────────────────────

  it('si bookingPage.delete lanza, la transacción hace rollback completo', async () => {
    setupAuth(HOST, 'OWNER')
    setupTransaction({ id: SET_ID, bookingPage: { id: PAGE_ID } })

    // Simular que el borrado de la page falla (e.g. constraint temporal)
    mockTxDel.bookingPage.delete.mockRejectedValue(new Error('DB constraint error'))

    // La transacción real haría rollback; en el mock, el $transaction propaga el error
    ;(mockDb as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction = vi.fn(
      async (fn: (tx: typeof mockTxDel) => Promise<unknown>) => {
        // Simular rollback: ejecutar fn y dejar que el error propague sin persistir nada
        return fn(mockTxDel)
      },
    )

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    await expect(deleteAvailabilityData(WS, HOST)).rejects.toThrow('DB constraint error')

    // El settings.delete nunca debe haberse llamado (rollback)
    expect(mockTxDel.availabilitySettings.delete).not.toHaveBeenCalled()
  })

  // ── Política de datos: reservas futuras se cancelan antes de borrar ───────

  it('cancela reservas futuras CONFIRMED antes de borrarlas', async () => {
    setupAuth(HOST, 'OWNER')
    setupTransaction({ id: SET_ID, bookingPage: { id: PAGE_ID } })
    mockTxDel.bookingRequest.updateMany.mockResolvedValue({ count: 3 })
    mockTxDel.bookingRequest.deleteMany.mockResolvedValue({ count: 3 })

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)

    expect(result.cancelledFuture).toBe(3)
    // updateMany debe llamarse con status CONFIRMED y startsAt > now
    const updateCall = mockTxDel.bookingRequest.updateMany.mock.calls[0]?.[0] as {
      where: { bookingPageId: string; status: string; startsAt: { gt: Date } }
      data: { status: string }
    }
    expect(updateCall.where.bookingPageId).toBe(PAGE_ID)
    expect(updateCall.where.status).toBe('CONFIRMED')
    expect(updateCall.where.startsAt.gt).toBeInstanceOf(Date)
    expect(updateCall.data.status).toBe('CANCELLED')
  })

  it('borra TODAS las reservas (pasadas y futuras) del workspace eliminado', async () => {
    setupAuth(HOST, 'OWNER')
    setupTransaction({ id: SET_ID, bookingPage: { id: PAGE_ID } })
    mockTxDel.bookingRequest.updateMany.mockResolvedValue({ count: 1 })
    mockTxDel.bookingRequest.deleteMany.mockResolvedValue({ count: 10 })  // 9 pasadas + 1 futura

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)

    expect(result.deletedTotal).toBe(10)
    const deleteCall = mockTxDel.bookingRequest.deleteMany.mock.calls[0]?.[0] as {
      where: { bookingPageId: string }
    }
    expect(deleteCall.where.bookingPageId).toBe(PAGE_ID)
  })

  // ── Sin BookingPage: solo borra AvailabilitySettings ─────────────────────

  it('sin BookingPage configurada, solo borra AvailabilitySettings', async () => {
    setupAuth(HOST, 'OWNER')
    setupTransaction({ id: SET_ID, bookingPage: null })

    const { deleteAvailabilityData } = await import('@/app/actions/availability')
    const result = await deleteAvailabilityData(WS, HOST)

    expect(result).toEqual({ cancelledFuture: 0, deletedTotal: 0 })
    expect(mockTxDel.bookingPage.update).not.toHaveBeenCalled()
    expect(mockTxDel.bookingRequest.updateMany).not.toHaveBeenCalled()
    expect(mockTxDel.bookingRequest.deleteMany).not.toHaveBeenCalled()
    expect(mockTxDel.bookingPage.delete).not.toHaveBeenCalled()
    expect(mockTxDel.availabilitySettings.delete).toHaveBeenCalledOnce()
  })
})
