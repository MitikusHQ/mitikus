import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FirstTimeExperience } from './_components/FirstTimeExperience'
import { startOfMonthUTC } from '@/lib/plan-limits'
import { formatCostEUR } from '@/lib/ai-cost'
import { getObjectives } from '@/lib/business-memory'
import { getSteps } from '@/lib/missions/mission-steps'
import { nextStep } from '@/lib/missions/types'
import type { CompanyObjectiveData } from '@/lib/business-memory'
import { getOrCreateIntelligence } from '@/lib/missions/intelligence'
import { computeMissionState, getNextAction, remainingMinutes } from '@/lib/missions/mission-state'
import { rankMissions } from '@/lib/missions/prioritization'
import { MISSION_STATE_LABELS } from '@/lib/missions/types'
import { getSinceLastVisit, getCompanyProgress } from '@/lib/missions/second-day'
import type { SinceLastVisitItem } from '@/lib/missions/second-day'

interface Props {
  params: Promise<{ workspaceId: string }>
}

const CATEGORY_ICONS: Record<string, string> = {
  AUDIT:      '🛡',
  EVALUATION: '⭐',
  CHECKLIST:  '✓',
  CRM:        '👥',
  REPORT:     '📄',
  HR:         '👤',
  OPERATIONS: '⚙',
  FINANCE:    '💰',
  CUSTOM:     '⬡',
}

const CATEGORY_LABELS: Record<string, string> = {
  AUDIT:      'Auditoría',
  EVALUATION: 'Evaluación',
  CHECKLIST:  'Checklist',
  CRM:        'CRM',
  REPORT:     'Informes',
  HR:         'RRHH',
  OPERATIONS: 'Operaciones',
  FINANCE:    'Finanzas',
  CUSTOM:     'Personalizado',
}

// PRODUCT-001 — Beachhead ICP (consultoras IT, GTM-003): prioriza visualmente
// las categorías del caso de uso de auditoría sin ocultar ni borrar el resto.
const CATEGORY_PRIORITY: Record<string, number> = {
  AUDIT: 0, CHECKLIST: 1, REPORT: 2, OPERATIONS: 3,
  EVALUATION: 4, CRM: 5, HR: 6, FINANCE: 7, CUSTOM: 8,
}

