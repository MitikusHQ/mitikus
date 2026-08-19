import { createHash } from 'crypto'

export interface DatosFacturaParaHash {
  emisorNif:      string   // NIF del emisor (workspace/autónomo)
  numSerie:       string   // Serie + número, ej: "A/2026-001"
  fecha:          string   // DD-MM-YYYY
  tipoFactura:    string   // F1 | F2 | R1-R5
  cuotaIVA:       number   // importe IVA
  importeTotal:   number   // total factura
  fechaGeneracion: string  // ISO 8601 con zona horaria, ej: "2026-01-15T10:30:00+01:00"
}

/**
 * Calcula el hash SHA-256 según la spec AEAT (RD 1007/2023).
 * El orden de los campos es obligatorio — cualquier variación produce un hash inválido.
 */
export function calcularHuella(
  factura: DatosFacturaParaHash,
  huellaAnterior: string | null,
): string {
  const campos = [
    `IDEmisorFactura=${factura.emisorNif}`,
    `NumSerieFactura=${factura.numSerie}`,
    `FechaExpedicionFactura=${factura.fecha}`,
    `TipoFactura=${factura.tipoFactura}`,
    `CuotaTotal=${factura.cuotaIVA.toFixed(2)}`,
    `ImporteTotal=${factura.importeTotal.toFixed(2)}`,
    `Huella=${huellaAnterior ?? ''}`,
    `FechaHoraHusoGenRegistro=${factura.fechaGeneracion}`,
  ]

  return createHash('sha256')
    .update(campos.join('&'), 'utf8')
    .digest('hex')
    .toUpperCase()
}

/**
 * Genera la URL de verificación AEAT para incluir como QR en el PDF.
 * Usa solo los primeros 28 caracteres de la huella (requisito AEAT).
 */
export function generarURLVerificacion(
  emisorNif: string,
  numSerie: string,
  fecha: string,       // DD-MM-YYYY
  importeTotal: number,
  huella: string,
): string {
  const params = new URLSearchParams({
    nif:      emisorNif,
    numserie: numSerie,
    fecha,
    importe:  importeTotal.toFixed(2),
    huella:   huella.substring(0, 28),
  })
  return `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?${params}`
}

/**
 * Formatea una fecha a DD-MM-YYYY para el campo FechaExpedicionFactura del hash.
 */
export function formatFechaAEAT(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

/**
 * Formatea un timestamp a ISO 8601 con zona horaria España (CET/CEST).
 * Necesario para FechaHoraHusoGenRegistro.
 */
export function formatTimestampAEAT(date: Date): string {
  return date.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' }).replace(' ', 'T') +
    (isVeranoEspana(date) ? '+02:00' : '+01:00')
}

function isVeranoEspana(date: Date): boolean {
  // Aproximación: horario de verano España es último domingo de marzo → último domingo de octubre
  const year = date.getFullYear()
  const lastSundayMarch  = lastSundayOf(year, 2)
  const lastSundayOctober = lastSundayOf(year, 9)
  return date >= lastSundayMarch && date < lastSundayOctober
}

function lastSundayOf(year: number, month: number): Date {
  const d = new Date(year, month + 1, 0) // último día del mes
  d.setDate(d.getDate() - d.getDay())    // retroceder al domingo
  return d
}
