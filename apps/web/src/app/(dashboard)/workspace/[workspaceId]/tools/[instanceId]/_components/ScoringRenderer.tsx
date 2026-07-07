'use client'

import { useState, useTransition } from 'react'
import type { ScoringConfig } from '@protools/schema'
import { saveScoringRecord } from '@/app/actions/record'

interface Props {
  instanceId: string
  workspaceId: string
  config: ScoringConfig
  defaultScores?: Record<string, number>
  recordId?: string
}

function computeTotal(config: ScoringConfig, scores: Record<string, number>): number {
  const criteria = config.criteria
  const hasWeights = criteria.some((c) => c.weight !== undefined)

  if (hasWeights) {
    let weightedSum = 0
    let totalWeight = 0
    for (const c of criteria) {
      const weight = c.weight ?? 0
      const score = scores[c.id] ?? c.min ?? 1
      weightedSum += score * weight
      totalWeight += weight
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  const values = criteria.map((c) => scores[c.id] ?? c.min ?? 1)
  return values.reduce((a, b) => a + b, 0) / (values.length || 1)
}

const THRESHOLD_COLORS: Record<string, string> = {
  green: 'text-green-700 bg-green-50 border-green-200',
  yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  red: 'text-red-700 bg-red-50 border-red-200',
}

export function ScoringRenderer({
  instanceId,
  workspaceId,
  config,
  defaultScores = {},
  recordId,
}: Props) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const c of config.criteria) {
      init[c.id] = defaultScores[c.id] ?? c.min ?? 1
    }
    return init
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const total = computeTotal(config, scores)
  const threshold = config.thresholds?.find((t) => total >= t.min && total <= t.max)

  // Group criteria by category
  const orderedCategories = [
    ...new Set(config.criteria.map((c) => c.category).filter((c): c is string => !!c)),
  ]
  const grouped: Array<{ name: string; criteria: typeof config.criteria }> = []
  for (const cat of orderedCategories) {
    const catCriteria = config.criteria.filter((c) => c.category === cat)
    if (catCriteria.length > 0) grouped.push({ name: cat, criteria: catCriteria })
  }
  const uncategorized = config.criteria.filter((c) => !c.category)
  if (uncategorized.length > 0) grouped.push({ name: '', criteria: uncategorized })

  function setScore(id: string, value: number) {
    setScores((prev) => ({ ...prev, [id]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveScoringRecord(instanceId, scores, recordId)
      if (result?.error) {
        setError(result.error)
      } else {
        window.location.href = `/workspace/${workspaceId}/tools/${instanceId}`
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Live total */}
      {config.showTotal !== false && (
        <div
          className={`rounded-lg border p-5 text-center ${
            threshold
              ? THRESHOLD_COLORS[threshold.color] ?? 'border-border'
              : 'border-border'
          }`}
        >
          <p className="text-sm text-muted-foreground mb-1">Puntuación total</p>
          <p className="text-5xl font-bold tabular-nums">{total.toFixed(2)}</p>
          {threshold && (
            <p className="text-sm font-semibold mt-2">{threshold.label}</p>
          )}
          {config.passingScore !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo para pasar: {config.passingScore}
            </p>
          )}
        </div>
      )}

      {/* Criteria */}
      {grouped.map((group) => (
        <div key={group.name || '__all__'} className="space-y-4">
          {group.name && (
            <h3 className="text-sm font-semibold text-foreground border-b pb-1">
              {group.name}
            </h3>
          )}
          {group.criteria.map((criterion) => {
            const min = criterion.min ?? 1
            const max = criterion.max ?? 10
            const value = scores[criterion.id] ?? min
            return (
              <div key={criterion.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {criterion.label}
                    {criterion.weight !== undefined && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({Math.round(criterion.weight * 100)}%)
                      </span>
                    )}
                  </label>
                  <span className="text-sm font-bold tabular-nums w-6 text-right">
                    {value}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{min}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={value}
                    onChange={(e) => setScore(criterion.id, Number(e.target.value))}
                    className="flex-1 accent-primary h-2"
                  />
                  <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">
                    {max}
                  </span>
                </div>
                {criterion.helpText && (
                  <p className="text-xs text-muted-foreground">{criterion.helpText}</p>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Threshold legend */}
      {config.thresholds && config.thresholds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.thresholds.map((t) => (
            <span
              key={t.label}
              className={`text-xs px-2 py-1 rounded border ${THRESHOLD_COLORS[t.color] ?? ''}`}
            >
              {t.min}–{t.max}: {t.label}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending
          ? 'Guardando…'
          : recordId
          ? 'Actualizar evaluación'
          : 'Guardar evaluación'}
      </button>
    </div>
  )
}
