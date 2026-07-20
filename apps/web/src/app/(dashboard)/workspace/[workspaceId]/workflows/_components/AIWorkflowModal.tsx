'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'context' | 'questions' | 'preview'

interface GeneratedNode {
  toolId: string
  toolSlug: string
  toolName: string
  label: string
  reason: string
  needsInstall: boolean
}

interface Props {
  workspaceId: string
  trigger?: React.ReactNode
}

export function AIWorkflowModal({ workspaceId, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!trigger)
  const [step, setStep] = useState<Step>('context')

  const [objective, setObjective] = useState('')
  const [sector, setSector] = useState('')

  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])

  const [workflowName, setWorkflowName] = useState('')
  const [nodes, setNodes] = useState<GeneratedNode[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGetQuestions() {
    if (!objective.trim() || !sector.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'questions', objective, sector }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setQuestions(data.questions)
      setAnswers(data.questions.map(() => ''))
      setStep('questions')
    } catch { setError('Error de red') } finally { setLoading(false) }
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'generate', objective, sector, answers, workspaceId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setWorkflowName(data.workflowName)
      setNodes(data.nodes)
      setStep('preview')
    } catch { setError('Error de red') } finally { setLoading(false) }
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workflows/generate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, workflowName, nodes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(`/workspace/${workspaceId}/workflows/${data.workflowId}`)
    } catch { setError('Error de red') } finally { setLoading(false) }
  }

  function reset() {
    setLoading(false)
    setStep('context')
    setObjective('')
    setSector('')
    setQuestions([])
    setAnswers([])
    setWorkflowName('')
    setNodes([])
    setError(null)
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-lg space-y-5 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h2 className="text-base font-semibold">Generar workflow</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 'context' && 'Describe el proceso que quieres automatizar'}
              {step === 'questions' && 'La IA necesita un poco más de contexto'}
              {step === 'preview' && 'Revisa el workflow antes de crearlo'}
            </p>
          </div>
          {trigger && (
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          )}
        </div>

        {step === 'context' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Objetivo del workflow *</label>
              <input
                autoFocus
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="ej. Onboarding de nuevos clientes"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Sector o tipo de empresa *</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="ej. Consultoría IT, Retail, RRHH"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={100}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              {trigger && (
                <button onClick={() => setOpen(false)} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                  Cancelar
                </button>
              )}
              <button
                onClick={handleGetQuestions}
                disabled={loading || !objective.trim() || !sector.trim()}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Entendiendo tu proceso...' : 'Siguiente →'}
              </button>
            </div>
          </div>
        )}

        {step === 'questions' && (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-xs font-medium">{q}</label>
                <input
                  type="text"
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers((prev) => prev.map((a, idx) => idx === i ? e.target.value : a))}
                  placeholder="Tu respuesta..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep('context')} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                ← Volver
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Pensando en las mejores herramientas para ti...' : 'Generar workflow ✨'}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre del workflow</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pasos del workflow ({nodes.length})</p>
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {nodes.map((node, i) => (
                  <div key={`${node.toolId}-${i}`} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{node.label}</span>
                        {node.needsInstall && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            Se instalará
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{node.toolName} — {node.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
              {nodes.some((n) => n.needsInstall) && (
                <p className="text-xs text-muted-foreground">
                  Las herramientas marcadas se instalarán automáticamente en tu workspace.
                </p>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={reset} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                ← Volver a editar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? '¡Casi listo! Montando tu workflow...' : 'Crear workflow →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )

  if (!trigger) return open ? modalContent : null

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && modalContent}
    </>
  )
}
