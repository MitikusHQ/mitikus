'use client'

import { useState, useEffect } from 'react'
import type { SynthesisCache } from '@/app/actions/notebooks'

interface Props {
  notebookId:       string
  initialSynthesis: SynthesisCache | null
  isDirty:          boolean
  hasNoSources:     boolean
  onQuestionClick:  (q: string) => void
  onSynthesisReady: (s: SynthesisCache) => void
}

export function SynthesisPanel({
  notebookId,
  initialSynthesis,
  isDirty,
  hasNoSources,
  onQuestionClick,
  onSynthesisReady,
}: Props) {
  const [synthesis,  setSynthesis]  = useState<SynthesisCache | null>(initialSynthesis)
  const [loading,    setLoading]    = useState(false)
  const [collapsed,  setCollapsed]  = useState(false)
  const [synthError, setSynthError] = useState(false)

  useEffect(() => {
    if (isDirty && !hasNoSources) {
      void generateSynthesis()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateSynthesis() {
    setLoading(true)
    setSynthError(false)
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/synthesize`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as SynthesisCache
        setSynthesis(data)
        onSynthesisReady(data)
      } else {
        setSynthError(true)
      }
    } catch {
      setSynthError(true)
    } finally {
      setLoading(false)
    }
  }

  if (hasNoSources) return null

  return (
    <div className="border-b">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30"
      >
        <span>✦ Síntesis automática</span>
        <span className="text-muted-foreground">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="text-xs text-muted-foreground animate-pulse">Analizando fuentes...</div>
          )}

          {!loading && synthesis && (
            <>
              <p className="text-sm leading-relaxed text-foreground/90">{synthesis.summary}</p>

              {synthesis.keyPoints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Puntos clave</p>
                  <ul className="space-y-1">
                    {synthesis.keyPoints.map((kp, i) => (
                      <li key={i} className="text-xs flex gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {synthesis.suggestedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Preguntas sugeridas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {synthesis.suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => onQuestionClick(q)}
                        className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={generateSynthesis}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Regenerar síntesis
              </button>
            </>
          )}

          {!loading && !synthesis && (
            <div className="space-y-1">
              {synthError && (
                <p className="text-xs text-destructive">No se pudo generar la síntesis.</p>
              )}
              <button
                onClick={generateSynthesis}
                className="text-xs text-primary hover:underline"
              >
                {synthError ? 'Reintentar' : 'Generar síntesis'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
