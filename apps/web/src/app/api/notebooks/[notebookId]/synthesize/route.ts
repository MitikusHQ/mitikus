import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { saveSynthesis } from '@/app/actions/notebooks'

export const runtime     = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notebookId } = await params
  const notebook = await db.notebook.findUnique({
    where:   { id: notebookId },
    include: { sources: { orderBy: { createdAt: 'asc' } } },
  })
  if (!notebook) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (notebook.sources.length === 0) {
    return NextResponse.json({ error: 'No sources' }, { status: 400 })
  }

  const sourcesContext = notebook.sources
    .map((s) => `--- ${s.title.toUpperCase()} ---\n${s.content}`)
    .join('\n\n')

  const prompt = `Analiza los siguientes documentos y devuelve un JSON con esta estructura exacta (sin markdown, solo JSON puro):
{
  "summary": "resumen global de 3-5 párrafos en español",
  "keyPoints": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"],
  "suggestedQuestions": ["pregunta 1", "pregunta 2", "pregunta 3"]
}

Las preguntas sugeridas deben ser preguntas concretas y útiles que alguien podría hacerse sobre este contenido.

DOCUMENTOS:
${sourcesContext}`

  const response = await client.messages.create({
    model:      'claude-sonnet-5-20251001',
    max_tokens: 2048,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  let parsed: { summary: string; keyPoints: string[]; suggestedQuestions: string[] }
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Parse error' }, { status: 500 })
    parsed = JSON.parse(match[0])
  }

  await saveSynthesis(notebookId, JSON.stringify(parsed))

  return NextResponse.json(parsed)
}
