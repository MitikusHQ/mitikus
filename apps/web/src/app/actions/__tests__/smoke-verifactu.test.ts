import { expect, it } from 'vitest'
import { calcularHuella, type DatosFacturaParaHash } from '@/lib/verifactu'

// lib/__tests__/verifactu.test.ts already covers determinism, QR's 28-char
// prefix, and sensitivity to tipoFactura/importeTotal. Check remaining inputs.
const invoice: DatosFacturaParaHash = {
  emisorNif: 'B12345678', numSerie: 'A/2026-001', fecha: '15-01-2026',
  tipoFactura: 'F1', cuotaIVA: 210, importeTotal: 1210,
  fechaGeneracion: '2026-01-15T10:30:00+01:00',
}
const changes: Array<[string, Partial<DatosFacturaParaHash>]> = [
  ['emisorNif', { emisorNif: 'B87654321' }],
  ['numSerie', { numSerie: 'A/2026-002' }],
  ['fecha', { fecha: '16-01-2026' }],
  ['cuotaIVA', { cuotaIVA: 210.01 }],
  ['fechaGeneracion', { fechaGeneracion: '2026-01-15T10:30:01+01:00' }],
]

it.each(changes)('changes the hash when only %s changes', (_field, change) => {
  expect(calcularHuella({ ...invoice, ...change }, null)).not.toBe(calcularHuella(invoice, null))
})

it('changes the hash when only the previous hash changes', () => {
  expect(calcularHuella(invoice, 'A'.repeat(64))).not.toBe(calcularHuella(invoice, null))
})
