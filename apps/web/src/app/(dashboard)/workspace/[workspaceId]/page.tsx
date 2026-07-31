import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FirstTimeExperience } from './_components/FirstTimeExperience'
import { getObjectives } from '@/lib/business-memory'
import { getSteps } from '@/lib/missions/mission-steps'
import { nextStep } from '@/lib/missions/types'
import type { CompanyObjectiveData } from '@/lib/business-memory'
import { getOrCreateIntelligence } from '@/lib/missions/intelligence'
import { computeMissionState, getNextAction, remainingMinutes } from '@/lib/missions/mission-state'
import { rankMissions } from '@/lib/missions/prioritization'
import { MISSION_STATE_LABELS } from '@/lib/missions/types'
import { IntelligenceBand } from './_components/IntelligenceBand'
import { PendingReviews } from './_components/PendingReviews'
import { OnboardingChecklist } from './_components/OnboardingChecklist'
import { WorkspaceActivityFeed } from './_components/WorkspaceActivityFeed'
import { TrialBanner } from './_components/TrialBanner'
import { LastExecutionWidget } from './_components/LastExecutionWidget'
import { MissionTemplateButton } from './_components/MissionTemplateModal'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, clientCount, toolInstanceCount, companyProfile] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.client.count({ where: { workspaceId, isArchived: false } }),
    db.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } }),
    db.companyProfile.findUnique({ where: { workspaceId }, select: { sector: true } }),
  ])

  if (!workspace) notFound()

  const firstName = (user.name ?? user.email ?? '').split(' ')[0]?.split('@')[0] ?? ''

  const isFirstTime = toolInstanceCount === 0 && clientCount === 0
  if (isFirstTime) {
    return <FirstTimeExperience workspaceId={workspaceId} userName={firstName} sector={companyProfile?.sector ?? null} />
  }

  // QW-4: mostrar banda solo cuando ha cambiado el día de calendario, no por intervalo de 3h
  const previousVisit = user.lastSeenAt
  const now = new Date()
  void db.user.update({ where: { id: user.id }, data: { lastSeenAt: now } }).catch(() => undefined)

  const showSinceLastVisit =
    previousVisit !== null &&
    previousVisit.toDateString() !== now.toDateString()


  // Misiones activas con inteligencia y pasos
  const activeObjectives = await getObjectives(workspaceId, 'active')
  const objectivesWithSteps = await Promise.all(
    activeObjectives.map(async (obj) => {
      const steps = await getSteps(obj.id, workspaceId)
      const intelligence = await getOrCreateIntelligence(obj.id, workspaceId)
      const state  = computeMissionState(obj.status, steps)
      const action = getNextAction(state, steps)
      const next   = nextStep(steps)
      const total  = steps.length
      const done   = steps.filter((s) => s.status === 'completed').length
      const progress = total > 0 ? Math.round((done / total) * 100) : obj.progress
      return { obj, steps, intelligence, state, action, next, total, done, progress }
    }),
  )

  const ranked = rankMissions(
    objectivesWithSteps.map((m) => ({
      objective:   m.obj,
      intelligence: m.intelligence,
      state:        m.state,
    })),
  )

  const orderById   = new Map(ranked.map((r, i) => [r.item.objective.id, i]))
  // QW-1: reasons para todas las misiones, no solo el top
  const reasonsById = new Map(ranked.map((r) => [r.item.objective.id, r.reasons]))

  const sortedMissions = [...objectivesWithSteps].sort(
    (a, b) => (orderById.get(a.obj.id) ?? 0) - (orderById.get(b.obj.id) ?? 0),
  )

  // Resumen de estado para la barra de workload
  const blockedCount  = objectivesWithSteps.filter((m) => m.state === 'blocked').length
  const overdueCount  = objectivesWithSteps.filter((m) => {
    const d = daysUntilDue(m.obj.dueDate); return d !== null && d <= 0
  }).length
  const dueSoonCount  = objectivesWithSteps.filter((m) => {
    const d = daysUntilDue(m.obj.dueDate); return d !== null && d > 0 && d <= 7
  }).length

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Panel — qué es lo más importante que debes hacer hoy
        </p>
      </div>

      {/* Trial banner — visible solo durante el periodo de prueba */}
      <TrialBanner orgId={user.orgId} />

      {/* Sprint 1 — Banda de Inteligencia */}
      {showSinceLastVisit && (
        <IntelligenceBand
          workspaceId={workspaceId}
          userName={firstName}
          since={previousVisit!}
        />
      )}

      {/* Acceso rápido a última ejecución */}
      <LastExecutionWidget workspaceId={workspaceId} />

      {/* Onboarding — desaparece cuando todos los pasos están completos */}
      <OnboardingChecklist workspaceId={workspaceId} userId={user.id} />

      {/* Revisiones periódicas */}
      <PendingReviews workspaceId={workspaceId} />

      {/* Misiones activas */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold">Misiones activas</h2>
          <div className="flex items-center gap-3">
            <MissionTemplateButton workspaceId={workspaceId} />
            <Link href={`/workspace/${workspaceId}/copilot`} className="text-sm text-primary hover:underline">
              Crear misión →
            </Link>
          </div>
        </div>

        {/* Sprint 1 — Barra de estado del workload */}
        {sortedMissions.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-4">
            <span className="text-muted-foreground">{sortedMissions.length} activa{sortedMissions.length !== 1 ? 's' : ''}</span>
            {blockedCount > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                · {blockedCount} bloqueada{blockedCount !== 1 ? 's' : ''}
              </span>
            )}
            {overdueCount > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                · {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                · {dueSoonCount} vence{dueSoonCount !== 1 ? 'n' : ''} esta semana
              </span>
            )}
          </div>
        )}

        {sortedMissions.length === 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Una misión es un objetivo de tu empresa dividido en pasos concretos — tú o la IA los vais completando.
          </p>
        )}

        {/* Sprint 1 — Alerta de misiones bloqueadas */}
        {blockedCount > 0 && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3 mb-4 space-y-3">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              {blockedCount === 1
                ? 'Para continuar, resuelve este bloqueo:'
                : `Para continuar, resuelve estos ${blockedCount} bloqueos:`}
            </p>
            {sortedMissions
              .filter((m) => m.state === 'blocked')
              .map((m) => {
                const rawAction = m.intelligence.nextActionText ?? m.action.text
                const actionText = rawAction?.startsWith('Define los pasos') ? null : rawAction
                return (
                  <div key={m.obj.id} className="space-y-0.5">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">{m.obj.label}</p>
                    {actionText && (
                      <p className="text-xs text-red-600/80 dark:text-red-400/80">{actionText}</p>
                    )}
                    <Link
                      href={`/workspace/${workspaceId}/missions/${m.obj.id}`}
                      className="inline-block text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      Resolver bloqueo →
                    </Link>
                  </div>
                )
              })}
          </div>
        )}

        {sortedMissions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center bg-card">
            <p className="text-muted-foreground text-sm mb-2">No hay misiones activas.</p>
            <p className="text-xs text-muted-foreground mb-4">
              Cuéntale a Arkos un objetivo de tu empresa y lo convertirá en una misión con pasos claros, o usa una plantilla para empezar al instante.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <MissionTemplateButton workspaceId={workspaceId} />
              <Link
                href={`/workspace/${workspaceId}/copilot`}
                className="text-sm text-primary hover:underline font-medium"
              >
                Definir con Arkos →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMissions.map(({ obj, state, action, intelligence, steps, total, done, progress }, index) => (
              <MissionCard
                key={obj.id}
                obj={obj}
                workspaceId={workspaceId}
                state={state}
                isExpanded={index === 0 && blockedCount === 0}
                nextActionText={intelligence.nextActionText ?? action.text}
                whatItUnlocks={index === 0 && blockedCount === 0 ? (intelligence.whatItUnlocks ?? null) : null}
                estimatedMinutes={index === 0 && blockedCount === 0 ? remainingMinutes(steps) : null}
                total={total}
                done={done}
                progress={progress}
                reasons={reasonsById.get(obj.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      {/* Actividad reciente del workspace */}
      <WorkspaceActivityFeed workspaceId={workspaceId} />

    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMinutes(min: number): string {
  if (min <= 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// QW-6: días hasta vencimiento (negativo = vencida)
function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Constantes de estilo ───────────────────────────────────────────────────────

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

// ── MissionCard ────────────────────────────────────────────────────────────────

function MissionCard({
  obj,
  workspaceId,
  state,
  isExpanded,
  nextActionText,
  whatItUnlocks,
  estimatedMinutes,
  total,
  done,
  progress,
  reasons,
}: {
  obj: CompanyObjectiveData
  workspaceId: string
  state: string
  isExpanded: boolean
  nextActionText: string | null
  whatItUnlocks: string | null
  estimatedMinutes: number | null
  total: number
  done: number
  progress: number
  reasons: string[]
}) {
  const days = daysUntilDue(obj.dueDate)
  const actionText = nextActionText && !nextActionText.startsWith('Define los pasos') ? nextActionText : null
  const significantReasons = reasons.filter((r) => r !== 'Objetivo activo del negocio')

  const badges = (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[obj.priority] ?? 'bg-muted text-muted-foreground'}`}>
        {PRIORITY_LABEL[obj.priority] ?? obj.priority}
      </span>
      {STATE_BADGE[state] && (
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${STATE_BADGE[state]}`}>
          {MISSION_STATE_LABELS[state as keyof typeof MISSION_STATE_LABELS] ?? state}
        </span>
      )}
      {days !== null && days <= 14 && (
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
          days <= 0
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : days <= 7
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {days <= 0 ? 'Vencida' : `Vence en ${days}d`}
        </span>
      )}
    </div>
  )

  const progressBar = total > 0 ? (
    <div className="flex gap-0.5 h-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`flex-1 rounded-sm ${i < done ? 'bg-green-500' : 'bg-muted/60'}`} />
      ))}
    </div>
  ) : (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
    </div>
  )

  if (isExpanded) {
    return (
      <Link
        href={`/workspace/${workspaceId}/missions/${obj.id}`}
        className="block rounded-xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-card p-5 hover:border-primary/40 transition-all group space-y-4"
      >
        {/* Encabezado */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Foco de la jornada</p>
            {obj.clientName && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/60 border border-primary/20 rounded px-1.5 py-0.5 leading-none">
                {obj.clientName}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold group-hover:text-primary transition-colors">{obj.label}</h3>
          {badges}
        </div>

        {/* Acción concreta */}
        {actionText && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Ahora</p>
            <p className="text-sm font-medium text-foreground">{actionText}</p>
          </div>
        )}

        {/* Razones de priorización */}
        {significantReasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">¿Por qué primero?</p>
            <ul className="space-y-0.5">
              {significantReasons.map((r) => (
                <li key={r} className="text-xs flex gap-1.5 text-muted-foreground">
                  <span className="text-primary shrink-0">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contexto: desbloqueos + tiempo */}
        {(whatItUnlocks || (estimatedMinutes !== null && estimatedMinutes > 0)) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {whatItUnlocks && <span><span className="font-medium">Desbloqueará:</span> {whatItUnlocks}</span>}
            {estimatedMinutes !== null && estimatedMinutes > 0 && (
              <span><span className="font-medium">Tiempo:</span> {formatMinutes(estimatedMinutes)}</span>
            )}
          </div>
        )}

        {/* Progreso + CTA */}
        <div className="space-y-2">
          {progressBar}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {total > 0 ? `${done}/${total} pasos · ${progress}%` : `${progress}%`}
            </span>
            <span className="text-sm font-medium text-primary group-hover:underline">
              Continuar misión →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Tarjeta compacta
  return (
    <Link
      href={`/workspace/${workspaceId}/missions/${obj.id}`}
      className="block rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-muted/20 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-1">
            {obj.clientName && (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/60">{obj.clientName}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                {obj.label}
              </span>
              {badges}
            </div>
          </div>

          {actionText && (
            <p className="text-sm text-foreground/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-2">Ahora:</span>
              {actionText}
            </p>
          )}

          {significantReasons[0] && (
            <p className="text-xs text-muted-foreground">
              <span className="text-primary mr-1">↳</span>
              {significantReasons[0]}
            </p>
          )}

          {progressBar}

          <span className="text-xs text-muted-foreground">
            {total > 0 ? `${done}/${total} pasos · ${progress}%` : `${progress}%`}
          </span>
        </div>

        <span className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5 text-sm">
          →
        </span>
      </div>
    </Link>
  )
}
