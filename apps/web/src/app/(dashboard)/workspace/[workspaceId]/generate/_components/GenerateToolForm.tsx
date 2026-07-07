'use client'

import { useState, useTransition, useEffect } from 'react'
import { saveGeneratedTool, discardGenerationRequest } from '@/app/actions/generate'
import { installToolFromRegistry, recordRegistryAction } from '@/app/actions/registry'
import type { ValidatedToolSchema } from '@protools/schema'
import type { ToolSearchHit, SearchSimilarResponse } from '@/lib/registry-intelligence/types'
import { STRONG_MATCH_THRESHOLD } from '@/lib/registry-intelligence/types'

const COMPLEXITY_CHAR_LIMIT = 1500
const COMPLEXITY_LINE_LIMIT = 12

function isComplex(text: string): boolean {
  if (text.length > COMPLEXITY_CHAR_LIMIT) return true
  const bulletLines = text.split('\n').filter(l => /^\s*[-*•]|\d+\./.test(l)).length
  return bulletLines > COMPLEXITY_LINE_LIMIT
}

const CATEGORY_LABELS: Record<string, string> = {
  audit: 'Auditoría',
  evaluation: 'Evaluación',
  checklist: 'Checklist',
  crm: 'CRM',
  report: 'Informes',
  hr: 'RRHH',
  operations: 'Operaciones',
  finance: 'Finanzas',
  custom: 'Personalizado',
}

const EXAMPLES = [
  'Auditoría de seguridad informática',
  'Evaluación de proveedores',
  'Checklist de apertura de negocio',
  'Seguimiento de clientes comerciales',
]

interface GeneratedResult {
  schema: ValidatedToolSchema
  generationRequestId: string
  tokensUsed: number
}

interface Props {
  workspaceId: string
  locale?: string
}

type Step = 'input' | 'searching' | 'results' | 'loading' | 'preview' | 'saving'

