import * as Sentry from '@sentry/nextjs'
import Anthropic from '@anthropic-ai/sdk'
import { searchWorkspace, type BrainFragment } from './brain-search'

export interface BrainResult {
  answer: string
  sources: BrainFragment[]
  mode: 'evidence' | 'insufficient'  // CLOUD2: audit log field
}

const SYSTEM_PROMPT = `Eres el Brain de MITIKUS — asistente de memoria del workspace.
Tu función es responder preguntas sobre el workspace y sobre como funciona MITIKUS usando exclusivamente los fragmentos de contexto proporcionados.
Los fragmentos pueden incluir memoria privada del workspace o ayuda interna del producto MITIKUS. Si una fuente es ayuda interna, no la presentes como dato privado del usuario.
Reglas:
- Responde siempre en el idioma de la pregunta del usuario.
- Si la respuesta esta en los fragmentos, citala con claridad y naturalidad.
- Si preguntan por una parte de MITIKUS o por una herramienta, explica para que sirve y como encaja en el flujo del producto segun las fuentes de ayuda.
- Si los fragmentos no contienen la respuesta, di exactamente: "No encontré información sobre esto en tu workspace."
- No inventes datos. No uses conocimiento externo.
- Sé conciso: máximo 3-4 párrafos.`

function fallbackAnswer(sources: BrainFragment[]): string {
  const helpSources = sources.filter((source) => source.type === 'help')
  const selectedSources = helpSources.length > 0 ? helpSources : sources.slice(0, 3)

  if (selectedSources.length === 0) {
    return 'No encontré información sobre esto en tu workspace.'
  }

  const intro = helpSources.length > 0
    ? 'Esto es lo que tengo documentado en la ayuda interna de MITIKUS:'
    : 'Esto es lo que encontré en la memoria del workspace:'

  return `${intro}\n\n${selectedSources
    .map((source) => `${source.title}: ${source.excerpt}`)
    .join('\n\n')}`
}

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
      mode: 'insufficient',
    }
  }

  const contextBlock = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.excerpt}`)
    .join('\n\n---\n\n')

  const userMessage = `Contexto del workspace:\n\n${contextBlock}\n\n---\n\nPregunta: ${query}`

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { answer: fallbackAnswer(sources), sources, mode: 'evidence' }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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

    return { answer, sources, mode: 'evidence' }
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
    return { answer: fallbackAnswer(sources), sources, mode: 'evidence' }
  }
}

