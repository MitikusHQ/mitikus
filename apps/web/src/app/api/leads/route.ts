/**
 * POST /api/leads — captura el formulario de "Solicitar demo" de la landing.
 * Ruta pública (no requiere sesión) — un lead todavía no es un usuario.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Rate limit: 5 peticiones por IP cada 10 minutos
const ipHits = new Map<string, { count: number; resetAt: number }>()
const LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.' },
      { status: 429 },
    )
  }

  let body: { name?: string; email?: string; company?: string; message?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const name = body.name?.trim().slice(0, 200)
  const email = body.email?.trim().toLowerCase().slice(0, 200)
  const company = body.company?.trim().slice(0, 200) || null
  const message = body.message?.trim().slice(0, 2000) || null

  if (!name || !email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Nombre y un email válido son obligatorios.' }, { status: 400 })
  }

  await db.lead.create({
    data: { name, email, company, message, source: 'landing' },
  })

  return NextResponse.json({ ok: true })
}