export default async function WorkspacePage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const monthStart = startOfMonthUTC()

  const [workspace, clients, toolInstances, recordsCount, aiUsageMonth, toolsReused, costMonth] =
    await Promise.all([
      db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
      db.client.findMany({
        where: { workspaceId, isArchived: false },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, email: true, sector: true },
      }),
      db.toolInstance.findMany({
        where: { workspaceId, status: 'ACTIVE' },
        include: { toolDefinition: { select: { name: true, category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.toolRecord.count({
        where: { toolInstance: { workspaceId }, isDeleted: false },
      }),
      db.aIUsage.count({
        where: {
          workspaceId,
          status: { not: 'rate_limited' },
          createdAt: { gte: monthStart },
        },
      }),
      db.registrySearch.count({
        where: {
          workspaceId,
          action: { in: ['install', 'fork'] },
        },
      }),
      db.aIUsage.aggregate({
        where: {
          workspaceId,
          status: { not: 'rate_limited' },
          createdAt: { gte: monthStart },
        },
        _sum: { estimatedCostEUR: true },
      }),
    ])

  if (!workspace) notFound()

  const firstName = (user.name ?? user.email ?? '').split(' ')[0]?.split('@')[0] ?? 'ahí'

  // ── Primer acceso: sin herramientas ni clientes ──
  const isFirstTime = toolInstances.length === 0 && clients.length === 0
  if (isFirstTime) {
    return <FirstTimeExperience workspaceId={workspaceId} userName={firstName} />
  }

  // Auditorías/Checklist/Informes/Procesos primero — sin ocultar el resto (PRODUCT-001)
  const sortedToolInstances = [...toolInstances].sort((a, b) => {
    const diff = (CATEGORY_PRIORITY[a.toolDefinition.category] ?? 9) - (CATEGORY_PRIORITY[b.toolDefinition.category] ?? 9)
    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime()
  })

  // ── BETA-002: Second Day Experience — capturar la visita anterior antes de pisarla ──
  const previousVisit = user.lastSeenAt
  const now = new Date()
  void db.user.update({ where: { id: user.id }, data: { lastSeenAt: now } }).catch(() => undefined)

  const THREE_HOURS_MS = 3 * 60 * 60 * 1000
  const showSinceLastVisit = previousVisit !== null && now.getTime() - previousVisit.getTime() > THREE_HOURS_MS

  const [sinceLastVisit, companyProgress] = await Promise.all([
    showSinceLastVisit ? getSinceLastVisit(workspaceId, previousVisit!) : Promise.resolve(null),
    getCompanyProgress(workspaceId),
  ])

  // Cargar misiones activas con su inteligencia (MISSION-002) para Mission Control
  const activeObjectives = await getObjectives(workspaceId, 'active')
  const objectivesWithSteps = await Promise.all(
    activeObjectives.map(async (obj) => {
      const steps = await getSteps(obj.id, workspaceId)
      const intelligence = await getOrCreateIntelligence(obj.id, workspaceId)
      const state  = computeMissionState(obj.status, steps)
      const action = getNextAction(state, steps)
      const next  = nextStep(steps)
      const total = steps.length
      const done  = steps.filter((s) => s.status === 'completed').length
      const progress = total > 0 ? Math.round((done / total) * 100) : obj.progress
      return { obj, steps, intelligence, state, action, next, total, done, progress }
    }),
  )

  // Mission Prioritization Engine: ordena por impacto/urgencia/esfuerzo/estado, no por fecha
  const ranked = rankMissions(objectivesWithSteps.map((m) => ({ objective: m.obj, intelligence: m.intelligence, state: m.state })))
  const orderById = new Map(ranked.map((r, i) => [r.item.objective.id, i]))
  const sortedMissions = [...objectivesWithSteps].sort(
    (a, b) => (orderById.get(a.obj.id) ?? 0) - (orderById.get(b.obj.id) ?? 0),
  )
  const top = ranked[0]
  const topMission = top ? objectivesWithSteps.find((m) => m.obj.id === top.item.objective.id) : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  const costEUR = costMonth._sum.estimatedCostEUR ?? 0
  const savingsEUR = toolsReused * 0.06

  const stats = [
    { label: 'Herramientas instaladas', value: String(toolInstances.length), href: `/workspace/${workspaceId}/tools` },
    { label: 'Clientes', value: String(clients.length), href: `/workspace/${workspaceId}/clients` },
    { label: 'Registros creados', value: String(recordsCount), href: null },
    { label: 'Generaciones IA (mes)', value: String(aiUsageMonth), href: `/workspace/${workspaceId}/usage` },
    { label: 'Herramientas reutilizadas', value: String(toolsReused), href: `/workspace/${workspaceId}/usage` },
    { label: 'Coste IA este mes', value: formatCostEUR(costEUR), href: `/workspace/${workspaceId}/usage` },
    { label: 'Ahorro por reutilización', value: `≈ ${formatCostEUR(savingsEUR)}`, href: null },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Mission Control — qué es lo más importante que debes hacer hoy</p>
      </div>

      {/* ── Desde tu última visita (BETA-002) — la IA ha seguido trabajando, independiente de si hay misión recomendada ── */}
      {sinceLastVisit && sinceLastVisit.hasChanges && (
        <section className="rounded-lg bg-card border border-primary/10 p-4 space-y-2 animate-in fade-in duration-300">
          <p className="text-xs font-semibold text-primary">Desde tu última visita, {firstName}:</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {sinceLastVisit.items.map((item: SinceLastVisitItem) => (
              <li key={item.text} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <span>{item.icon}</span>{item.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── DAILY INTELLIGENCE — Director General Digital (MISSION-002) ── */}
      {topMission && top && (
        <section className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}, {firstName}.</p>
            <p className="text-base font-semibold mt-0.5">Hoy recomendamos centrarte en:</p>
          </div>

          <div className="flex items-start gap-3">
            <span className={`shrink-0 text-xs px-2 py-1 rounded font-medium ${PRIORITY_BADGE[topMission.obj.priority] ?? 'bg-muted text-muted-foreground'}`}>
              {PRIORITY_LABEL[topMission.obj.priority] ?? topMission.obj.priority}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{topMission.obj.label}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                <span>Tiempo estimado: {formatMinutes(remainingMinutes(topMission.steps))}</span>
                <span>Impacto: {'★'.repeat(topMission.intelligence.impactScore)}{'☆'.repeat(5 - topMission.intelligence.impactScore)}</span>
              </div>
              {topMission.intelligence.whatItUnlocks && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Desbloqueará: </span>{topMission.intelligence.whatItUnlocks}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">¿Por qué?</p>
            <ul className="space-y-0.5">
              {top.reasons.map((r) => (
                <li key={r} className="text-sm flex gap-1.5">
                  <span className="text-primary">•</span>{r}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={`/workspace/${workspaceId}/missions/${topMission.obj.id}`}
            className="inline-block text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Continuar misión →
          </Link>
        </section>
      )}

      {/* ── PROGRESO DE TU EMPRESA (BETA-002) — por qué hoy estás mejor que ayer ── */}
      <section>
        <h2 className="text-base font-semibold mb-1">Tu empresa está mejor hoy que ayer</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Lo que MITIKUS ha ido acumulando para ti, no solo tareas sueltas.
        </p>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Conocimiento de tu empresa" value={`${companyProgress.knowledgeEntries} datos`} href={null} />
          <StatCard label="Automatizaciones creadas" value={String(companyProgress.automationsCreated)} href={null} />
          <StatCard label="Tiempo ahorrado" value={formatMinutes(companyProgress.minutesSaved)} href={null} />
          <StatCard label="Misiones completadas" value={String(companyProgress.missionsCompleted)} href={null} />
        </div>
      </section>

      {/* ── MISIONES ACTIVAS — Mission Control ── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold">Misiones activas</h2>
          {sortedMissions.length > 0 && (
            <Link href={`/workspace/${workspaceId}/copilot`} className="text-sm text-primary hover:underline">
              Crear misión →
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Una misión es un objetivo de tu empresa dividido en pasos concretos — tú o la IA los vais completando.
        </p>

        {sortedMissions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center bg-card">
            <p className="text-muted-foreground text-sm mb-2">No hay misiones activas.</p>
            <p className="text-xs text-muted-foreground mb-4">
              Cuéntale al Copilot un objetivo de tu empresa y lo convertirá en una misión con pasos claros.
            </p>
            <Link
              href={`/workspace/${workspaceId}/copilot`}
              className="text-sm text-primary hover:underline font-medium"
            >
              Definir primer objetivo con el Copilot →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMissions.map(({ obj, state, action, total, done, progress }) => (
              <MissionCard
                key={obj.id}
                obj={obj}
                workspaceId={workspaceId}
                state={state}
                nextStepTitle={action.text}
                total={total}
                done={done}
                progress={progress}
              />
            ))}
          </div>
        )}
      </section>

        {/* Stats — datos reales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Herramientas instaladas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Herramientas instaladas</h2>
            {toolInstances.length > 0 && (
              <Link href={`/workspace/${workspaceId}/tools`} className="text-sm text-primary hover:underline">
                Ver todas →
              </Link>
            )}
          </div>

          {toolInstances.length === 0 ? (
            <EmptyState
              message="Aún no tienes herramientas instaladas."
              action={{ label: 'Explorar catálogo', href: `/workspace/${workspaceId}/tools` }}
            />
          ) : (
            <div className="rounded-lg border bg-card divide-y overflow-hidden">
              {sortedToolInstances.slice(0, 6).map((instance) => (
                <Link
                  key={instance.id}
                  href={`/workspace/${workspaceId}/tools/${instance.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden>
                      {CATEGORY_ICONS[instance.toolDefinition.category] ?? '⬡'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {instance.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[instance.toolDefinition.category] ?? instance.toolDefinition.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                    Activa
                  </span>
                </Link>
              ))}
              {toolInstances.length > 6 && (
                <div className="px-4 py-3 text-center">
                  <Link href={`/workspace/${workspaceId}/tools`} className="text-sm text-primary hover:underline">
                    Ver {toolInstances.length - 6} más →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Clientes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Clientes</h2>
            {clients.length > 0 && (
              <Link href={`/workspace/${workspaceId}/clients`} className="text-sm text-primary hover:underline">
                Gestionar →
              </Link>
            )}
          </div>

          {clients.length === 0 ? (
            <EmptyState
              message="Aún no has añadido clientes."
              action={{ label: 'Añadir primer cliente', href: `/workspace/${workspaceId}/clients` }}
            />
          ) : (
            <div className="rounded-lg border bg-card divide-y overflow-hidden">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {client.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                    </div>
                  </div>
                  {client.sector && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{client.sector}</span>
                  )}
                </div>
              ))}
              {clients.length > 5 && (
                <div className="px-4 py-3 text-center">
                  <Link href={`/workspace/${workspaceId}/clients`} className="text-sm text-primary hover:underline">
                    Ver {clients.length - 5} más →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string; href: string | null }) {
  const inner = (
    <div className="rounded-lg border bg-card p-5 h-full hover:border-primary/50 transition-colors">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1 font-mono">{value}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function EmptyState({ message, action }: { message: string; action: { label: string; href: string } }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center bg-card">
      <p className="text-muted-foreground text-sm mb-3">{message}</p>
      <Link href={action.href} className="text-sm text-primary hover:underline font-medium">
        {action.label}
      </Link>
    </div>
  )
}

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high:     'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  low:      'bg-muted text-muted-foreground',
}

const PRIORITY_LABEL: Record<string, string> = {
  critical: 'Crítica',
  high:     'Alta',
  medium:   'Media',
  low:      'Baja',
}

const STATE_BADGE: Record<string, string> = {
  blocked:      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  waiting_ai:   'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_progress:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  waiting_user: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  ready:        'bg-muted text-muted-foreground',
}

function formatMinutes(min: number): string {
  if (min <= 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function MissionCard({
  obj,
  workspaceId,
  state,
  nextStepTitle,
  total,
  done,
  progress,
}: {
  obj: CompanyObjectiveData
  workspaceId: string
  state: string
  nextStepTitle: string | null
  total: number
  done: number
  progress: number
}) {
  return (
    <Link
      href={`/workspace/${workspaceId}/missions/${obj.id}`}
      className="block rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-muted/20 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
              {obj.label}
            </span>
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[obj.priority] ?? 'bg-muted text-muted-foreground'}`}>
              {PRIORITY_LABEL[obj.priority] ?? obj.priority}
            </span>
            {STATE_BADGE[state] && (
              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${STATE_BADGE[state]}`}>
                {MISSION_STATE_LABELS[state as keyof typeof MISSION_STATE_LABELS] ?? state}
              </span>
            )}
          </div>

          {/* Barra de progreso */}
          {total > 0 ? (
            <div className="flex gap-0.5 h-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${i < done ? 'bg-green-500' : 'bg-muted/60'}`}
                />
              ))}
            </div>
          ) : (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              {total > 0
                ? `${done}/${total} pasos · ${progress}%`
                : `${progress}%`}
            </span>
            {nextStepTitle && (
              <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                {nextStepTitle}
              </span>
            )}
          </div>
        </div>

        <span className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5 text-sm">
          →
        </span>
      </div>
    </Link>
  )
}
