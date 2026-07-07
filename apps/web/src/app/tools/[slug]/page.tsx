import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CAPABILITY_LABELS,
  COMPLEXITY_LABELS,
  COMPLEXITY_COLORS,
  FIELD_TYPE_LABELS,
} from '@/lib/marketplace-config'
import { InstallToolForm } from './_components/InstallToolForm'
import type { ToolSchemaData } from '../_lib/types'
import {
  getToolCapabilities,
  suggestNextTools,
  findAlternatives,
  getToolPrerequisites,
  BUSINESS_DOMAIN_LABELS,
  IO_TYPE_LABELS,
  QUALITY_LEVEL_LABELS,
  QUALITY_LEVEL_COLORS,
} from '@/lib/tool-intelligence'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ workspaceId?: string }>
}

// ── Compatibility badge helper ───────────────────────────────────────
function RecommendationTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    next_step:   { label: 'Siguiente paso',        className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    related:     { label: 'Relacionada',            className: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
    faster:      { label: 'Más rápida',             className: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800' },
    cheaper:     { label: 'Más económica',          className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    more_precise:{ label: 'Mayor precisión',        className: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    prerequisite:{ label: 'Prerequisito',           className: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  }
  const { label, className } = map[type] ?? { label: type, className: 'bg-muted text-muted-foreground border-border' }
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', className)}>
      {label}
    </span>
  )
}

export default async function ToolDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { workspaceId }, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ])

  const [tool, workspaces, fullProfile, nextTools, alternatives, prerequisites] = await Promise.all([
    db.toolDefinition.findFirst({
      where: { slug, isPublic: true, orgId: null },
      include: { registryMeta: true },
    }),
    db.workspace.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'asc' },
      include: {
        clients: {
          where: { isArchived: false },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
    }),
    getToolCapabilities(slug),
    suggestNextTools(slug, 4),
    findAlternatives(slug),
    getToolPrerequisites(slug),
  ])

  if (!tool) notFound()

  const schema = tool.schema as ToolSchemaData
  const capabilities = schema?.capabilities ?? []
  const fields = schema?.dataSchema?.fields
    ? Object.entries(schema.dataSchema.fields).map(([key, f]) => ({ key, ...f }))
    : []
  const criteria = schema?.dataSchema?.criteria ?? []
  const items = schema?.dataSchema?.items ?? []

  const meta = tool.registryMeta
  const profile = fullProfile?.profile ?? null
  const colors = CATEGORY_COLORS[tool.category]
  const catalogHref = workspaceId ? `/tools?workspaceId=${workspaceId}` : '/tools'
  const hasIntelligence = !!profile

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href={catalogHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Catálogo
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium truncate">{tool.name}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Left: main info ── */}
          <div className="lg:col-span-2 space-y-7">

            {/* Hero block */}
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={
                  meta?.color
                    ? { backgroundColor: `${meta.color}18`, color: meta.color }
                    : undefined
                }
              >
                {!meta?.color && (
                  <span className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', colors.iconBg)}>
                    {CATEGORY_ICONS[tool.category]}
                  </span>
                )}
                {meta?.color && (meta?.icon ?? CATEGORY_ICONS[tool.category])}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  {tool.source === 'official' && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Oficial
                    </span>
                  )}
                  <span className={cn(
                    'text-[11px] font-medium px-2.5 py-0.5 rounded-full border',
                    colors.bg, colors.text, colors.border,
                  )}>
                    {CATEGORY_LABELS[tool.category]}
                  </span>
                  {meta && (
                    <span className={cn('text-[11px] font-medium', COMPLEXITY_COLORS[meta.complexity])}>
                      {COMPLEXITY_LABELS[meta.complexity]}
                    </span>
                  )}
                  {meta && (
                    <span className="text-[11px] text-muted-foreground">
                      ⏱ {meta.estimatedMinutes} min
                    </span>
                  )}
                  {hasIntelligence && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      AI Ready
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold leading-tight">{tool.name}</h1>
                <p className="text-muted-foreground mt-1.5 leading-relaxed">{tool.description}</p>
              </div>
            </div>

            {/* ── INTELLIGENCE LAYER ── */}

            {/* Business Context */}
            {profile && (
              <section className="rounded-xl border bg-card p-5 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Contexto empresarial
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Dominio:</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {BUSINESS_DOMAIN_LABELS[profile.businessDomain]}
                  </span>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border',
                    QUALITY_LEVEL_COLORS[profile.qualityLevel],
                  )}>
                    {QUALITY_LEVEL_LABELS[profile.qualityLevel]}
                  </span>
                  {profile.automationFriendly && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800">
                      Automatizable
                    </span>
                  )}
                </div>

                {profile.businessGoals.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Objetivos de negocio</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.businessGoals.map((g) => (
                        <span key={g} className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.useCases.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Casos de uso</p>
                    <ul className="space-y-1">
                      {profile.useCases.map((u) => (
                        <li key={u} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5 shrink-0">›</span>
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* I/O Flow */}
            {profile && (profile.inputTypes.length > 0 || profile.outputTypes.length > 0) && (
              <section className="rounded-xl border bg-card p-5 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Flujo de datos
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Inputs */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      </svg>
                      Entradas necesarias
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {profile.inputTypes.map((t) => (
                        <span key={t} className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {IO_TYPE_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                      Salidas que produce
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {profile.outputTypes.map((t) => (
                        <span key={t} className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800">
                          {IO_TYPE_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {profile.expectedOutput && (
                  <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Salida esperada: </span>
                    {profile.expectedOutput}
                  </div>
                )}
              </section>
            )}

            {/* Prerequisites */}
            {prerequisites.length > 0 && (
              <section className="rounded-xl border bg-card p-5 space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Ejecutar primero
                </h2>
                <p className="text-xs text-muted-foreground">
                  Estas herramientas generan los datos que esta herramienta necesita.
                </p>
                <div className="space-y-2">
                  {prerequisites.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/tools/${r.slug}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                      </div>
                      <RecommendationTypeBadge type={r.type} />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Capabilities (schema-level) */}
            {capabilities.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Capacidades técnicas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {capabilities.map((cap) => (
                    <span
                      key={cap.instanceId ?? cap.type}
                      className="inline-flex items-center gap-1.5 text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                    >
                      {CAPABILITY_LABELS[cap.type] ?? cap.type}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Fields */}
            {fields.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Campos del formulario
                  <span className="ml-2 font-normal normal-case text-xs">({fields.length})</span>
                </h2>
                <div className="rounded-xl border divide-y overflow-hidden">
                  {fields.map((f) => (
                    <div key={f.key} className="px-4 py-3 flex items-center justify-between bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{f.label}</span>
                        {f.required && (
                          <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {FIELD_TYPE_LABELS[f.type] ?? f.type}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Scoring criteria */}
            {criteria.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Criterios de evaluación
                  <span className="ml-2 font-normal normal-case text-xs">({criteria.length})</span>
                </h2>
                <div className="rounded-xl border divide-y overflow-hidden">
                  {criteria.map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between bg-card hover:bg-muted/30 transition-colors">
                      <span className="text-sm font-medium">{c.label}</span>
                      {c.weight !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.round(c.weight * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {Math.round(c.weight * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Checklist items */}
            {items.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Ítems del checklist
                  <span className="ml-2 font-normal normal-case text-xs">({items.length} ítems)</span>
                </h2>
                <div className="rounded-xl border divide-y overflow-hidden max-h-72 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="px-4 py-2.5 flex items-center justify-between bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded border border-muted-foreground/30 shrink-0" aria-hidden="true" />
                        <span className="text-sm">{item.label}</span>
                        {item.required && (
                          <span className="text-[10px] text-destructive">*</span>
                        )}
                      </div>
                      {item.category && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Next Tools */}
            {nextTools.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Continuar con
                </h2>
                <div className="space-y-2">
                  {nextTools.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/tools/${r.slug}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                      </div>
                      <RecommendationTypeBadge type={r.type} />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Alternativas
                </h2>
                <div className="space-y-2">
                  {alternatives.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/tools/${r.slug}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                      </div>
                      <RecommendationTypeBadge type={r.type} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right: install panel + AI metadata ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Install panel */}
            <div className="rounded-xl border bg-card p-5 sticky top-6 space-y-4">
              <div>
                <h2 className="font-semibold">Instalar herramienta</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Disponible en todos los workspaces
                </p>
              </div>

              {meta && (
                <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Versión</span>
                    <span className="font-medium text-foreground">{meta.tier === 'official' ? '1.0' : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo estimado</span>
                    <span className="font-medium text-foreground">{meta.estimatedMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dificultad</span>
                    <span className={cn('font-medium', COMPLEXITY_COLORS[meta.complexity])}>
                      {COMPLEXITY_LABELS[meta.complexity]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categoría</span>
                    <span className="font-medium text-foreground">{meta.displayCategory}</span>
                  </div>
                </div>
              )}

              <InstallToolForm
                toolDefinitionId={tool.id}
                toolName={tool.name}
                workspaces={workspaces}
                defaultWorkspaceId={workspaceId}
              />
            </div>

            {/* AI Metadata panel */}
            {profile && (
              <div className="rounded-xl border bg-card p-5 space-y-3.5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Inteligencia AI
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Coste estimado</span>
                    <span className="font-semibold text-foreground">
                      {profile.executionCostEUR.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Calidad</span>
                    <span className={cn('font-semibold', QUALITY_LEVEL_COLORS[profile.qualityLevel])}>
                      {QUALITY_LEVEL_LABELS[profile.qualityLevel]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Automatizable</span>
                    <span className="font-semibold text-foreground">
                      {profile.automationFriendly ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dominio</span>
                    <span className="font-semibold text-foreground">
                      {BUSINESS_DOMAIN_LABELS[profile.businessDomain]}
                    </span>
                  </div>
                </div>

                {profile.recommendedModels.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Modelos recomendados</p>
                    <div className="flex flex-col gap-1">
                      {profile.recommendedModels.map((m) => (
                        <span key={m} className="text-xs font-mono px-2 py-1 rounded-md bg-muted text-muted-foreground">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.supportedProviders.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Proveedor</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.supportedProviders.map((p) => (
                        <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(prerequisites.length > 0 || nextTools.length > 0) && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Posición en el grafo</p>
                    <div className="space-y-1 text-xs">
                      {prerequisites.length > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-4 h-4 rounded border flex items-center justify-center text-[10px]">↑</span>
                          {prerequisites.length} prerequisito{prerequisites.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {nextTools.length > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-4 h-4 rounded border flex items-center justify-center text-[10px]">↓</span>
                          {nextTools.length} herramienta{nextTools.length !== 1 ? 's' : ''} siguientes
                        </div>
                      )}
                      {alternatives.length > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-4 h-4 rounded border flex items-center justify-center text-[10px]">≈</span>
                          {alternatives.length} alternativa{alternatives.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