export function GenerateToolForm({ workspaceId, locale = 'es' }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [suggestions, setSuggestions] = useState<ToolSearchHit[]>([])
  const [hasStrongMatch, setHasStrongMatch] = useState(false)
  const [searchId, setSearchId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [loadingSlowMsg, setLoadingSlowMsg] = useState(false)

  // Show "still working" message after 30s in loading state
  useEffect(() => {
    if (step !== 'loading') { setLoadingSlowMsg(false); return }
    const t = setTimeout(() => setLoadingSlowMsg(true), 30_000)
    return () => clearTimeout(t)
  }, [step])

  async function handleSearch() {
    const trimmed = description.trim()
    if (trimmed.length < 10) {
      setError('La descripción debe tener al menos 10 caracteres')
      return
    }

    setError(null)
    setStep('searching')

    try {
      const res = await fetch('/api/tools/search-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, prompt: trimmed }),
      })
      const data = (await res.json()) as SearchSimilarResponse & { error?: string }

      if (!res.ok || data.error) {
        // On search failure, fall through to generate
        await runGenerate()
        return
      }

      setSearchId(data.searchId ?? '')

      if (data.suggestions.length === 0) {
        // No matches — generate directly
        await runGenerate()
        return
      }

      setSuggestions(data.suggestions)
      setHasStrongMatch(data.hasStrongMatch)
      setStep('results')
    } catch {
      // Network error — fall through to generate
      await runGenerate()
    }
  }

  async function runGenerate(simpleMode = false) {
    setStep('loading')
    try {
      const res = await fetch('/api/generate-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguage: description.trim(), workspaceId, simpleMode, locale }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Error al generar la herramienta')
        setStep('input')
        return
      }
      setResult(data as GeneratedResult)
      setStep('preview')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setStep('input')
    }
  }

  async function handleGenerateAnyway(simpleMode = false) {
    if (searchId) void recordRegistryAction(searchId, 'generate')
    await runGenerate(simpleMode)
  }

  async function handleInstall(toolDefinitionId: string) {
    setActionLoading(toolDefinitionId)
    setError(null)
    const res = await installToolFromRegistry(toolDefinitionId, workspaceId, searchId)
    if ('error' in res) {
      setError(res.error)
      setActionLoading(null)
      return
    }
    window.location.href = res.redirectTo
  }

  async function handleFork(toolDefinitionId: string) {
    setActionLoading(`fork-${toolDefinitionId}`)
    setError(null)
    try {
      const res = await fetch('/api/tools/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolDefinitionId, workspaceId, searchId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Error al copiar la herramienta')
        setActionLoading(null)
        return
      }
      window.location.href = data.redirectTo
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setActionLoading(null)
    }
  }

  // ── Stages ────────────────────────────────────────────────────

  if (step === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full animate-progress-slide" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {locale === 'es'
            ? 'Buscando herramientas similares en el catálogo…'
            : 'Searching similar tools in catalog…'}
        </p>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        {/* Progress bar */}
        <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full animate-progress-slide" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            {locale === 'es' ? 'Generando herramienta con IA…' : 'Generating tool with AI…'}
          </p>
          <p className="text-xs text-muted-foreground">
            {locale === 'es'
              ? 'Esto puede tardar hasta 60 segundos.'
              : 'This may take up to 60 seconds.'}
          </p>
          {loadingSlowMsg && (
            <p className="text-xs text-amber-600 dark:text-amber-400 animate-pulse">
              {locale === 'es'
                ? 'Todavía trabajando… las herramientas complejas tardan más.'
                : 'Still working… complex tools may take longer.'}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (step === 'results') {
    return (
      <SuggestionsPanel
        suggestions={suggestions}
        hasStrongMatch={hasStrongMatch}
        actionLoading={actionLoading}
        error={error}
        onInstall={handleInstall}
        onFork={handleFork}
        onGenerateAnyway={(simple) => handleGenerateAnyway(simple)}
        onBack={() => { setStep('input'); setError(null) }}
      />
    )
  }

  if ((step === 'preview' || step === 'saving') && result) {
    return (
      <PreviewPanel
        result={result}
        workspaceId={workspaceId}
        onDiscard={(requestId) => {
          void discardGenerationRequest(requestId)
          setResult(null)
          setStep('input')
        }}
        onRegenerate={() => { setResult(null); setStep('input') }}
        isSaving={step === 'saving'}
        onSavingStart={() => setStep('saving')}
        onSavingError={(msg) => { setError(msg); setStep('preview') }}
        externalError={error}
      />
    )
  }

  // ── Input stage ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">
          Describe la herramienta que necesitas
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Ej: Necesito una herramienta para evaluar proveedores en función de calidad, precio y plazo de entrega."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Ejemplos rápidos</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setDescription(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-input hover:border-primary hover:text-primary transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {description.trim().length >= 10 && isComplex(description) && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <span className="font-semibold">This looks like a complex tool.</span>{' '}
          It may consume more AI credits and take longer to generate.
          Consider using "Generate simpler version" for a quick test.
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSearch}
          disabled={description.trim().length < 10}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Buscar herramientas
        </button>
        <button
          type="button"
          onClick={() => runGenerate(true)}
          disabled={description.trim().length < 10}
          className="rounded-md border border-input px-5 py-2.5 text-sm font-medium hover:border-foreground disabled:opacity-50 transition-colors text-muted-foreground"
        >
          Generar versión simple
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        "Buscar herramientas" revisa el catálogo primero. "Versión simple" genera directamente una herramienta compacta (máx. 8 campos).
      </p>
    </div>
  )
}

// ── SuggestionsPanel ─────────────────────────────────────────────

interface SuggestionsPanelProps {
  suggestions: ToolSearchHit[]
  hasStrongMatch: boolean
  actionLoading: string | null
  error: string | null
  onInstall: (id: string) => Promise<void>
  onFork: (id: string) => Promise<void>
  onGenerateAnyway: (simpleMode: boolean) => void
  onBack: () => void
}

