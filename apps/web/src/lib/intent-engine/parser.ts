/**
 * Intent Parser — llama a Claude y obtiene un ParsedIntent.
 *
 * Responsabilidades:
 *   1. Enviar el prompt al modelo
 *   2. Extraer el JSON de la respuesta
 *   3. Sanitizar y validar la estructura
 *   4. Devolver ParsedIntent + usage stats
 *
 * No hace normalización ni resolución de herramientas.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  INTENT_SYSTEM_PROMPT,
  buildIntentUserMessage,
  INTENT_MODEL_CONFIG,
  PROMPT_VERSION,
} from './prompts'
import { extractJsonFromResponse, sanitizeParsedIntent } from './validator'
import type { ParsedIntent } from './types'

export interface ParserOutput {
  parsed:       ParsedIntent
  inputTokens:  number
  outputTokens: number
  modelUsed:    string
  promptVersion: string
}

// Singleton — reutiliza el cliente Anthropic entre llamadas
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

/**
 * Llama a Claude con el input del usuario y devuelve el ParsedIntent + metadata.
 */
export async function parseUserIntent(userInput: string): Promise<ParserOutput> {
  if (!userInput || userInput.trim().length === 0) {
    throw new Error('El input del usuario no puede estar vacío')
  }

  const client = getClient()

  const response = await client.messages.create({
    model:      INTENT_MODEL_CONFIG.model,
    max_tokens: INTENT_MODEL_CONFIG.max_tokens,
    system:     INTENT_SYSTEM_PROMPT,
    messages: [
      {
        role:    'user',
        content: buildIntentUserMessage(userInput),
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude no devolvió contenido de texto')
  }

  const rawJson  = extractJsonFromResponse(textBlock.text)
  const parsed   = sanitizeParsedIntent(rawJson)

  return {
    parsed,
    inputTokens:   response.usage.input_tokens,
    outputTokens:  response.usage.output_tokens,
    modelUsed:     response.model,
    promptVersion: PROMPT_VERSION,
  }
}
