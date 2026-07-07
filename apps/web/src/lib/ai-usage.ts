/**
 * ai-usage.ts — Helper centralizado para registrar consumo de IA.
 *
 * Uso:
 *   import { recordAIUsage } from '@/lib/ai-usage'
 *   void recordAIUsage({ userId, orgId, workspaceId, model, ... })
 *
 * Siempre fire-and-forget: nunca lanza, nunca bloquea.
 */

import { db } from '@/lib/db'

export interface AIUsageRecord {
  userId:           string
  orgId:            string
  workspaceId:      string
  model:            string
  inputTokens:      number
  outputTokens:     number
  estimatedCostEUR: number
  durationMs:       number
  status:           'success' | 'error'
  errorMessage?:    string | null
}

/**
 * Registra el consumo de IA de forma asíncrona (fire-and-forget).
 * Nunca lanza ni bloquea la operación principal.
 */
export function recordAIUsage(record: AIUsageRecord): void {
  void db.aIUsage
    .create({
      data: {
        userId:           record.userId,
        orgId:            record.orgId,
        workspaceId:      record.workspaceId,
        model:            record.model,
        inputTokens:      record.inputTokens,
        outputTokens:     record.outputTokens,
        totalTokens:      record.inputTokens + record.outputTokens,
        estimatedCostEUR: record.estimatedCostEUR,
        durationMs:       record.durationMs,
        status:           record.status,
        errorMessage:     record.errorMessage ?? null,
        attempts:         1,
      },
    })
    .catch((err: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ai-usage] Error al registrar uso:', err)
      }
    })
}
