/**
 * OpenAI Provider — implementa AIProvider usando el SDK oficial de OpenAI.
 *
 * Soporta los mismos parámetros que AnthropicProvider para ser
 * intercambiable en el Execution Engine sin cambios en la interfaz.
 */

import OpenAI from 'openai'

interface RunOptions {
  temperature?: number | null
  maxTokens?: number | null
}

export class OpenAIProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async run(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    options?: RunOptions,
  ): Promise<{
    result: string
    inputTokens: number
    outputTokens: number
    durationMs: number
  }> {
    const startMs = Date.now()

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.temperature != null ? { temperature: options.temperature } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    })

    const result = response.choices
      .map((c) => c.message.content ?? '')
      .join('')

    const usage = response.usage

    return {
      result,
      inputTokens:  usage?.prompt_tokens     ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      durationMs:   Date.now() - startMs,
    }
  }
}
