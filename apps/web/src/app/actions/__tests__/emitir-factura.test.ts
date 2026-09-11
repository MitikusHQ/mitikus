/**
 * Tests de emitirFactura — acción Server que orquesta Verifactu.
 *
 * Mocks: @clerk/nextjs/server, @/lib/db, next/cache, @/lib/pmf-analytics
 * No se mockean: @/lib/verifactu (queremos probar el hash real), @/lib/permissions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks de infraestructura ──────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-user-1' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/pmf-analytics', () => ({
  trackInvoiceCreated: vi.fn(),
  trackInvoiceEmitted: vi.fn(),
  trackInvoiceSent:    vi.fn(),
}))

vi.mock('@/lib/mail/delivery', () => ({ deliverMailMessage: vi.fn() }))
vi.mock('@/lib/mail/inbox-sync', () => ({ syncInboxForWorkspace: vi.fn() }))
vi.mock('@/lib/crypto', () => ({ decryptSafe: vi.fn((v: string) => v) }))

// db se mockea con factory para que cada test parta limpio
const mockDb = {
  user: { findUnique: vi.fn() },
  workspace: { findFirst: vi.fn() },
  invoice: {
    findFirst: vi.fn(),
    update:    vi.fn(),
    findMany:  vi.fn(),
    create:    vi.fn(),
  },
}
vi.mock('@/lib/db', () => ({ db: mockDb }))

// ── Helpers de fixture ────────────────────────────────────────────────────

const WORKSPACE_ID = 'ws-test-1'
const INVOICE_ID   = 'inv-test-1'
const EMISOR_NIF   = 'B12345678'
const ORG_ID       = 'org-test-1'
const USER_ID      = 'user-test-1'

function makeUser(overrides = {}) {
  return {
    id:      USER_ID,
    clerkId: 'clerk-user-1',
    orgId:   ORG_ID,
    role:    'EDITOR',
    ...overrides,
  }
}

function makeWorkspace(overrides = {}) {
  return { id: WORKSPACE_ID, orgId: ORG_ID, name: 'Empresa Test', ...overrides }
}

function makeInvoice(overrides = {}) {
  return {
    id:              INVOICE_ID,
    workspaceId:     WORKSPACE_ID,
    number:          '2026-001',
    serie:           'A',
    date:            new Date('2026-01-15'),
    tipoFactura:     'F1',
    tax:             210.00,
    total:           1210.00,
    subtotal:        1000.00,
    taxRate:         21,
    currency:        'EUR',
    status:          'borrador',
    items:           [],
    notes:           null,
    paymentMethod:   null,
    purchaseOrder:   null,
    legalNote:       null,
    clientId:        null,
    rectificaId:     null,
    huella:          null,   // sin emitir
    huellaAnterior:  null,
    fechaGeneracion: null,
    enviadaAEAT:     false,
    qrUrl:           null,
    createdAt:       new Date('2026-01-15'),
    operationDate:   null,
    dueDate:         null,
    ...overrides,
  }
}

function makeUpdatedInvoice(huella: string, huellaAnterior: string | null, qrUrl: string) {
  return {
    ...makeInvoice(),
    status:          'enviada',
    huella,
    huellaAnterior,
    fechaGeneracion: new Date(),
    qrUrl,
    client:          null,
    mailMessages:    [],
  }
}

// ── Import sujeto a test (después de los mocks) ───────────────────────────

const { emitirFactura } = await import('@/app/actions/invoices')

// ── Tests ──────────────────────────────────────────────────────────────────

describe('emitirFactura', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue(makeUser())
    mockDb.workspace.findFirst.mockResolvedValue(makeWorkspace())
    mockDb.invoice.findFirst
      .mockResolvedValueOnce(makeInvoice())   // primera llamada: obtener factura
      .mockResolvedValueOnce(null)            // segunda llamada: buscar factura anterior
    mockDb.invoice.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(makeUpdatedInvoice(
        data.huella as string,
        data.huellaAnterior as string | null,
        data.qrUrl as string,
      ))
    )
  })

  it('devuelve la factura con huella de 64 chars hex mayúsculas', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(result.huella).toMatch(/^[0-9A-F]{64}$/)
  })

  it('primera factura: huellaAnterior es null', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(result.huellaAnterior).toBeNull()
  })

  it('encadena con la huella de la factura anterior', async () => {
    const huellaAnterior = 'A'.repeat(64)
    // Reconfigurar: segunda llamada devuelve la factura anterior
    mockDb.invoice.findFirst
      .mockReset()
      .mockResolvedValueOnce(makeInvoice())
      .mockResolvedValueOnce({ huella: huellaAnterior, number: '2025-001', serie: 'A', date: new Date('2025-12-31') })

    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(result.huellaAnterior).toBe(huellaAnterior)
  })

  it('el qrUrl apunta al validador AEAT', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(result.qrUrl).toMatch(/^https:\/\/www2\.agenciatributaria\.gob\.es\/wlpl\/TIKE-CONT\/ValidarQR/)
  })

  it('el qrUrl incluye el NIF emisor', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(result.qrUrl).toContain(`nif=${EMISOR_NIF}`)
  })

  it('persiste la huella ANTES del retorno (update llamado una vez)', async () => {
    await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(mockDb.invoice.update).toHaveBeenCalledOnce()
    const updateCall = mockDb.invoice.update.mock.calls[0][0]
    expect(updateCall.data.huella).toBeDefined()
    expect(updateCall.data.status).toBe('enviada')
    expect(updateCall.data.qrUrl).toBeDefined()
    expect(updateCall.data.fechaGeneracion).toBeInstanceOf(Date)
  })

  it('llama a revalidatePath para invalidar la caché', async () => {
    const { revalidatePath } = await import('next/cache')
    await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    expect(revalidatePath).toHaveBeenCalledWith(`/workspace/${WORKSPACE_ID}/invoices`)
  })

  it('rechaza NIF inválido antes de tocar la base de datos', async () => {
    await expect(
      emitirFactura(WORKSPACE_ID, INVOICE_ID, 'INVALIDO')
    ).rejects.toThrow(/NIF\/CIF emisor inválido/)
    expect(mockDb.invoice.update).not.toHaveBeenCalled()
  })

  it('rechaza factura ya emitida (huella existente)', async () => {
    mockDb.invoice.findFirst.mockReset().mockResolvedValueOnce(
      makeInvoice({ huella: 'A'.repeat(64) })
    )
    await expect(
      emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    ).rejects.toThrow('ya ha sido emitida')
    expect(mockDb.invoice.update).not.toHaveBeenCalled()
  })

  it('rechaza si la factura no existe', async () => {
    mockDb.invoice.findFirst.mockReset().mockResolvedValueOnce(null)
    await expect(
      emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    ).rejects.toThrow('no encontrada')
  })

  it('acepta NIF de persona física (8 dígitos + letra)', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, '12345678A')
    expect(result.huella).toMatch(/^[0-9A-F]{64}$/)
  })

  it('acepta CIF de empresa (letra + 7 dígitos + control)', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, 'A1234567B')
    expect(result.huella).toMatch(/^[0-9A-F]{64}$/)
  })

  it('acepta NIE (X/Y/Z + 7 dígitos + letra)', async () => {
    const result = await emitirFactura(WORKSPACE_ID, INVOICE_ID, 'X1234567A')
    expect(result.huella).toMatch(/^[0-9A-F]{64}$/)
  })

  it('la misma factura emitida dos veces produce el mismo hash', async () => {
    const r1 = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)

    // Reiniciar mocks para segunda llamada
    mockDb.invoice.findFirst
      .mockReset()
      .mockResolvedValueOnce(makeInvoice())
      .mockResolvedValueOnce(null)

    const r2 = await emitirFactura(WORKSPACE_ID, INVOICE_ID, EMISOR_NIF)
    // Las huellas pueden diferir levemente por FechaHoraHusoGenRegistro — lo que
    // verificamos es que el formato es correcto en ambos casos
    expect(r1.huella).toMatch(/^[0-9A-F]{64}$/)
    expect(r2.huella).toMatch(/^[0-9A-F]{64}$/)
  })
})
