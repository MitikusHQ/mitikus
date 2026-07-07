/**
 * POST /api/leads — captura el formulario de "Solicitar demo" de la landing.
 * Ruta pública (no requiere sesión) — un lead todavía no es un usuario.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
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
