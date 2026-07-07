// Registro central de proveedores IA — fuente única de verdad para UI y motor

export interface ProviderModel {
  id: string
  name: string
  contextWindow: number
  maxOutput: number
  inputCostPer1M: number   // USD
  outputCostPer1M: number  // USD
  speed: 'fast' | 'medium' | 'slow'
  quality: 'flagship' | 'high' | 'standard'
  features: string[]
}

export interface ProviderInfo {
  id: string
  name: string
  icon: string
  description: string
  envKey: string
  models: ProviderModel[]
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    description: 'Claude — razonamiento avanzado, contexto masivo, ideal para análisis complejos',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        contextWindow: 1_000_000,
        maxOutput: 64_000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        speed: 'medium',
        quality: 'high',
        features: ['tool-use', 'vision', 'context-1M'],
      },
      {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5',
        contextWindow: 200_000,
        maxOutput: 16_000,
        inputCostPer1M: 1.0,
        outputCostPer1M: 5.0,
        speed: 'fast',
        quality: 'standard',
        features: ['tool-use', 'vision'],
      },
      {
        id: 'claude-opus-4-8',
        name: 'Claude Opus 4.8',
        contextWindow: 1_000_000,
        maxOutput: 128_000,
        inputCostPer1M: 5.0,
        outputCostPer1M: 25.0,
        speed: 'slow',
        quality: 'flagship',
        features: ['tool-use', 'vision', 'thinking', 'context-1M'],
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🌀',
    description: 'GPT — modelos versátiles con amplio conocimiento y ecosistema de plugins',
    envKey: 'OPENAI_API_KEY',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128_000,
        maxOutput: 16_000,
        inputCostPer1M: 2.5,
        outputCostPer1M: 10.0,
        speed: 'medium',
        quality: 'flagship',
        features: ['tool-use', 'vision'],
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o mini',
        contextWindow: 128_000,
        maxOutput: 16_000,
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.6,
        speed: 'fast',
        quality: 'standard',
        features: ['tool-use'],
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✦',
    description: 'Gemini — multimodal nativo, contexto ultra-largo, integración con Google',
    envKey: 'GEMINI_API_KEY',
    models: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        contextWindow: 1_000_000,
        maxOutput: 8_000,
        inputCostPer1M: 0.1,
        outputCostPer1M: 0.4,
        speed: 'fast',
        quality: 'standard',
        features: ['vision', 'context-1M'],
      },
    ],
  },
]

// Determina qué proveedores están disponibles basándose en env vars del servidor
export function getAvailableProviderIds(): string[] {
  return PROVIDERS.filter((p) => !!process.env[p.envKey]).map((p) => p.id)
}

export function getProviderInfo(providerId: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === providerId)
}

export function getModelInfo(providerId: string, modelId: string): ProviderModel | undefined {
  return getProviderInfo(providerId)?.models.find((m) => m.id === modelId)
}

export function getDefaultModel(providerId: string): string {
  const info = getProviderInfo(providerId)
  return info?.models[0]?.id ?? 'claude-sonnet-4-6'
}

// Labels para la UI
export const SPEED_LABELS: Record<string, string> = {
  fast: 'Rápido',
  medium: 'Equilibrado',
  slow: 'Potente',
}

export const QUALITY_LABELS: Record<string, string> = {
  flagship: 'Flagship',
  high: 'Alto',
  standard: 'Estándar',
}

export const OUTPUT_FORMAT_LABELS: Record<string, string> = {
  markdown: 'Markdown',
  plain: 'Texto plano',
  json: 'JSON',
}

export const LANGUAGE_LABELS: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
}
