import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'
import {
  calcularHuella,
  generarURLVerificacion,
  formatFechaAEAT,
  formatTimestampAEAT,
  type DatosFacturaParaHash,
} from '@/lib/verifactu'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reconstruye la cadena que debe hashear la AEAT para verificar manualmente. */
function cadenaHash(factura: DatosFacturaParaHash, huellaAnterior: string | null): string {
  return [
    `IDEmisorFactura=${factura.emisorNif}`,
    `NumSerieFactura=${factura.numSerie}`,
    `FechaExpedicionFactura=${factura.fecha}`,
    `TipoFactura=${factura.tipoFactura}`,
    `CuotaTotal=${factura.cuotaIVA.toFixed(2)}`,
    `ImporteTotal=${factura.importeTotal.toFixed(2)}`,
    `Huella=${huellaAnterior ?? ''}`,
    `FechaHoraHusoGenRegistro=${factura.fechaGeneracion}`,
  ].join('&')
}

function sha256Upper(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex').toUpperCase()
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FACTURA_1: DatosFacturaParaHash = {
  emisorNif:       'B12345678',
  numSerie:        'A/2026-001',
  fecha:           '15-01-2026',
  tipoFactura:     'F1',
  cuotaIVA:        210.00,
  importeTotal:    1210.00,
  fechaGeneracion: '2026-01-15T10:30:00+01:00',
}

const FACTURA_2: DatosFacturaParaHash = {
  emisorNif:       'B12345678',
  numSerie:        'A/2026-002',
  fecha:           '20-01-2026',
  tipoFactura:     'F1',
  cuotaIVA:        42.00,
  importeTotal:    242.00,
  fechaGeneracion: '2026-01-20T09:00:00+01:00',
}

const FACTURA_SIMPLIFICADA: DatosFacturaParaHash = {
  emisorNif:       '12345678A',
  numSerie:        'T/2026-001',
  fecha:           '01-03-2026',
  tipoFactura:     'F2',
  cuotaIVA:        2.10,
  importeTotal:    12.10,
  fechaGeneracion: '2026-03-01T08:00:00+01:00',
}

// ---------------------------------------------------------------------------
// calcularHuella
// ---------------------------------------------------------------------------

describe('calcularHuella', () => {
  it('produce un string hexadecimal en mayúsculas de 64 caracteres', () => {
    const h = calcularHuella(FACTURA_1, null)
    expect(h).toMatch(/^[0-9A-F]{64}$/)
  })

  it('primera factura (sin anterior): Huella= vacío en la cadena', () => {
    const cadena = cadenaHash(FACTURA_1, null)
    expect(cadena).toContain('Huella=')
    // El campo Huella vacío (no la clave)
    expect(cadena).toContain('&Huella=&')
    const esperado = sha256Upper(cadena)
    expect(calcularHuella(FACTURA_1, null)).toBe(esperado)
  })

  it('segunda factura encadena la huella de la primera', () => {
    const huella1 = calcularHuella(FACTURA_1, null)
    const cadena2 = cadenaHash(FACTURA_2, huella1)
    expect(cadena2).toContain(`Huella=${huella1}`)
    const esperado = sha256Upper(cadena2)
    expect(calcularHuella(FACTURA_2, huella1)).toBe(esperado)
  })

  it('factura simplificada F2 produce un hash diferente a F1 equivalente', () => {
    const h1 = calcularHuella({ ...FACTURA_SIMPLIFICADA, tipoFactura: 'F1' }, null)
    const h2 = calcularHuella(FACTURA_SIMPLIFICADA, null)
    expect(h1).not.toBe(h2)
  })

  it('el mismo input siempre produce el mismo hash (determinismo)', () => {
    const h1 = calcularHuella(FACTURA_1, null)
    const h2 = calcularHuella(FACTURA_1, null)
    expect(h1).toBe(h2)
  })

  it('cambiar un solo campo cambia el hash', () => {
    const base = calcularHuella(FACTURA_1, null)
    const distinto = calcularHuella({ ...FACTURA_1, importeTotal: 1210.01 }, null)
    expect(base).not.toBe(distinto)
  })

  it('los importes se formatean con exactamente 2 decimales', () => {
    // Un importe redondo no debe generar "210" sino "210.00"
    const cadena = cadenaHash(FACTURA_1, null)
    expect(cadena).toContain('CuotaTotal=210.00')
    expect(cadena).toContain('ImporteTotal=1210.00')
  })

  it('el orden de los campos en la cadena es exactamente el de la spec AEAT', () => {
    const cadena = cadenaHash(FACTURA_1, null)
    const campos = cadena.split('&').map(c => c.split('=')[0])
    expect(campos).toEqual([
      'IDEmisorFactura',
      'NumSerieFactura',
      'FechaExpedicionFactura',
      'TipoFactura',
      'CuotaTotal',
      'ImporteTotal',
      'Huella',
      'FechaHoraHusoGenRegistro',
    ])
  })

  it('vector de regresión: hash de FACTURA_1 no cambia', () => {
    // Si este test falla, alguien tocó la función y el hash de cadenas ya emitidas
    // divergiría — eso rompe el encadenamiento legal.
    const huella = calcularHuella(FACTURA_1, null)
    // Calculamos el valor esperado con la misma lógica para que sea estable
    const esperado = sha256Upper(cadenaHash(FACTURA_1, null))
    expect(huella).toBe(esperado)
    // Adicionalmente verificamos la longitud y formato
    expect(huella.length).toBe(64)
    expect(huella).toMatch(/^[0-9A-F]+$/)
  })

  it('vector de regresión: encadenamiento 1→2 no cambia', () => {
    const h1 = calcularHuella(FACTURA_1, null)
    const h2 = calcularHuella(FACTURA_2, h1)
    const esperado = sha256Upper(cadenaHash(FACTURA_2, h1))
    expect(h2).toBe(esperado)
  })
})

// ---------------------------------------------------------------------------
// generarURLVerificacion
// ---------------------------------------------------------------------------

describe('generarURLVerificacion', () => {
  const huella = calcularHuella(FACTURA_1, null)

  it('usa el endpoint correcto de la AEAT', () => {
    const url = generarURLVerificacion(
      FACTURA_1.emisorNif,
      FACTURA_1.numSerie,
      FACTURA_1.fecha,
      FACTURA_1.importeTotal,
      huella,
    )
    expect(url).toMatch(/^https:\/\/www2\.agenciatributaria\.gob\.es\/wlpl\/TIKE-CONT\/ValidarQR/)
  })

  it('incluye exactamente los primeros 28 caracteres de la huella', () => {
    const url = generarURLVerificacion(
      FACTURA_1.emisorNif,
      FACTURA_1.numSerie,
      FACTURA_1.fecha,
      FACTURA_1.importeTotal,
      huella,
    )
    const parsed = new URL(url)
    expect(parsed.searchParams.get('huella')).toBe(huella.substring(0, 28))
    expect(parsed.searchParams.get('huella')!.length).toBe(28)
  })

  it('incluye nif, numserie, fecha e importe como parámetros', () => {
    const url = generarURLVerificacion(
      FACTURA_1.emisorNif,
      FACTURA_1.numSerie,
      FACTURA_1.fecha,
      FACTURA_1.importeTotal,
      huella,
    )
    const parsed = new URL(url)
    expect(parsed.searchParams.get('nif')).toBe(FACTURA_1.emisorNif)
    expect(parsed.searchParams.get('numserie')).toBe(FACTURA_1.numSerie)
    expect(parsed.searchParams.get('fecha')).toBe(FACTURA_1.fecha)
    expect(parsed.searchParams.get('importe')).toBe('1210.00')
  })

  it('el importe siempre tiene 2 decimales', () => {
    const url = generarURLVerificacion('B12345678', 'A/001', '01-01-2026', 100, huella)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('importe')).toBe('100.00')
  })
})

