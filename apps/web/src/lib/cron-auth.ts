import { NextResponse } from 'next/server'

/**
 * Valida el header Authorization: Bearer <CRON_SECRET>.
 * Devuelve una respuesta 401 si falla, o null si pasa.
 * Rechaza explícitamente si CRON_SECRET no está configurada.
 */
export function checkCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
