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
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

// ── Types ─────────────────────────────────────────────────────────

interface ChatMessage {
  role:    'user' | 'assistant'
  text:    string
  phase?:  CopilotPhase | null
}

interface UIState {
  conversationId: string | null
  phase:          CopilotPhase | null
  question:       string | null
  plans:          PlanSummary[]
  suggestions:    CopilotSuggestion[]
  actions:        CopilotAction[]
  workflowId:     string | null
  objectiveId:    string | null
  loading:        boolean
  error:          string | null
}

const INITIAL_UI: UIState = {
  conversationId: null,
  phase:          null,
  question:       null,
  plans:          [],
  suggestions:    [],
  actions:        [],
  workflowId:     null,
  objectiveId:    null,
  loading:        false,
  error:          null,
}

interface Props {
  workspaceId:         string
  userId:              string
  initialContext:      BusinessContext
  initialSuggestions:  CopilotSuggestion[]
  initialMessage?:     string
  locale:              Locale
}

function quickStartPrompts(t: DashboardTranslations) {
  return [
    t.copilotInitialPromptAgency,
    t.copilotInitialPromptHr,
    t.copilotInitialPromptEcommerce,
    t.copilotInitialPromptLaw,
  ]
}

function translatedRiskLevel(level: PlanSummary['riskLevel'], t: DashboardTranslations): string {
  return ({
    low:    t.copilotRiskLow,
    medium: t.copilotRiskMedium,
    high:   t.copilotRiskHigh,
  } as Record<string, string>)[level] ?? level
}

// ── Main component ─────────────────────────────────────────────────

