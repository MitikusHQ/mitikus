'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { BusinessContext } from '@/lib/business-memory/memory-types'
import type {
  CopilotResponse,
  CopilotPhase,
  CopilotSuggestion,
  PlanSummary,
  CopilotAction,
} from '@/lib/business-copilot'

interface Props {
  workspaceId:        string
  userId:             string
  initialContext:     BusinessContext
  initialSuggestions: CopilotSuggestion[]
  initialMessage?:    string
}

interface UIState {
  conversationId: string | null
  phase:          CopilotPhase | null
  message:        string | null
  question:       string | null
  plans:          PlanSummary[]
  suggestions:    CopilotSuggestion[]
  actions:        CopilotAction[]
  workflowId:     string | null
  objectiveId:    string | null
  loading:        boolean
  error:          string | null
}

const INITIAL_STATE: UIState = {
  conversationId: null,
  phase:          null,
  message:        null,
  question:       null,
  plans:          [],
  suggestions:    [],
  actions:        [],
  workflowId:     null,
  objectiveId:    null,
  loading:        false,
  error:          null,
}

export function CopilotInterface({
  workspaceId,
  userId,
  initialContext,
  initialSuggestions,
  initialMessage,
}: Props) {
  const router = useRouter()
  const [ui, setUi]          = useState<UIState>({ ...INITIAL_STATE, suggestions: initialSuggestions })
  const [input, setInput]    = useState('')
  const [isPending, startTransition] = useTransition()
  const autoSentRef = useRef(false)

  const isLoading = ui.loading || isPending

  // Auto-start con contexto de empresa cuando viene de FirstTimeExperience
  useEffect(() => {
    if (initialMessage && !autoSentRef.current) {
      autoSentRef.current = true
      void startWithCompanyContext(initialMessage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startWithCompanyContext(companyDescription: string) {
    setUi((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/copilot/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ workspaceId, companyDescription }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
      // Refrescar Server Components para que la tarjeta EMPRESA refleje el contexto guardado
      router.refresh()
    } catch {
      setUi((s) => ({ ...s, loading: false, error: 'Error de conexión.' }))
    }
  }

  // ── Start session ─────────────────────────────────────────────

  async function handleStart() {
    setUi((s) => ({ ...s, loading: true, error: null }))

    try {
      const res = await fetch('/api/copilot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ workspaceId }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
    } catch (err) {
      setUi((s) => ({ ...s, loading: false, error: 'Error de conexión. Intenta de nuevo.' }))
    }
  }

  // ── Send message ──────────────────────────────────────────────

  async function sendMessage(msg: string) {
    if (!msg || isLoading) return

    setUi((s) => ({ ...s, loading: true, error: null }))

    try {
      // Si no hay conversación activa, iniciar primero
      const convId = ui.conversationId ?? await (async () => {
        const startRes  = await fetch('/api/copilot/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ workspaceId }),
        })
        const startData: CopilotResponse = await startRes.json()
        applyResponse(startData)
        return startData.conversationId
      })()

      if (!convId) return

      const res = await fetch('/api/copilot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ conversationId: convId, workspaceId, message: msg }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
    } catch {
      setUi((s) => ({ ...s, loading: false, error: 'Error de conexión.' }))
    }
  }

  async function handleSend() {
    const msg = input.trim()
    if (!msg) return
    setInput('')
    await sendMessage(msg)
  }

  // ── Select suggestion ─────────────────────────────────────────

  async function handleSuggestion(suggestion: CopilotSuggestion) {
    const goal = suggestion.label
    setInput(goal)
  }

  // ── Select plan ───────────────────────────────────────────────

  async function handleSelectPlan(planId: string) {
    if (!ui.conversationId || isLoading) return
    setUi((s) => ({ ...s, loading: true, error: null }))

    try {
      const res = await fetch('/api/copilot/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          conversationId: ui.conversationId,
          workspaceId,
          planId,
        }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
    } catch {
      setUi((s) => ({ ...s, loading: false, error: 'Error seleccionando plan.' }))
    }
  }

  // ── Reset ─────────────────────────────────────────────────────

  function handleReset() {
    setUi({ ...INITIAL_STATE, suggestions: initialSuggestions })
    setInput('')
  }

  // ── Apply response ────────────────────────────────────────────

  function applyResponse(data: CopilotResponse) {
    setUi({
      conversationId: data.conversationId,
      phase:          data.phase,
      message:        data.message,
      question:       data.question,
      plans:          data.plans,
      suggestions:    data.suggestions.length > 0 ? data.suggestions : ui.suggestions,
      actions:        data.actions,
      workflowId:     data.workflowId,
      objectiveId:    data.objectiveId ?? null,
      loading:        false,
      error:          null,
    })
  }

  // ── Keyboard handler ──────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  const showSuggestions = !ui.phase || ui.phase === 'greeting'
  const showPlans       = ui.plans.length > 0 && ui.phase === 'planning'
  const showWorkflow    = ui.phase === 'workflow_ready'

  return (
    <div className="rounded-lg border bg-card flex flex-col min-h-[520px]">

      {/* Response area */}
      <div className="flex-1 p-6 space-y-6">

        {/* Initial state — before conversation starts */}
        {!ui.message && !isLoading && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Dime en qué objetivo quieres trabajar hoy o elige una de las sugerencias. Lo convertiré en una misión con pasos claros, lista en Mission Control.
            </p>
            {ui.suggestions.length > 0 && (
              <SuggestionsPanel
                suggestions={ui.suggestions}
                onSelect={handleSuggestion}
              />
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingDots />
            <span>Analizando…</span>
          </div>
        )}

        {/* Copilot message */}
        {ui.message && !isLoading && (
          <div className="space-y-4">
            <CopilotMessage message={ui.message} phase={ui.phase} />

            {/* Clarifying question options */}
            {ui.phase === 'clarifying' && ui.question && (
              <ClarifyingOptions
                question={ui.question}
                onSelect={(opt) => setInput(opt)}
              />
            )}

            {/* Plans */}
            {showPlans && (
              <PlansPanel
                plans={ui.plans}
                onSelect={handleSelectPlan}
              />
            )}

            {/* Workflow ready */}
            {showWorkflow && (
              <WorkflowReadyPanel objectiveId={ui.objectiveId} workspaceId={workspaceId} />
            )}

            {/* Error */}
            {ui.error && (
              <p className="text-sm text-destructive">{ui.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Input area */}
      <div className="p-4 space-y-3">
        {/* Suggestions chips — only when in greeting or not started */}
        {showSuggestions && !isLoading && ui.suggestions.length > 0 && ui.message && (
          <div className="flex flex-wrap gap-2">
            {ui.suggestions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              ui.phase === 'clarifying'
                ? 'Responde la pregunta anterior o escribe tu respuesta…'
                : 'Describe el objetivo de tu empresa…'
            }
            rows={2}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Enviar
            </button>
            {ui.phase && ui.phase !== 'greeting' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-md border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Reiniciar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function CopilotMessage({ message, phase }: { message: string; phase: CopilotPhase | null }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[10px]">
          DO
        </span>
        <span>Director de Operaciones</span>
      </div>
      <div className="pl-7 text-sm leading-relaxed whitespace-pre-line">
        {message}
      </div>
    </div>
  )
}

function SuggestionsPanel({
  suggestions,
  onSelect,
}: {
  suggestions: CopilotSuggestion[]
  onSelect: (s: CopilotSuggestion) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Sugerencias para tu empresa
      </p>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">{s.icon}</span>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ClarifyingOptions({
  question,
  onSelect,
}: {
  question: string
  onSelect: (opt: string) => void
}) {
  return (
    <div className="pl-7 space-y-2">
      <p className="text-xs text-muted-foreground">Opciones rápidas:</p>
      <div className="flex flex-wrap gap-2">
        {/* Las opciones vienen del question pero las pasamos via message text */}
        {/* El usuario también puede escribir libremente */}
      </div>
    </div>
  )
}

function PlansPanel({
  plans,
  onSelect,
}: {
  plans: PlanSummary[]
  onSelect: (planId: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Estrategias disponibles
      </p>
      <div className="space-y-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border p-4 space-y-3 ${
              plan.isRecommended ? 'border-primary/40 bg-primary/5' : 'bg-background'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{plan.label}</h3>
                  {plan.isRecommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      Recomendada
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{plan.totalTools} pasos</span>
              <span>~{plan.estimatedDays} día{plan.estimatedDays !== 1 ? 's' : ''}</span>
              <span className={`font-medium ${
                plan.riskLevel === 'low'    ? 'text-green-600' :
                plan.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                Riesgo {plan.riskLevel === 'low' ? 'bajo' : plan.riskLevel === 'medium' ? 'medio' : 'alto'}
              </span>
              <span className="ml-auto font-semibold text-foreground">{plan.score}/100</span>
            </div>

            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {plan.reasoning}
            </p>

            <button
              onClick={() => onSelect(plan.id)}
              className="w-full mt-1 px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              Elegir esta estrategia
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowReadyPanel({
  objectiveId,
  workspaceId,
}: {
  objectiveId: string | null
  workspaceId: string
}) {
  const missionUrl = objectiveId
    ? `/workspace/${workspaceId}/missions/${objectiveId}`
    : `/workspace/${workspaceId}`

  return (
    <div className="rounded-lg border border-green-600/20 bg-green-50/50 dark:bg-green-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-green-600 text-lg">✓</span>
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Misión creada con todos sus pasos
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Los pasos del plan están listos en Mission Control. Puedes ajustarlos y empezar cuando quieras.
      </p>
      <div className="flex items-center gap-4">
        <a
          href={missionUrl}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ver la misión →
        </a>
        <a
          href={`/workspace/${workspaceId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Mission Control
        </a>
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}
