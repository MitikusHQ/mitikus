import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

/**
 * Valida el header Authorization: Bearer <CRON_SECRET>.
 * Usa timingSafeEqual para evitar timing attacks.
 * Devuelve una respuesta 401 si falla, o null si pasa.
 */
export function checkCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`

  // Pad to same length before comparing to avoid length-based timing leaks
  const a = Buffer.from(authHeader.padEnd(expected.length, '\0'))
  const b = Buffer.from(expected.padEnd(authHeader.length, '\0'))
  const lengthsMatch = authHeader.length === expected.length
  const valuesMatch = timingSafeEqual(a, b)

  if (!lengthsMatch || !valuesMatch) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