export function CopilotInterface({
  workspaceId,
  userId,
  initialContext,
  initialSuggestions,
  initialMessage,
  locale,
}: Props) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [ui, setUi]             = useState<UIState>({ ...INITIAL_UI, suggestions: initialSuggestions })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [isPending, startTransition] = useTransition()
  const autoSentRef  = useRef(false)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)

  const isLoading = ui.loading || isPending

  // Auto-focus al montar
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, ui.loading])

  // Auto-start con contexto de empresa cuando viene de FirstTimeExperience
  useEffect(() => {
    if (initialMessage && !autoSentRef.current) {
      autoSentRef.current = true
      void startWithCompanyContext(initialMessage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── API helpers ────────────────────────────────────────────────

  async function startWithCompanyContext(companyDescription: string) {
    pushUserMessage(companyDescription)
    setUi((s) => ({ ...s, loading: true, error: null }))
    try {
      const res  = await fetch('/api/copilot/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ workspaceId, companyDescription }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
      router.refresh()
    } catch {
      setUi((s) => ({ ...s, loading: false, error: t.copilotConnectionError }))
    }
  }

  async function doSendMessage(msg: string) {
    if (!msg.trim() || isLoading) return
    pushUserMessage(msg)
    setUi((s) => ({ ...s, loading: true, error: null }))

    try {
      const convId = ui.conversationId ?? await (async () => {
        const r    = await fetch('/api/copilot/start', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body:   JSON.stringify({ workspaceId }),
        })
        const d: CopilotResponse = await r.json()
        applyResponse(d)
        return d.conversationId
      })()

      if (!convId) return

      const res  = await fetch('/api/copilot/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ conversationId: convId, workspaceId, message: msg }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
      router.refresh()
    } catch {
      setUi((s) => ({ ...s, loading: false, error: t.copilotConnectionError }))
    }
  }

  async function handleSelectPlan(planId: string) {
    if (!ui.conversationId || isLoading) return
    setUi((s) => ({ ...s, loading: true, error: null }))
    try {
      const res  = await fetch('/api/copilot/select-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ conversationId: ui.conversationId, workspaceId, planId }),
      })
      const data: CopilotResponse = await res.json()
      applyResponse(data)
    } catch {
      setUi((s) => ({ ...s, loading: false, error: t.copilotPlanSelectError }))
    }
  }

  // ── State helpers ───────────────────────────────────────────────

  function pushUserMessage(text: string) {
    setMessages((prev) => [...prev, { role: 'user', text }])
  }

  function applyResponse(data: CopilotResponse) {
    if (data.message) {
      setMessages((prev) => [...prev, { role: 'assistant', text: data.message!, phase: data.phase }])
    }
    setUi({
      conversationId: data.conversationId,
      phase:          data.phase,
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

  function handleReset() {
    setUi({ ...INITIAL_UI, suggestions: initialSuggestions })
    setMessages([])
    setInput('')
  }

  // ── Input handlers ──────────────────────────────────────────────

  async function handleSend() {
    const msg = input.trim()
    if (!msg) return
    setInput('')
    await doSendMessage(msg)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  const visibleSuggestions = ui.suggestions.filter((s) => !dismissedIds.has(s.id))

  // Sugerencia → envía directamente (sin pasar por el input)
  async function handleSuggestion(suggestion: CopilotSuggestion) {
    await doSendMessage(suggestion.label)
  }

  // Opción de clarificación → envía directamente
  async function handleClarifyOption(option: string) {
    await doSendMessage(option)
  }

  // ── Derived display state ────────────────────────────────────────

  const showInitialSuggestions = messages.length === 0 && !isLoading
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
  const showPlans        = ui.plans.length > 0 && ui.phase === 'planning'
  const showWorkflow     = ui.phase === 'workflow_ready'

  // Parsear opciones numeradas del último mensaje de clarificación
  const clarifyOptions: string[] = []
  if (ui.phase === 'clarifying' && lastAssistantMsg) {
    const lines = lastAssistantMsg.text.split('\n')
    for (const line of lines) {
      const m = line.match(/^(\d+[\.\)])\s+(.+)/)
      if (m?.[2]) clarifyOptions.push(m[2].trim())
    }
  }

  return (
    <div className="rounded-lg border bg-card flex flex-col" style={{ minHeight: 560 }}>

      {/* ── Chat history ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ maxHeight: 520 }}>

        {/* Estado inicial — sin contexto de empresa */}
        {showInitialSuggestions && initialContext.isEmpty && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">A</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t.copilotWelcomeTitle}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.copilotWelcomeDescriptionPrefix}<strong>{t.copilotWelcomeDescriptionStrong}</strong>{t.copilotWelcomeDescriptionSuffix}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.copilotQuickExamples}</p>
              {quickStartPrompts(t).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                  className="w-full text-left rounded-lg border px-4 py-2.5 text-sm hover:bg-muted/50 hover:border-primary/40 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Estado inicial — con contexto, mostrar sugerencias */}
        {showInitialSuggestions && !initialContext.isEmpty && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.copilotInitialWithContext}
            </p>
            <SuggestionsGrid suggestions={visibleSuggestions} onSelect={handleSuggestion} onDismiss={handleDismiss} allDismissed={visibleSuggestions.length === 0 && ui.suggestions.length > 0} t={t} />
          </div>
        )}

        {/* Mensajes */}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5 mr-2">
                A
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant'
                ? <SimpleMarkdown text={msg.text} />
                : msg.text
              }
            </div>
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5 mr-2">
              DO
            </div>
            <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3">
              <LoadingDots />
            </div>
          </div>
        )}

        {/* Opciones de clarificación */}
        {!isLoading && ui.phase === 'clarifying' && clarifyOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-8">
            {clarifyOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => void handleClarifyOption(opt)}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted hover:border-primary/40 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Planes */}
        {!isLoading && showPlans && (
          <PlansPanel plans={ui.plans} onSelect={handleSelectPlan} t={t} />
        )}

        {/* Misión creada */}
        {!isLoading && showWorkflow && (
          <WorkflowReadyPanel objectiveId={ui.objectiveId} workspaceId={workspaceId} t={t} />
        )}

        {/* Error + sugerencias de recuperación */}
        {ui.error && !isLoading && (
          <div className="space-y-3 pl-8">
            <p className="text-sm text-destructive">{ui.error}</p>
            {ui.suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">{t.copilotMaybeYouMeant}</p>
                <div className="flex flex-wrap gap-2">
                  {ui.suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => void handleSuggestion(s)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted hover:border-primary/40 transition-colors"
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────── */}
      <div className="border-t p-4 space-y-3">
        {/* Chips de sugerencias contextuales (tras greeting) */}
        {!isLoading && messages.length > 0 && ui.phase === 'greeting' && visibleSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleSuggestions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => void handleSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              ui.phase === 'clarifying'
                ? t.copilotClarifyPlaceholder
                : initialContext.isEmpty && messages.length === 0
                  ? t.copilotEmptyContextPlaceholder
                  : t.copilotGoalPlaceholder
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
              {t.copilotSend}
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-md border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                {t.copilotNew}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SimpleMarkdown ────────────────────────────────────────────────
// Renderiza negrita, listas con guión/asterisco, y saltos de línea.
// Sin dependencias externas.

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  function flushList() {
    if (listItems.length === 0) return
    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">
        {listItems.map((item, i) => (
          <li key={i}><InlineMarkdown text={item} /></li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (const line of lines) {
    const listMatch = line.match(/^[-*•]\s+(.+)/)
    const numMatch  = line.match(/^\d+[\.\)]\s+(.+)/)

    if (listMatch?.[1]) {
      listItems.push(listMatch[1])
    } else if (numMatch?.[1]) {
      listItems.push(numMatch[1])
    } else {
      flushList()
      if (line.trim() === '') {
        elements.push(<br key={`br-${elements.length}`} />)
      } else {
        elements.push(
          <p key={`p-${elements.length}`} className="my-0.5">
            <InlineMarkdown text={line} />
          </p>
        )
      }
    }
  }
  flushList()

  return <div className="space-y-0.5">{elements}</div>
}

function InlineMarkdown({ text }: { text: string }) {
  // **bold** y *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ── SuggestionsGrid ───────────────────────────────────────────────

function SuggestionsGrid({
  suggestions,
  onSelect,
  onDismiss,
  allDismissed,
  t,
}: {
  suggestions: CopilotSuggestion[]
  onSelect: (s: CopilotSuggestion) => void
  onDismiss: (id: string, e: React.MouseEvent) => void
  allDismissed?: boolean
  t: DashboardTranslations
}) {
  if (allDismissed) {
    return (
      <div className="rounded-lg border border-dashed p-5 text-center space-y-1">
        <p className="text-sm text-muted-foreground">{t.copilotNoMoreSuggestions}</p>
        <p className="text-xs text-muted-foreground">{t.copilotWriteDirectly}</p>
      </div>
    )
  }
  if (suggestions.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {t.copilotSuggestionsForCompany}
      </p>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div key={s.id} className="relative group/card">
            <button
              onClick={() => onSelect(s)}
              className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 hover:border-primary/40 transition-colors group pr-8"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5 shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {s.label}
                    </p>
                    {s.category === 'objective' && (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                        {t.copilotInProgress}
                      </span>
                    )}
                    {s.category === 'fiscal' && (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 leading-none">
                        {t.copilotFiscal}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            </button>
            <button
              onClick={(e) => onDismiss(s.id, e)}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover/card:opacity-100"
              title={t.copilotDismiss}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PlansPanel ────────────────────────────────────────────────────

function PlansPanel({
  plans,
  onSelect,
  t,
}: {
  plans: PlanSummary[]
  onSelect: (planId: string) => void
  t: DashboardTranslations
}) {
  return (
    <div className="space-y-3 pl-8">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {t.copilotAvailableStrategies}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">{plan.label}</h3>
                  {plan.isRecommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      {t.copilotRecommended}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{plan.totalTools} {t.copilotSteps}</span>
              <span>~{plan.estimatedDays} {plan.estimatedDays === 1 ? t.copilotDaySingular : t.copilotDayPlural}</span>
              <span className={`font-medium ${
                plan.riskLevel === 'low'    ? 'text-green-600 dark:text-green-400' :
                plan.riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-red-600 dark:text-red-400'
              }`}>
                {t.copilotRisk} {translatedRiskLevel(plan.riskLevel, t)}
              </span>
              <span className="ml-auto font-semibold text-foreground">{plan.score}/100</span>
            </div>

            <p className="text-xs text-muted-foreground italic leading-relaxed">{plan.reasoning}</p>

            <button
              onClick={() => onSelect(plan.id)}
              className="w-full px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              {t.copilotChooseStrategy}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── WorkflowReadyPanel ────────────────────────────────────────────

function WorkflowReadyPanel({
  objectiveId,
  workspaceId,
  t,
}: {
  objectiveId: string | null
  workspaceId: string
  t: DashboardTranslations
}) {
  const missionUrl = objectiveId
    ? `/workspace/${workspaceId}/missions/${objectiveId}`
    : `/workspace/${workspaceId}`

  return (
    <div className="pl-8">
      <div className="rounded-lg border border-green-600/20 bg-green-50/50 dark:bg-green-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">✓</span>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {t.copilotMissionCreated}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t.copilotMissionReady}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={missionUrl}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t.copilotViewMission} →
          </a>
          <a
            href={`/workspace/${workspaceId}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.copilotDashboard}
          </a>
        </div>
      </div>
    </div>
  )
}

// ── LoadingDots ───────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}