function SuggestionsPanel({
  suggestions,
  hasStrongMatch,
  actionLoading,
  error,
  onInstall,
  onFork,
  onGenerateAnyway,
  onBack,
}: SuggestionsPanelProps) {
  const anyLoading = actionLoading !== null

  return (
    <div className="space-y-5">
      {hasStrongMatch ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Encontramos herramientas similares.</span>{' '}
          Instala o haz fork de una existente para ahorrar tiempo y evitar consumir créditos IA.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Encontramos algunas herramientas parecidas. Revísalas antes de generar una nueva.
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((hit) => (
          <SuggestionCard
            key={hit.toolDefinitionId}
            hit={hit}
            actionLoading={actionLoading}
            onInstall={onInstall}
            onFork={onFork}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          disabled={anyLoading}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          ← Modificar descripción
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGenerateAnyway(true)}
            disabled={anyLoading}
            className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:border-foreground disabled:opacity-50 transition-colors text-muted-foreground"
          >
            Generar versión simple
          </button>
          <button
            type="button"
            onClick={() => onGenerateAnyway(false)}
            disabled={anyLoading}
            className="flex items-center gap-1.5 rounded-md border border-input px-4 py-2 text-sm font-medium hover:border-foreground disabled:opacity-50 transition-colors"
          >
            <span className="text-muted-foreground text-xs">✦</span>
            Generar de todas formas
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SuggestionCard ───────────────────────────────────────────────

interface SuggestionCardProps {
  hit: ToolSearchHit
  actionLoading: string | null
  onInstall: (id: string) => Promise<void>
  onFork: (id: string) => Promise<void>
}

function SuggestionCard({ hit, actionLoading, onInstall, onFork }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isInstalling = actionLoading === hit.toolDefinitionId
  const isForking = actionLoading === `fork-${hit.toolDefinitionId}`
  const anyLoading = actionLoading !== null

  const similarityColor =
    hit.similarity >= STRONG_MATCH_THRESHOLD
      ? 'bg-green-100 text-green-800'
      : hit.similarity >= 40
      ? 'bg-amber-100 text-amber-800'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${similarityColor}`}>
                {hit.similarity}% similar
              </span>
              <span className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[hit.category] ?? hit.category}
              </span>
            </div>
            <h3 className="font-semibold text-sm leading-snug">{hit.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{hit.description}</p>
          </div>
        </div>

        {hit.capabilityLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hit.capabilityLabels.slice(0, 4).map((label) => (
              <span
                key={label}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">{hit.reason}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onInstall(hit.toolDefinitionId)}
            disabled={anyLoading}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isInstalling ? 'Instalando…' : 'Instalar'}
          </button>
          <button
            type="button"
            onClick={() => onFork(hit.toolDefinitionId)}
            disabled={anyLoading}
            className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:border-foreground disabled:opacity-50 transition-colors"
          >
            {isForking ? 'Copiando…' : 'Fork'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors text-muted-foreground"
          >
            {expanded ? 'Ocultar' : 'Vista previa'}
          </button>
        </div>
      </div>

      {expanded && <ToolPreview hit={hit} />}
    </div>
  )
}

// ── ToolPreview (inline expandable) ─────────────────────────────

function ToolPreview({ hit }: { hit: ToolSearchHit }) {
  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3 text-sm">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Campos ({hit.fieldCount})
        </p>
        {hit.fieldLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {hit.fieldLabels.slice(0, 8).map((label) => (
              <span
                key={label}
                className="text-xs bg-background border border-border px-2 py-0.5 rounded"
              >
                {label}
              </span>
            ))}
            {hit.fieldLabels.length > 8 && (
              <span className="text-xs text-muted-foreground">+{hit.fieldLabels.length - 8} más</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin campos definidos</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Capabilities
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hit.capabilityLabels.map((label) => (
            <span
              key={label}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {hit.isPublic ? 'Herramienta pública del catálogo' : 'Herramienta de tu organización'}
      </p>
    </div>
  )
}

// ── PreviewPanel (AI generated result) ──────────────────────────

interface PreviewPanelProps {
  result: GeneratedResult
  workspaceId: string
  onDiscard: (generationRequestId: string) => void
  onRegenerate: () => void
  isSaving: boolean
  onSavingStart: () => void
  onSavingError: (msg: string) => void
  externalError: string | null
}

function PreviewPanel({
  result,
  workspaceId,
  onDiscard,
  onRegenerate,
  isSaving,
  onSavingStart,
  onSavingError,
  externalError,
}: PreviewPanelProps) {
  const [isPending, startTransition] = useTransition()
  const { schema } = result

  const scoringCap = schema.capabilities.find((c) => c.type === 'SCORING')
  const checklistCap = schema.capabilities.find((c) => c.type === 'CHECKLIST')

  function handleSave() {
    onSavingStart()
    startTransition(async () => {
      const res = await saveGeneratedTool(workspaceId, result.generationRequestId, result.schema)
      if ('error' in res) {
        onSavingError(res.error)
      } else {
        window.location.href = res.redirectTo
      }
    })
  }

  const disabled = isSaving || isPending

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        La herramienta generada puede necesitar revisión antes de su uso en producción.
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
            {CATEGORY_LABELS[schema.category] ?? schema.category}
          </p>
          <h2 className="text-xl font-semibold">{schema.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {schema.capabilities.map((cap) => (
            <span
              key={cap.instanceId}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
            >
              {cap.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">
          Campos ({Object.keys(schema.dataSchema.fields).length})
        </h3>
        <div className="divide-y">
          {Object.entries(schema.dataSchema.fields).map(([id, field]) => (
            <div key={id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{field.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">{field.type}</span>
                {field.required && (
                  <span className="text-xs text-destructive font-medium">requerido</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {checklistCap && (
        <ChecklistPreview
          cap={checklistCap.config as { items: Array<{ id: string; label: string }> }}
        />
      )}

      {scoringCap && (
        <ScoringPreview
          cap={
            scoringCap.config as {
              criteria: Array<{ id: string; label: string; weight?: number; min?: number; max?: number }>
            }
          }
        />
      )}

      {externalError && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {externalError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {disabled ? 'Guardando…' : 'Guardar herramienta'}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={disabled}
          className="rounded-md border border-input px-5 py-2.5 text-sm font-medium hover:border-foreground disabled:opacity-50 transition-colors"
        >
          Regenerar
        </button>
        <button
          type="button"
          onClick={() => onDiscard(result.generationRequestId)}
          disabled={disabled}
          className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
        >
          Descartar
        </button>
      </div>
    </div>
  )
}

function ChecklistPreview({
  cap,
}: {
  cap: { items: Array<{ id: string; label: string }> }
}) {
  const shown = cap.items.slice(0, 6)
  const remaining = cap.items.length - shown.length
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Checklist ({cap.items.length} ítems)</h3>
      <div className="space-y-2">
        {shown.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
            {item.label}
          </div>
        ))}
        {remaining > 0 && <p className="text-xs text-muted-foreground pt-1">+{remaining} más…</p>}
      </div>
    </div>
  )
}

function ScoringPreview({
  cap,
}: {
  cap: { criteria: Array<{ id: string; label: string; weight?: number; min?: number; max?: number }> }
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">
        Criterios de puntuación ({cap.criteria.length})
      </h3>
      <div className="divide-y">
        {cap.criteria.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span>{c.label}</span>
            <span className="text-xs text-muted-foreground">
              {c.weight !== undefined
                ? `${Math.round(c.weight * 100)}%`
                : `${c.min ?? 1}–${c.max ?? 10}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
