import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

export const runtime    = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response('Unauthorized', { status: 401 })

  const { notebookId } = await params
  const body = await req.json().catch(() => ({})) as { message?: string }
  if (!body.message) return new Response('message required', { status: 400 })

  const notebook = await db.notebook.findUnique({
    where:   { id: notebookId },
    include: {
      sources:  { orderBy: { createdAt: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' }, take: 20 },
    },
  })
  if (!notebook) return new Response('Not found', { status: 404 })

  const sourcesContext = notebook.sources
    .map((s) => `--- ${s.title.toUpperCase()} ---\n${s.content}`)
    .join('\n\n')

  const systemPrompt = `Eres un asistente que analiza documentos y responde preguntas basándote exclusivamente en el contenido de las fuentes proporcionadas. Si la respuesta no está en las fuentes, indícalo explícitamente.

FUENTES DISPONIBLES:

${sourcesContext}`

  const history: Anthropic.MessageParam[] = notebook.messages.map((m) => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content,
  }))
  history.push({ role: 'user', content: body.message })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const response = await client.messages.create({
          model:      'claude-sonnet-5-20251001',
          max_tokens: 2048,
          system:     systemPrompt,
          messages:   history,
          stream:     true,
        })
        for await (const chunk of response) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\nError: ${err instanceof Error ? err.message : 'Error desconocido'}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
