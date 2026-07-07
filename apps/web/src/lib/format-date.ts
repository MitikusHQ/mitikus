/**
 * Format a date as "27 Jun 2026, 16:42" in the given locale.
 */
export function formatDateTime(date: Date | string, locale: string = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date as "27 Jun 2026" (no time).
 */
export function formatDate(date: Date | string, locale: string = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Returns relative time ("Hace 5 minutos") if within 24 hours,
 * otherwise falls back to formatDate.
 */
export function formatRelativeDate(date: Date | string, locale: string = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)

  if (diffMs < 0) return formatDate(d, locale)

  if (locale === 'es') {
    if (diffMin < 1) return 'Ahora mismo'
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`
    if (diffHr < 24) return `Hace ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`
    return formatDate(d, locale)
  } else {
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
    if (diffHr < 24) return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`
    return formatDate(d, locale)
  }
}
