import * as Sentry from '@sentry/nextjs'
import Anthropic from '@anthropic-ai/sdk'
import { searchWorkspace, type BrainFragment } from './brain-search'

export interface BrainResult {
  answer: string
  sources: BrainFragment[]
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres el Brain de MITIKUS — asistente de memoria del workspace.
Tu función es responder preguntas sobre el workspace usando exclusivamente los fragmentos de contexto proporcionados.
Reglas:
- Responde siempre en el idioma de la pregunta del usuario.
- Si la respuesta está en los fragmentos, cítala con claridad y naturalidad.
- Si los fragmentos no contienen la respuesta, di exactamente: "No encontré información sobre esto en tu workspace."
- No inventes datos. No uses conocimiento externo.
- Sé conciso: máximo 3-4 párrafos.`

export async function queryBrain(
  workspaceId: string,
  query: string,
  orgId: string,
): Promise<BrainResult> {
  const sources = await searchWorkspace(workspaceId, query, orgId)

  if (sources.length === 0) {
    return {
      answer: 'No encontré información sobre esto en tu workspace.',
      sources: [],
    }
  }

  const contextBlock = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.excerpt}`)
    .join('\n\n---\n\n')

  const userMessage = `Contexto del workspace:\n\n${contextBlock}\n\n---\n\nPregunta: ${query}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const answer = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    return { answer, sources }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'brain-service' },
      extra: {
        workspaceId,
        orgId,
        query: query.slice(0, 100),
        sourcesCount: sources.length,
      },
    })
    throw err
  }
}
