import { expect, it, vi } from 'vitest'

// Happy-path huella/qrUrl and already-emitted guards: emitir-factura.test.ts.
// The action accepts the fiscal NIF as an argument; it does not read it from DB.
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-smoke' }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/pmf-analytics', () => ({
  trackInvoiceCreated: vi.fn(), trackInvoiceEmitted: vi.fn(), trackInvoiceSent: vi.fn(),
}))
vi.mock('@/lib/mail/delivery', () => ({ deliverMailMessage: vi.fn() }))
vi.mock('@/lib/mail/inbox-sync', () => ({ syncInboxForWorkspace: vi.fn() }))
vi.mock('@/lib/crypto', () => ({ decryptSafe: vi.fn((value: string) => value) }))
const mockDb = {
  user: { findUnique: vi.fn().mockResolvedValue({ id: 'user', orgId: 'org', role: 'EDITOR' }) },
  workspace: { findFirst: vi.fn().mockResolvedValue({ id: 'ws', orgId: 'org' }) },
  invoice: { findFirst: vi.fn(), update: vi.fn() },
}
vi.mock('@/lib/db', () => ({ db: mockDb }))
const { emitirFactura } = await import('@/app/actions/invoices')

it('rejects an absent fiscal NIF before reading or updating invoices', async () => {
  await expect(emitirFactura('ws', 'invoice', '')).rejects.toThrow(/NIF\/CIF emisor inválido/)
  expect(mockDb.invoice.findFirst).not.toHaveBeenCalled()
  expect(mockDb.invoice.update).not.toHaveBeenCalled()
})
