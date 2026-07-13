import Anthropic from '@anthropic-ai/sdk'
import type { ToolCategory } from '@prisma/client'
import type { DataSchema } from '@protools/schema'
import { estimateCostEUR } from './ai-cost'
import { buildExecutionPrompts } from './execution-prompts'
import { OpenAIProvider } from './ai-providers/openai'

// ── Provider interface — extensible sin acoplamiento ────────────

export interface ExecutionInput {
  toolName: string
  toolDescription: string
  category: ToolCategory
  fields: DataSchema['fields']
  variables: Record<string, unknown>
  model?: string
  provider?: string
  // Prompt específico de la herramienta
  aiPrompt?: string | null
  // Parámetros de generación (desde ToolInstallationConfig)
  temperature?: number | null
  maxTokens?: number | null
  systemPromptOverride?: string | null
  customInstructions?: string | null
  outputFormat?: string | null
  language?: string | null
  // Contexto de empresa para personalización IA
  companyContextBlock?: string | null
}

export interface ExecutionOutput {
  result: string
  systemPrompt: string
  userPrompt: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  estimatedCostEUR: number
  durationMs: number
}

interface RunOptions {
  temperature?: number | null
  maxTokens?: number | null
}

interface AIProvider {
  run(systemPrompt: string, userPrompt: string, model: string, options?: RunOptions): Promise<{
    result: string
    inputTokens: number
    outputTokens: number
    durationMs: number
  }>
}

// ── Anthropic implementation ────────────────────────────────────

class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic()
  }

  async run(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    options?: RunOptions,
  ) {
    const startMs = Date.now()
    const msg = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.temperature != null ? { temperature: options.temperature } : {}),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const result = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return {
      result,
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
      durationMs: Date.now() - startMs,
    }
  }
}

// ── Provider registry ────────────────────────────────────────────

function getProvider(providerName: string): AIProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider()
    case 'anthropic':
    default:
      return new AnthropicProvider()
  }
}

// ── Public API ──────────────────────────────────────────────────

export async function runToolExecution(input: ExecutionInput): Promise<ExecutionOutput> {
  const model = input.model ?? 'claude-sonnet-4-6'
  const providerName = input.provider ?? 'anthropic'

  const { systemPrompt, userPrompt } = buildExecutionPrompts({
    toolName: input.toolName,
    toolDescription: input.toolDescription,
    category: input.category,
    fields: input.fields,
    variables: input.variables,
    aiPrompt: input.aiPrompt,
    language: input.language,
    outputFormat: input.outputFormat,
    systemPromptOverride: input.systemPromptOverride,
    customInstructions: input.customInstructions,
    companyContextBlock: input.companyContextBlock,
  })

  const provider = getProvider(providerName)
  const { result, inputTokens, outputTokens, durationMs } = await provider.run(
    systemPrompt,
    userPrompt,
    model,
    { temperature: input.temperature, maxTokens: input.maxTokens },
  )

  return {
    result,
    systemPrompt,
    userPrompt,
    model,
    provider: providerName,
    inputTokens,
    outputTokens,
    estimatedCostEUR: estimateCostEUR(model, inputTokens, outputTokens),
    durationMs,
  }
}
