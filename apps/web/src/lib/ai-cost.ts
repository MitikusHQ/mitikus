// Precios por millón de tokens (USD, junio 2026)
// Esta es la fuente única de verdad para billing y display. Actualizar aquí si cambian las tarifas.
const PRICING_USD_PER_1M: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-sonnet-4-6':        { input: 3.0,  output: 15.0 },
  'claude-opus-4-8':          { input: 5.0,  output: 25.0 },
  'claude-haiku-4-5':         { input: 1.0,  output: 5.0  },
  'claude-haiku-4-5-20251001':{ input: 1.0,  output: 5.0  },
  // OpenAI
  'gpt-4o':                   { input: 2.5,  output: 10.0 },
  'gpt-4o-mini':              { input: 0.15, output: 0.6  },
  'o1':                       { input: 15.0, output: 60.0 },
  'o1-mini':                  { input: 3.0,  output: 12.0 },
  // Google
  'gemini-2.0-flash':         { input: 0.1,  output: 0.4  },
}

// Tipo de cambio fijo para estimaciones. No se usa para facturación real.
const EUR_PER_USD = 0.93

export function estimateCostUSD(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = PRICING_USD_PER_1M[model]
  if (!pricing) return 0
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  )
}

export function estimateCostEUR(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  return estimateCostUSD(model, inputTokens, outputTokens) * EUR_PER_USD
}

// Estimación previa a la llamada basada solo en tokens de entrada (útil para preflight checks)
export function estimateGenerationCost(promptCharacters: number): number {
  // Aproximación conservadora: 1 carácter ≈ 0.35 tokens, más ~800 tokens del sistema
  const estimatedInputTokens = Math.ceil(promptCharacters * 0.35) + 800
  const estimatedOutputTokens = 1500 // output típico de un ToolSchema completo
  return estimateCostEUR('claude-sonnet-4-6', estimatedInputTokens, estimatedOutputTokens)
}

export function formatCostEUR(eur: number): string {
  if (eur < 0.0005) return '€0.000'
  return `€${eur.toFixed(3)}`
}
