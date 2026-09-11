export type MailTag = 'factura' | 'consulta' | 'soporte' | 'notificacion' | 'otro'

interface TaggableMessage {
  subject: string
  body: string
  fromEmail?: string | null
}

const INVOICE_PATTERNS = [
  /factura/i, /invoice/i, /recibo/i, /receipt/i,
  /pago/i, /cobro/i, /abono/i, /cargo/i,
  /vencimiento/i, /due date/i, /importe/i, /total a pagar/i,
  /fra\./i, /n[uú]m(?:ero)?\.?\s*(?:de\s*)?factura/i,
]

const SUPPORT_PATTERNS = [
  /soporte/i, /support/i, /incidencia/i, /incidence/i,
  /problema/i, /problem/i, /error/i, /fallo/i, /bug/i,
  /no funciona/i, /not working/i, /ayuda/i, /help/i,
  /ticket/i, /caso\s+#/i,
]

const NOTIFICATION_PATTERNS = [
  /notificaci[oó]n/i, /notification/i, /alert[a]?/i,
  /recordatorio/i, /reminder/i, /confirmaci[oó]n/i, /confirmation/i,
  /verificaci[oó]n/i, /verification/i, /no.?reply/i, /noreply/i,
  /newsletter/i, /boletin/i, /subscripci[oó]n/i, /subscription/i,
  /actividad/i, /resumen/i, /weekly digest/i,
]

const QUERY_PATTERNS = [
  /consulta/i, /pregunta/i, /question/i, /question/i,
  /informaci[oó]n/i, /information/i, /duda/i, /saber/i,
  /c[oó]mo\s+(?:puedo|funciona)/i, /how\s+(?:can|does|do)/i,
  /quisiera\s+saber/i, /me\s+podr[ií]as/i, /could\s+you/i,
  /me\s+gustar[ií]a/i, /would\s+like\s+to/i,
]

function match(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text))
}

export function tagMailMessage(msg: TaggableMessage): MailTag {
  const haystack = `${msg.subject ?? ''} ${(msg.body ?? '').slice(0, 500)}`

  if (match(haystack, INVOICE_PATTERNS)) return 'factura'
  if (match(haystack, SUPPORT_PATTERNS)) return 'soporte'
  if (match(haystack, NOTIFICATION_PATTERNS)) return 'notificacion'
  if (match(haystack, QUERY_PATTERNS)) return 'consulta'
  return 'otro'
}

export const TAG_LABELS: Record<MailTag, string> = {
  factura: 'Factura',
  consulta: 'Consulta',
  soporte: 'Soporte',
  notificacion: 'Notif.',
  otro: 'Otro',
}

export const TAG_COLORS: Record<MailTag, string> = {
  factura: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  consulta: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  soporte: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  notificacion: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  otro: 'bg-muted text-muted-foreground',
}
