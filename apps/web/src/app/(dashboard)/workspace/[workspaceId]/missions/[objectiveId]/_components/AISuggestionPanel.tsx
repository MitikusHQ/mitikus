'use client'

import { useState } from 'react'
import type { AIRecommendation } from '@/lib/missions/types'

interface Props {
  objectiveId:    string
  workspaceId:    string
  initialRecommendations: AIRecommendation[] | null
  missionCompleted: boolean
}

export function AISuggestionPanel({ objectiveId, initialRecommendations, missionCompleted }: Props) {
  const [recommendations, setRecommendations] = useState(initialRecommendations ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestSuggestion() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/missions/${objectiveId}/ai-suggestion`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json() as { recommendations: AIRecommendation[] }
      setRecommendations(data.recommendations)
    } catch {
      setError('No se pudo generar la sugerencia. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {missionCompleted ? 'Recomendamos a continuación' : 'Sugerencia de IA'}
        </h2>
        <button
          onClick={requestSuggestion}
          disabled={loading}
          className="text-xs text-primary hover:underline font-medium disabled:opacity-40"
        >
          {loading ? 'Pensando…' : recommendations.length > 0 ? '💡 Regenerar' : '💡 Pedir sugerencia IA'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {recommendations.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {missionCompleted
            ? 'Generando recomendaciones de próximas misiones…'
            : 'Pide una sugerencia si dudas sobre cómo continuar.'}
        </p>
      ) : (
        <ol className="space-y-2">
          {recommendations.map((rec, i) => (
            <li key={`${rec.title}-${i}`} className="text-sm">
              <span className="font-medium">{i + 1}. {rec.title}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
