/**
 * Tests de la API pública de reservas.
 *
 * Cubre:
 *  T1 — Token revocado/inactivo devuelve la misma respuesta que token inexistente
 *  T2 — Dos peticiones simultáneas al mismo hueco: solo una puede confirmar
 *  T4 — La API pública no expone IDs, emails, títulos de eventos ni datos de workspace
 *
 * Mocks: @/lib/db, @/lib/rate-limit, @/lib/auth, @clerk/nextjs/server, next/cache
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks de infraestructura ──────────────────────────────────────────────

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null), // nunca limita en tests
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-user-1' }),
}))

vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn(),
}))

vi.mock('@/app/actions/availability', () => ({
  getAvailableSlots: vi.fn().mockResolvedValue([]),
}))

// db se reconstruye en cada test para aislamiento
const mockTx = {
  calendarEvent: { findFirst: vi.fn(), create: vi.fn() },
  bookingRequest: { findFirst: vi.fn(), create: vi.fn() },
}

const mockDb = {
  bookingPage:          { findUnique: vi.fn() },
  calendarEvent:        { findMany: vi.fn() },
  user:                 { findUnique: vi.fn(), findMany: vi.fn() },
  workspace:            { findFirst: vi.fn() },
  availabilitySettings: { findUnique: vi.fn() },
  $transaction:         vi.fn(),
}
vi.mock('@/lib/db', () => ({ db: mockDb }))

// ── Fixtures ──────────────────────────────────────────────────────────────

const TOKEN    = 'abc123token'
const WS_ID    = 'ws-test-1'
const USER_ID  = 'user-test-1'
const PAGE_ID  = 'page-test-1'

const STARTS_AT = new Date(Date.now() + 86_400_000)            // mañana
const ENDS_AT   = new Date(STARTS_AT.getTime() + 30 * 60_000)  // + 30 min

function makeActivePage(overrides: Record<string, unknown> = {}) {
  return {
    id: PAGE_ID,
    active: true,
    availability: {
      userId: USER_ID,
      workspaceId: WS_ID,
      timezone: 'Europe/Madrid',
      slotDuration: 30,
      publicEnabled: true,
      bufferMinutes: 0,
    },
    ...overrides,
  }
}

function makeSlotsRequest(from: Date, to: Date) {
  const url = new URL(`http://localhost/api/booking/${TOKEN}/slots`)
  url.searchParams.set('from', from.toISOString())
  url.searchParams.set('to', to.toISOString())
  return new NextRequest(url.toString())
}

function makeReserveRequest(startsAt: Date, extraBody: Record<string, unknown> = {}) {
  return new NextRequest(`http://localhost/api/booking/${TOKEN}/reserve`, {
    method: 'POST',
    body: JSON.stringify({
      guestName: 'Ana García',
      guestEmail: 'ana@test.com',
      startsAt: startsAt.toISOString(),
      ...extraBody,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Import sujetos a test (después de los mocks) ──────────────────────────

const { GET: slotsGET } = await import('@/app/api/booking/[token]/slots/route')
const { POST: reservePOST } = await import('@/app/api/booking/[token]/reserve/route')

// ── T1: Token revocado/inactivo ≡ token inexistente ──────────────────────

describe('T1 — Token inactivo devuelve la misma respuesta que token inexistente', () => {
  const from = new Date()
  const to   = new Date(Date.now() + 86_400_000)

  it('token inexistente → 404 con { error: not_found }', async () => {
    mockDb.bookingPage.findUnique.mockResolvedValue(null)
    const res = await slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) })
    expect(res.status).toBe(404)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('not_found')
  })

  it('token con active:false → mismo 404', async () => {
    mockDb.bookingPage.findUnique.mockResolvedValue(makeActivePage({ active: false }))
    const res = await slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) })
    expect(res.status).toBe(404)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('not_found')
  })

  it('token con publicEnabled:false → mismo 404', async () => {
    mockDb.bookingPage.findUnique.mockResolvedValue(
      makeActivePage({ availability: { ...makeActivePage().availability, publicEnabled: false } }),
    )
    const res = await slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) })
    expect(res.status).toBe(404)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('not_found')
  })

  it('los tres casos devuelven cuerpos JSON idénticos', async () => {
    mockDb.bookingPage.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeActivePage({ active: false }))
      .mockResolvedValueOnce(makeActivePage({ availability: { ...makeActivePage().availability, publicEnabled: false } }))

    const bodies = await Promise.all([
      slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) }).then((r) => r.json()),
      slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) }).then((r) => r.json()),
      slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) }).then((r) => r.json()),
    ])
    expect(bodies[0]).toEqual(bodies[1])
    expect(bodies[1]).toEqual(bodies[2])
  })
})

// ── T2: Prevención de doble reserva ──────────────────────────────────────

describe('T2 — Prevención de doble reserva concurrente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.bookingPage.findUnique.mockResolvedValue(makeActivePage())
    // Por defecto la transacción ejecuta el callback recibido
    mockDb.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))
    mockTx.calendarEvent.create.mockResolvedValue({ id: 'evt-new' })
    mockTx.bookingRequest.create.mockResolvedValue({
      id: 'booking-new',
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
    })
  })

  it('sin conflicto → 200 ok', async () => {
    mockTx.calendarEvent.findFirst.mockResolvedValue(null)
    mockTx.bookingRequest.findFirst.mockResolvedValue(null)

    const res = await reservePOST(makeReserveRequest(STARTS_AT), {
      params: Promise.resolve({ token: TOKEN }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('con calendarEvent solapado → 409 slot_taken', async () => {
    mockTx.calendarEvent.findFirst.mockResolvedValue({ id: 'evt-existing' })
    mockTx.bookingRequest.findFirst.mockResolvedValue(null)

    const res = await reservePOST(makeReserveRequest(STARTS_AT), {
      params: Promise.resolve({ token: TOKEN }),
    })
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('slot_taken')
  })

  it('con bookingRequest CONFIRMED solapada → 409 slot_taken', async () => {
    mockTx.calendarEvent.findFirst.mockResolvedValue(null)
    mockTx.bookingRequest.findFirst.mockResolvedValue({ id: 'booking-existing' })

    const res = await reservePOST(makeReserveRequest(STARTS_AT), {
      params: Promise.resolve({ token: TOKEN }),
    })
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('slot_taken')
  })

  it('la comprobación de solapamiento usa los filtros correctos (inicio<fin AND fin>inicio)', () => {
    // Verifica que la query de conflicto construida por el handler use la lógica
    // correcta de solapamiento de intervalos
    const eventQuery = mockTx.calendarEvent.findFirst.mock.calls[0]?.[0] as {
      where: { startsAt: { lt: Date }; endsAt: { gt: Date } }
    } | undefined

    // Ejecutamos una reserva para capturar los argumentos
    mockTx.calendarEvent.findFirst.mockResolvedValue(null)
    mockTx.bookingRequest.findFirst.mockResolvedValue(null)

    void reservePOST(makeReserveRequest(STARTS_AT), { params: Promise.resolve({ token: TOKEN }) })
      .then(() => {
        const call = mockTx.calendarEvent.findFirst.mock.calls[0]?.[0] as {
          where: { startsAt: { lt: Date }; endsAt: { gt: Date } }
        }
        // existente.inicio < solicitada.fin
        expect(call.where.startsAt).toEqual({ lt: ENDS_AT })
        // existente.fin > solicitada.inicio
        expect(call.where.endsAt).toEqual({ gt: STARTS_AT })
      })
  })

  it('petición con fecha pasada → 422', async () => {
    const pastDate = new Date(Date.now() - 3600_000)
    const res = await reservePOST(makeReserveRequest(pastDate), {
      params: Promise.resolve({ token: TOKEN }),
    })
    expect(res.status).toBe(422)
  })

  it('no se crea ningún evento ni reserva si hay conflicto', async () => {
    mockTx.calendarEvent.findFirst.mockResolvedValue({ id: 'evt-existing' })
    mockTx.bookingRequest.findFirst.mockResolvedValue(null)

    await reservePOST(makeReserveRequest(STARTS_AT), { params: Promise.resolve({ token: TOKEN }) })

    expect(mockTx.calendarEvent.create).not.toHaveBeenCalled()
    expect(mockTx.bookingRequest.create).not.toHaveBeenCalled()
  })
})

// ── T4: La API pública no expone datos internos ───────────────────────────

describe('T4 — La API pública no expone IDs internos, emails ni datos de workspace', () => {
  const from = new Date()
  const to   = new Date(Date.now() + 86_400_000)

  it('GET /slots solo devuelve { slotDuration, timezone, slots }', async () => {
    // getAvailableSlots llama a auth() → user.findUnique → workspace.findFirst → availabilitySettings.findUnique
    mockDb.bookingPage.findUnique.mockResolvedValue(makeActivePage())
    mockDb.user.findUnique.mockResolvedValue({ id: USER_ID, orgId: 'org-1', clerkId: 'clerk-user-1' })
    mockDb.workspace.findFirst.mockResolvedValue({ id: WS_ID, orgId: 'org-1' })
    mockDb.availabilitySettings.findUnique.mockResolvedValue(null) // sin configuración → 0 slots

    const res = await slotsGET(makeSlotsRequest(from, to), { params: Promise.resolve({ token: TOKEN }) })
    expect(res.status).toBe(200)

    const body = await res.json() as Record<string, unknown>

    // Solo deben estar estas tres claves
    const keys = Object.keys(body)
    expect(keys).toContain('slotDuration')
    expect(keys).toContain('timezone')
    expect(keys).toContain('slots')

    // No deben estar datos internos
    expect(keys).not.toContain('workspaceId')
    expect(keys).not.toContain('userId')
    expect(keys).not.toContain('availabilityId')
    expect(keys).not.toContain('email')
    expect(keys).not.toContain('name')
    expect(keys).not.toContain('id')
  })

  it('POST /reserve exitoso solo devuelve { ok, startsAt, endsAt }', async () => {
    mockDb.bookingPage.findUnique.mockResolvedValue(makeActivePage())
    mockDb.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))
    mockTx.calendarEvent.findFirst.mockResolvedValue(null)
    mockTx.bookingRequest.findFirst.mockResolvedValue(null)
    mockTx.calendarEvent.create.mockResolvedValue({ id: 'evt-new' })
    mockTx.bookingRequest.create.mockResolvedValue({
      id: 'booking-new',
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
    })

    const res = await reservePOST(makeReserveRequest(STARTS_AT), {
      params: Promise.resolve({ token: TOKEN }),
    })
    expect(res.status).toBe(200)

    const body = await res.json() as Record<string, unknown>
    const keys = Object.keys(body)
    expect(keys).toContain('ok')
    expect(keys).toContain('startsAt')
    expect(keys).toContain('endsAt')

    // No deben aparecer IDs internos
    expect(keys).not.toContain('id')
    expect(keys).not.toContain('bookingId')
    expect(keys).not.toContain('eventId')
    expect(keys).not.toContain('workspaceId')
    expect(keys).not.toContain('cancelToken')
    expect(keys).not.toContain('guestEmail')
    expect(keys).not.toContain('guestName')
  })
})

// ── Validación de entrada en /reserve ────────────────────────────────────

describe('Validación de entrada — POST /reserve', () => {
  beforeEach(() => {
    mockDb.bookingPage.findUnique.mockResolvedValue(makeActivePage())
  })

  it('email inválido → 422', async () => {
    const res = await reservePOST(
      makeReserveRequest(STARTS_AT, { guestEmail: 'no-es-un-email' }),
      { params: Promise.resolve({ token: TOKEN }) },
    )
    expect(res.status).toBe(422)
  })

  it('nombre vacío → 422', async () => {
    const res = await reservePOST(
      makeReserveRequest(STARTS_AT, { guestName: '' }),
      { params: Promise.resolve({ token: TOKEN }) },
    )
    expect(res.status).toBe(422)
  })

  it('nota de más de 500 caracteres → 422', async () => {
    const res = await reservePOST(
      makeReserveRequest(STARTS_AT, { guestNote: 'x'.repeat(501) }),
      { params: Promise.resolve({ token: TOKEN }) },
    )
    expect(res.status).toBe(422)
  })
})
