import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { updateNotebookTitle } from '@/app/actions/notebooks'

export const runtime     = 'nodejs'
export const maxDuration = 30

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
    include: { sources: { orderBy: { createdAt: 'asc' }, take: 1 } },
  })
  if (!notebook || notebook.sources.length === 0) {
    return NextResponse.json({ error: 'No sources' }, { status: 400 })
  }

  const firstSource = notebook.sources[0]!
  const preview = firstSource.content.slice(0, 2000)

  const response = await client.messages.create({
    model:      'claude-sonnet-5-20251001',
    max_tokens: 60,
    messages:   [{
      role:    'user',
      content: `Basándote en el siguiente texto, genera un título corto y descriptivo (máximo 60 caracteres, en español, sin comillas). Solo devuelve el título, nada más.\n\n${preview}`,
    }],
  })

  const title = response.content[0]?.type === 'text'
    ? (response.content[0] as { type: 'text'; text: string }).text.trim().slice(0, 60)
    : 'Nuevo notebook'

  await updateNotebookTitle(notebookId, title)

  return NextResponse.json({ title })
}
