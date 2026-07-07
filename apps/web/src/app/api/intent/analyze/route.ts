import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { analyzeIntent } from '@/lib/intent-engine'

export const runtime    = 'nodejs'
export const maxDuration = 30

interface AnalyzeIntentBody {
  input:        string
  workspaceId?: string
}

export async function POST(req: NextRequest) {
  // Auth
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // API key guard
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Servicio de IA no configurado' },
      { status: 503 },
    )
  }

  // Parse body
  let body: AnalyzeIntentBody
  try {
    body = await req.json() as AnalyzeIntentBody
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const input = body.input?.trim()
  if (!input || input.length < 5) {
    return NextResponse.json(
      { error: 'El input debe tener al menos 5 caracteres' },
      { status: 422 },
    )
  }

  if (input.length > 2000) {
    return NextResponse.json(
      { error: 'El input no puede superar 2000 caracteres' },
      { status: 422 },
    )
  }

  try {
    const result = await analyzeIntent(input)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno del Intent Engine'
    console.error('[POST /api/intent/analyze]', message)
    return NextResponse.json({ error: 'Error al analizar la intención. Inténtalo de nuevo.' }, { status: 500 })
  }
}