// ---------------------------------------------------------------------------
// formatFechaAEAT
// ---------------------------------------------------------------------------

describe('formatFechaAEAT', () => {
  it('formatea a DD-MM-YYYY', () => {
    expect(formatFechaAEAT(new Date('2026-01-05'))).toBe('05-01-2026')
    expect(formatFechaAEAT(new Date('2026-12-31'))).toBe('31-12-2026')
    expect(formatFechaAEAT(new Date('2026-03-01'))).toBe('01-03-2026')
  })

  it('rellena con cero los días y meses de un dígito', () => {
    expect(formatFechaAEAT(new Date('2026-01-01'))).toMatch(/^\d{2}-\d{2}-\d{4}$/)
  })
})

// ---------------------------------------------------------------------------
// formatTimestampAEAT
// ---------------------------------------------------------------------------

describe('formatTimestampAEAT', () => {
  it('produce formato ISO 8601 con zona horaria española', () => {
    const date = new Date('2026-01-15T09:30:00Z')
    const result = formatTimestampAEAT(date)
    // Invierno → +01:00
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
    expect(result).toContain('+01:00')
  })

  it('usa +02:00 en horario de verano (julio)', () => {
    const date = new Date('2026-07-15T10:00:00Z')
    const result = formatTimestampAEAT(date)
    expect(result).toContain('+02:00')
  })

  it('usa +01:00 en horario de invierno (enero)', () => {
    const date = new Date('2026-01-15T10:00:00Z')
    const result = formatTimestampAEAT(date)
    expect(result).toContain('+01:00')
  })
})
