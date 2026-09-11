import { describe, it, expect } from 'vitest'
import { tagMailMessage, TAG_LABELS, TAG_COLORS, type MailTag } from '../mail-tagger'

// ---------------------------------------------------------------------------
// tagMailMessage
// ---------------------------------------------------------------------------

describe('tagMailMessage', () => {
  // factura
  it('classifies "Factura" in subject as factura', () => {
    expect(tagMailMessage({ subject: 'Factura nº 2024/001', body: '' })).toBe('factura')
  })

  it('classifies "invoice" (English) in subject as factura', () => {
    expect(tagMailMessage({ subject: 'Your invoice #123', body: '' })).toBe('factura')
  })

  it('classifies "recibo" in body as factura', () => {
    expect(tagMailMessage({ subject: 'Gracias', body: 'Adjunto tu recibo de pago.' })).toBe('factura')
  })

  it('classifies "Fra." abbreviation as factura', () => {
    expect(tagMailMessage({ subject: 'Fra. 2024-005', body: '' })).toBe('factura')
  })

  it('classifies "total a pagar" in body as factura', () => {
    expect(tagMailMessage({ subject: 'Aviso', body: 'El total a pagar es 120€.' })).toBe('factura')
  })

  // soporte
  it('classifies "soporte" in subject as soporte', () => {
    expect(tagMailMessage({ subject: 'Solicitud de soporte técnico', body: '' })).toBe('soporte')
  })

  it('classifies "support" in subject as soporte', () => {
    expect(tagMailMessage({ subject: 'Support request #456', body: '' })).toBe('soporte')
  })

  it('classifies "no funciona" in body as soporte', () => {
    expect(tagMailMessage({ subject: 'Problema', body: 'La aplicación no funciona desde ayer.' })).toBe('soporte')
  })

  it('classifies "bug" in body as soporte', () => {
    expect(tagMailMessage({ subject: 'Aviso técnico', body: 'Parece un bug en el sistema de login.' })).toBe('soporte')
  })

  it('classifies "ticket" in subject as soporte', () => {
    expect(tagMailMessage({ subject: 'Ticket #9988 abierto', body: '' })).toBe('soporte')
  })

  // notificacion
  it('classifies "notificación" in subject as notificacion', () => {
    expect(tagMailMessage({ subject: 'Notificación de actividad', body: '' })).toBe('notificacion')
  })

  it('classifies "noreply" sender domain as notificacion', () => {
    expect(tagMailMessage({ subject: 'Confirmación de pedido', body: 'noreply@shop.com ha enviado este mensaje.' })).toBe('notificacion')
  })

  it('classifies "newsletter" in body as notificacion', () => {
    expect(tagMailMessage({ subject: 'Novedades', body: 'Este newsletter llega cada semana.' })).toBe('notificacion')
  })

  it('classifies "recordatorio" as notificacion', () => {
    expect(tagMailMessage({ subject: 'Recordatorio: reunión mañana', body: '' })).toBe('notificacion')
  })

  it('classifies "reminder" as notificacion', () => {
    expect(tagMailMessage({ subject: 'Reminder: meeting tomorrow', body: '' })).toBe('notificacion')
  })

  // consulta
  it('classifies "consulta" in subject as consulta', () => {
    expect(tagMailMessage({ subject: 'Consulta sobre precios', body: '' })).toBe('consulta')
  })

  it('classifies "how can" in body as consulta', () => {
    expect(tagMailMessage({ subject: 'Question', body: 'How can I export my data?' })).toBe('consulta')
  })

  it('classifies "quisiera saber" as consulta', () => {
    expect(tagMailMessage({ subject: 'Hola', body: 'Quisiera saber cuándo estará disponible el servicio.' })).toBe('consulta')
  })

  // otro
  it('returns otro for unrecognised content', () => {
    expect(tagMailMessage({ subject: 'Hola equipo', body: 'Reunión el lunes a las 10h.' })).toBe('otro')
  })

  it('returns otro for empty subject and body', () => {
    expect(tagMailMessage({ subject: '', body: '' })).toBe('otro')
  })

  // priority: factura beats everything else
  it('factura takes priority over soporte when both match', () => {
    expect(tagMailMessage({ subject: 'Problema con factura', body: '' })).toBe('factura')
  })

  // body truncation: only first 500 chars are checked
  it('ignores patterns beyond 500 chars in body', () => {
    const longBody = 'x'.repeat(600) + ' factura'
    expect(tagMailMessage({ subject: '', body: longBody })).toBe('otro')
  })

  it('matches patterns within first 500 chars of body', () => {
    const body = 'Adjunto la factura ' + 'y'.repeat(480)
    expect(tagMailMessage({ subject: '', body })).toBe('factura')
  })
})

// ---------------------------------------------------------------------------
// TAG_LABELS
// ---------------------------------------------------------------------------

describe('TAG_LABELS', () => {
  const tags: MailTag[] = ['factura', 'consulta', 'soporte', 'notificacion', 'otro']

  it('has a label for every MailTag', () => {
    for (const tag of tags) {
      expect(TAG_LABELS[tag]).toBeTruthy()
    }
  })

  it('label values are non-empty strings', () => {
    for (const tag of tags) {
      expect(typeof TAG_LABELS[tag]).toBe('string')
      expect(TAG_LABELS[tag].length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// TAG_COLORS
// ---------------------------------------------------------------------------

describe('TAG_COLORS', () => {
  const tags: MailTag[] = ['factura', 'consulta', 'soporte', 'notificacion', 'otro']

  it('has a color class for every MailTag', () => {
    for (const tag of tags) {
      expect(TAG_COLORS[tag]).toBeTruthy()
    }
  })

  it('color classes contain Tailwind bg- prefix', () => {
    for (const tag of tags) {
      expect(TAG_COLORS[tag]).toMatch(/bg-/)
    }
  })
})
