import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getBusinessContext } from '@/lib/business-memory'
import { getCopilotSuggestions } from '@/lib/business-copilot'
import { CopilotInterface } from './_components/CopilotInterface'
import type { BusinessContext } from '@/lib/business-memory/memory-types'
import type { CopilotSuggestion } from '@/lib/business-copilot'

interface Props {
  params:       Promise<{ workspaceId: string }>
  searchParams: Promise<{ setup?: string }>
}

export default async function CopilotPage({ params, searchParams }: Props) {
  const [{ workspaceId }, { setup }, user] = await Promise.all([params, searchParams, requireUser()])
  const initialMessage = setup ? decodeURIComponent(setup) : undefined

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })

  if (!workspace) notFound()

  const [context, suggestions] = await Promise.all([
    getBusinessContext(workspaceId),
    getCopilotSuggestions(workspaceId),
  ])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <PageHeader
        workspaceName={workspace.name}
        context={context}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel izquierdo — contexto empresa */}
        <aside className="lg:col-span-1 space-y-4">
          <CompanyContextPanel context={context} />
          <ObjectivesPanel context={context} workspaceId={workspaceId} />
          <RisksPanel context={context} />
        </aside>

        {/* Panel principal — interfaz copilot */}
        <div className="lg:col-span-2">
          <CopilotInterface
            workspaceId={workspaceId}
            userId={user.id}
            initialContext={context}
            initialSuggestions={suggestions}
            initialMessage={initialMessage}
          />
        </div>
      </div>
    </div>
  )
}

// ── Page Header ───────────────────────────────────────────────────

function PageHeader({
  workspaceName,
  context,
}: {
  workspaceName: string
  context: BusinessContext
}) {
  const companyLabel = context.companyName ?? workspaceName
  const confidencePct = Math.round(context.confidence * 100)

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Copilot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {context.isEmpty
            ? 'Cuéntame en qué quieres trabajar hoy.'
            : `Asistente de ${companyLabel}`}
        </p>
      </div>
      {!context.isEmpty && (
        <div className="text-right text-xs text-muted-foreground">
          <span className="font-medium">{confidencePct}%</span> conocimiento empresa
          <ConfidenceBar value={context.confidence} />
        </div>
      )}
    </div>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="mt-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden ml-auto">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Company Context Panel ─────────────────────────────────────────

function CompanyContextPanel({ context }: { context: BusinessContext }) {
  if (context.isEmpty) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Empresa
        </h2>
        <p className="text-sm text-muted-foreground">
          Aún no tengo datos sobre tu empresa. Cuéntame en qué trabajas y los iré aprendiendo.
        </p>
      </div>
    )
  }

  const items: { label: string; value: string | null }[] = [
    { label: 'Empresa',   value: context.companyName },
    { label: 'Sector',    value: context.sector },
    { label: 'País',      value: context.country },
    { label: 'Tamaño',    value: sizeLabel(context.size) },
    { label: 'Madurez digital', value: maturityLabel(context.digitalMaturity) },
  ]

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Empresa
      </h2>
      <dl className="space-y-2">
        {items.filter((i) => i.value).map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium text-right max-w-[60%] truncate">{item.value}</dd>
          </div>
        ))}
      </dl>
      {context.regulations.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1.5">Normativas</p>
          <div className="flex flex-wrap gap-1">
            {context.regulations.map((r) => (
              <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Objectives Panel ──────────────────────────────────────────────

function ObjectivesPanel({
  context,
  workspaceId,
}: {
  context: BusinessContext
  workspaceId: string
}) {
  if (context.activeObjectives.length === 0) return null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Objetivos activos
      </h2>
      <ul className="space-y-3">
        {context.activeObjectives.slice(0, 3).map((obj) => (
          <li key={obj.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate max-w-[75%]">{obj.label}</span>
              <span className="text-xs text-muted-foreground">{obj.progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${obj.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Risks Panel ───────────────────────────────────────────────────

function RisksPanel({ context }: { context: BusinessContext }) {
  const critical = context.openRisks.filter(
    (r) => r.level === 'high' || r.level === 'critical',
  )
  if (critical.length === 0) return null

  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
        Riesgos abiertos
      </h2>
      <ul className="space-y-2">
        {critical.slice(0, 3).map((risk) => (
          <li key={risk.id} className="text-sm">
            <span className="font-medium">{risk.title}</span>
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
              {risk.level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────

function sizeLabel(size: string | null): string | null {
  const labels: Record<string, string> = {
    micro:   'Microempresa (< 10)',
    small:   'Pequeña (10–49)',
    medium:  'Mediana (50–249)',
    large:   'Grande (250+)',
    unknown: '',
  }
  return size ? (labels[size] ?? size) : null
}

function maturityLabel(maturity: string | null): string | null {
  const labels: Record<string, string> = {
    emerging:     'Emergente',
    developing:   'En desarrollo',
    established:  'Establecida',
    advanced:     'Avanzada',
    leading:      'Líder digital',
  }
  return maturity ? (labels[maturity] ?? maturity) : null
}
