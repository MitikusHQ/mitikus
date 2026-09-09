import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBusinessContext } from '@/lib/business-memory'
import { getCopilotSuggestions } from '@/lib/business-copilot'
import { CopilotInterface } from './_components/CopilotInterface'
import type { BusinessContext } from '@/lib/business-memory/memory-types'
import type { CopilotSuggestion } from '@/lib/business-copilot'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  params:       Promise<{ workspaceId: string }>
  searchParams: Promise<{ setup?: string }>
}

export default async function CopilotPage({ params, searchParams }: Props) {
  const [{ workspaceId }, { setup }, user, locale] = await Promise.all([params, searchParams, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
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
        t={t}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel izquierdo — contexto empresa */}
        <aside className="lg:col-span-1 space-y-4">
          <CompanyContextPanel context={context} t={t} />
          <ObjectivesPanel context={context} workspaceId={workspaceId} t={t} />
          <RisksPanel context={context} t={t} />
          <DocsPanel context={context} t={t} />
        </aside>

        {/* Panel principal — interfaz copilot */}
        <div className="lg:col-span-2">
          <CopilotInterface
            workspaceId={workspaceId}
            userId={user.id}
            initialContext={context}
            initialSuggestions={suggestions}
            initialMessage={initialMessage}
            locale={locale}
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
  t,
}: {
  workspaceName: string
  context: BusinessContext
  t: DashboardTranslations
}) {
  const companyLabel = context.companyName ?? workspaceName
  const confidencePct = Math.round(context.confidence * 100)

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Arkos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {context.isEmpty
            ? t.copilotSetupPrompt
            : t.copilotAssistantOf.replace('{company}', companyLabel)}
        </p>
      </div>
      {!context.isEmpty && (
        <div
          className="text-right text-xs text-muted-foreground cursor-default"
          title={t.copilotKnowledgeTooltip}
        >
          <span className="font-medium">{confidencePct}%</span> {t.copilotKnowledgeTitle}
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

function CompanyContextPanel({ context, t }: { context: BusinessContext; t: DashboardTranslations }) {
  if (context.isEmpty) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t.copilotCompany}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.copilotEmptyCompany}
        </p>
      </div>
    )
  }

  const items: { label: string; value: string | null }[] = [
    { label: t.copilotCompanyName,   value: context.companyName },
    { label: t.copilotSector,    value: context.sector },
    { label: t.copilotCountry,      value: context.country },
    { label: t.copilotSize,    value: sizeLabel(context.size, t) },
    { label: t.copilotDigitalMaturity, value: maturityLabel(context.digitalMaturity, t) },
  ]

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t.copilotCompany}
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
          <p className="text-xs text-muted-foreground mb-1.5">{t.copilotRegulations}</p>
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
  t,
}: {
  context: BusinessContext
  workspaceId: string
  t: DashboardTranslations
}) {
  if (context.activeObjectives.length === 0) return null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t.copilotActiveObjectives}
      </h2>
      <ul className="space-y-3">
        {context.activeObjectives.slice(0, 3).map((obj) => (
          <li key={obj.id} className="space-y-1 group">
            <Link
              href={`/workspace/${workspaceId}/missions/${obj.id}`}
              className="flex items-center justify-between hover:text-primary transition-colors"
            >
              <span className="text-sm font-medium truncate max-w-[75%] group-hover:text-primary">{obj.label}</span>
              <span className="text-xs text-muted-foreground">{obj.progress}%</span>
            </Link>
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

function RisksPanel({ context, t }: { context: BusinessContext; t: DashboardTranslations }) {
  const critical = context.openRisks.filter(
    (r) => r.level === 'high' || r.level === 'critical',
  )
  if (critical.length === 0) return null

  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
        {t.copilotOpenRisks}
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

// ── Docs Panel ────────────────────────────────────────────────────

function DocsPanel({ context, t }: { context: BusinessContext; t: DashboardTranslations }) {
  if (!context.docsContext) return null

  const docTitles = context.docsContext
    .split('\n')
    .filter((line) => line.startsWith('--- ') && line.endsWith(' ---'))
    .map((line) => line.replace(/^--- /, '').replace(/ ---$/, ''))

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t.copilotAvailableDocs}
      </h2>
      <ul className="space-y-1.5">
        {docTitles.map((title) => (
          <li key={title} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">📄</span>
            <span className="truncate">{title}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────

function sizeLabel(size: string | null, t: DashboardTranslations): string | null {
  const labels: Record<string, string> = {
    micro:   t.copilotSizeMicro,
    small:   t.copilotSizeSmall,
    medium:  t.copilotSizeMedium,
    large:   t.copilotSizeLarge,
    unknown: '',
  }
  return size ? (labels[size] ?? size) : null
}

function maturityLabel(maturity: string | null, t: DashboardTranslations): string | null {
  const labels: Record<string, string> = {
    emerging:     t.copilotMaturityEmerging,
    developing:   t.copilotMaturityDeveloping,
    established:  t.copilotMaturityEstablished,
    advanced:     t.copilotMaturityAdvanced,
    leading:      t.copilotMaturityLeading,
  }
  return maturity ? (labels[maturity] ?? maturity) : null
}
