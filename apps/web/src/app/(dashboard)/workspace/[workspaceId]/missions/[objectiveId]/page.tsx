/**
 * Página de detalle de misión — Mission Execution Engine.
 *
 * Responde en todo momento a:
 *   ¿Qué tengo que hacer?  → Próxima acción destacada
 *   ¿Qué falta?            → Lista de pasos pendientes
 *   ¿Qué herramienta uso?  → Recomendación por paso
 *   ¿Qué gano al terminar? → Impacto esperado
 */

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSteps } from '@/lib/missions/mission-steps'
import {
  nextStep,
} from '@/lib/missions/types'
import type { MissionStepData, MissionState, ResponsibleActor, StepPriority, StepStatus, TimelineEventType } from '@/lib/missions/types'
import { getOrCreateIntelligence } from '@/lib/missions/intelligence'
import { computeMissionState, getNextAction } from '@/lib/missions/mission-state'
import { getTimeline } from '@/lib/missions/timeline'
import { MissionStepActions } from './_components/MissionStepActions'
import { AISuggestionPanel } from './_components/AISuggestionPanel'
import { StepAssignee } from './_components/StepAssignee'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ workspaceId: string; objectiveId: string }>
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high:     'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  low:      'bg-muted text-muted-foreground',
}

const STATUS_ICON: Record<string, string> = {
  pending:     '○',
  in_progress: '◑',
  completed:   '●',
  skipped:     '—',
  blocked:     '⊘',
}

const STATUS_STYLE: Record<string, string> = {
  pending:     'text-muted-foreground',
  in_progress: 'text-blue-600 dark:text-blue-400',
  completed:   'text-green-600 dark:text-green-400',
  skipped:     'text-muted-foreground/50',
  blocked:     'text-red-600 dark:text-red-400',
}

const STATE_STYLE: Record<string, string> = {
  new:          'bg-muted text-muted-foreground',
  ready:        'bg-muted text-muted-foreground',
  in_progress:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  waiting_user: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  waiting_ai:   'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  blocked:      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived:     'bg-muted text-muted-foreground',
}

const ACTOR_ICON: Record<string, string> = { user: '👤', ai: '✨', shared: '🤝' }

function deriveWhy(t: DashboardTranslations, objectiveLabel: string, priority: string): string {
  if (priority === 'critical' || priority === 'high')
    return `"${objectiveLabel}": ${t.missionDefaultWhyHigh}`
  return `"${objectiveLabel}": ${t.missionDefaultWhyNormal}`
}

function deriveBenefit(t: DashboardTranslations, impactScore: number): string {
  if (impactScore >= 4) return t.missionDefaultBenefitHigh
  if (impactScore === 3) return t.missionDefaultBenefitMedium
  return t.missionDefaultBenefitLow
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

function categoryLabels(t: DashboardTranslations): Record<string, string> {
  return {
    AUDIT:      t.toolsCategoryAudit,
    EVALUATION: t.toolsCategoryEvaluation,
    CHECKLIST:  t.toolsCategoryChecklist,
    CRM:        t.toolsCategoryCrm,
    REPORT:     t.toolsCategoryReport,
    HR:         t.toolsCategoryHr,
    OPERATIONS: t.toolsCategoryOperations,
    FINANCE:    t.toolsCategoryFinance,
    CUSTOM:     t.toolsCategoryCustom,
  }
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function getStepStatusLabels(t: DashboardTranslations): Record<StepStatus, string> {
  return {
    pending:     t.missionStepStatusPending,
    in_progress: t.missionStepStatusInProgress,
    completed:   t.missionStepStatusCompleted,
    skipped:     t.missionStepStatusSkipped,
    blocked:     t.missionStepStatusBlocked,
  }
}

function getStepPriorityLabels(t: DashboardTranslations): Record<StepPriority, string> {
  return {
    low:      t.missionsPriorityLow,
    medium:   t.missionsPriorityMedium,
    high:     t.missionsPriorityHigh,
    critical: t.missionsPriorityCritical,
  }
}

function getResponsibleActorLabels(t: DashboardTranslations): Record<ResponsibleActor, string> {
  return {
    user:   t.missionActorUser,
    ai:     t.missionActorAi,
    shared: t.missionActorShared,
  }
}

function getMissionStateLabels(t: DashboardTranslations): Record<MissionState, string> {
  return {
    new:          t.missionStateNew,
    ready:        t.missionStateReady,
    in_progress:  t.missionStateInProgress,
    waiting_user: t.missionStateWaitingUser,
    waiting_ai:   t.missionStateWaitingAi,
    blocked:      t.missionStateBlocked,
    completed:    t.missionStateCompleted,
    archived:     t.missionStateArchived,
  }
}

function getTimelineEventLabels(t: DashboardTranslations): Record<TimelineEventType, string> {
  return {
    created:   t.missionsStatusActive === 'Activa' ? 'Creada' : 'Created',
    started:   t.missionsStatusActive === 'Activa' ? 'Iniciada' : 'Started',
    paused:    t.missionsStatusPaused,
    completed: t.missionsStatusCompleted,
  }
}

export default async function MissionPage({ params }: Props) {
  const [{ workspaceId, objectiveId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const [objective, toolInstances] = await Promise.all([
    db.companyObjective.findFirst({
      where: { id: objectiveId, workspaceId, workspace: { orgId: user.orgId } },
    }),
    db.toolInstance.findMany({
      where:   { workspaceId, status: 'ACTIVE' },
      select:  { id: true, name: true, toolDefinition: { select: { category: true } } },
    }),
  ])

  if (!objective) notFound()

  const steps = await getSteps(objectiveId, workspaceId)
  const next  = nextStep(steps)

  const intelligence = await getOrCreateIntelligence(objectiveId, workspaceId)
  const state  = computeMissionState(objective.status, steps)
  const action = getNextAction(state, steps)
  const timeline = await getTimeline(objectiveId, workspaceId)

  const totalSteps     = steps.length
  const completedSteps = steps.filter((s) => s.status === 'completed').length
  const pendingSteps   = steps.filter((s) => s.status === 'pending' || s.status === 'in_progress').length
  const progress       = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : objective.progress

  const totalMinutes   = steps.reduce((acc, s) => acc + (s.estimatedMinutes ?? 0), 0)
  const doneMinutes    = steps
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + (s.estimatedMinutes ?? 0), 0)
  const remainMinutes  = totalMinutes - doneMinutes

  // Mapear tool instances por categoría para recomendaciones
  const toolsByCategory: Record<string, { id: string; name: string }[]> = {}
  for (const ti of toolInstances) {
    const cat = ti.toolDefinition.category
    if (!toolsByCategory[cat]) toolsByCategory[cat] = []
    toolsByCategory[cat].push({ id: ti.id, name: ti.name })
  }

  const statusLabel: Record<string, string> = {
    active:    t.missionsStatusActive,
    completed: t.missionsStatusCompleted,
    paused:    t.missionStatusPausedAlt,
    cancelled: t.missionsStatusCancelled,
  }
  const stepStatusLabels = getStepStatusLabels(t)
  const stepPriorityLabels = getStepPriorityLabels(t)
  const responsibleActorLabels = getResponsibleActorLabels(t)
  const missionStateLabels = getMissionStateLabels(t)
  const timelineEventLabels = getTimelineEventLabels(t)
  const translatedCategoryLabels = categoryLabels(t)
  const statusStyle: Record<string, string> = {
    active:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    paused:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    cancelled: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/workspace/${workspaceId}/missions`} className="hover:text-foreground transition-colors">
          {t.missionsTitle}
        </Link>
        <span className="text-muted-foreground/40">›</span>
        <span className="text-foreground font-medium truncate">{objective.label}</span>
      </nav>

      {/* Header de misión */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold flex-1 min-w-0">{objective.label}</h1>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[objective.status] ?? 'bg-muted text-muted-foreground'}`}>
            {statusLabel[objective.status] ?? objective.status}
          </span>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[objective.priority] ?? 'bg-muted text-muted-foreground'}`}>
            {stepPriorityLabels[objective.priority as StepPriority] ?? objective.priority}
          </span>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATE_STYLE[state] ?? 'bg-muted text-muted-foreground'}`}>
            {missionStateLabels[state]}
          </span>
        </div>

        {objective.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{objective.description}</p>
        )}

        {objective.dueDate && (
          <p className="text-xs text-muted-foreground">
            {t.missionDueDate}:{' '}
            <span className="font-medium text-foreground">
              {new Date(objective.dueDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t.missionProgressTitle}</span>
          <span className="text-lg font-bold font-mono">{progress}%</span>
        </div>

        {/* Barra segmentada por pasos */}
        {totalSteps > 0 ? (
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex-1 rounded-sm transition-colors ${
                  step.status === 'completed'   ? 'bg-green-500' :
                  step.status === 'in_progress' ? 'bg-blue-500'  :
                  step.status === 'skipped'     ? 'bg-muted'     :
                  'bg-muted/50'
                }`}
                title={`${step.title}: ${stepStatusLabels[step.status]}`}
              />
            ))}
          </div>
        ) : (
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Métricas de progreso */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <ProgressMetric
            label={t.missionCompletedSteps}
            value={totalSteps > 0 ? `${completedSteps}/${totalSteps}` : `${progress}%`}
          />
          <ProgressMetric
            label={t.missionPendingStepsMetric}
            value={String(pendingSteps)}
            highlight={pendingSteps > 0}
          />
          <ProgressMetric
            label={t.missionRemainingTime}
            value={remainMinutes > 0 ? formatMinutes(remainMinutes) : totalMinutes > 0 ? `✓ ${t.missionCompletedValue}` : '—'}
          />
          <ProgressMetric
            label={t.missionExpectedImpact}
            value={objective.priority === 'critical' ? t.missionImpactCritical : objective.priority === 'high' ? t.missionImpactHigh : t.missionImpactMedium}
          />
        </div>
      </div>

      {/* Próxima acción — siempre visible (Next Action, MISSION-002) */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-primary">→</span>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">{t.missionNextAction}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {ACTOR_ICON[action.actor]} {responsibleActorLabels[action.actor]}
          </span>
        </div>
        <p className="font-semibold text-base">{action.text}</p>
        {next && (
        <>
          {next.description && (
            <p className="text-sm text-muted-foreground">{next.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {next.estimatedMinutes && (
              <span className="text-xs text-muted-foreground">
                ⏱ {formatMinutes(next.estimatedMinutes)}
              </span>
            )}
            {next.recommendedCategory && toolsByCategory[next.recommendedCategory]?.[0] && (
              <Link
                href={`/workspace/${workspaceId}/tools/${toolsByCategory[next.recommendedCategory]![0]!.id}/run?fromMission=${objectiveId}&fromStep=${next.id}`}
                className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                {CATEGORY_ICONS[next.recommendedCategory] ?? '⬡'}
                {' '}{t.missionOpenTool}
              </Link>
            )}
          </div>
        </>
        )}
      </div>

      {/* Por qué importa esta misión (Mission Insights, MISSION-002) */}
      <section className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">{t.missionWhyTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intelligence.why ?? deriveWhy(t, objective.label, objective.priority)}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intelligence.expectedBenefit ?? deriveBenefit(t, intelligence.impactScore)}
        </p>
        {intelligence.whatItUnlocks && (
          <p className="text-sm">
            <span className="font-medium">{t.missionUnlocks}: </span>
            <span className="text-muted-foreground">{intelligence.whatItUnlocks}</span>
          </p>
        )}
        {intelligence.departmentsAffected && (
          <p className="text-sm">
            <span className="font-medium">{t.missionDepartmentsAffected}: </span>
            <span className="text-muted-foreground">{intelligence.departmentsAffected}</span>
          </p>
        )}
      </section>

      {/* Impacto esperado (Business Impact, MISSION-002 Fase 4) */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">{t.missionImpactTitle}</h2>
        <div className="grid grid-cols-3 gap-4">
          <ImpactStat label={t.missionImpact} score={intelligence.impactScore} />
          <ImpactStat label={t.missionUrgency} score={intelligence.urgencyScore} />
          <ImpactStat label={t.missionEffort} score={intelligence.effortScore} />
        </div>
        {intelligence.riskLevel === 'high' && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-3">⚠ {t.missionHighRisk}</p>
        )}
      </section>

      {/* Sugerencias de IA — disponibles durante la ejecución, no solo al completar */}
      <AISuggestionPanel
        objectiveId={objectiveId}
        workspaceId={workspaceId}
        initialRecommendations={intelligence.aiRecommendations}
        missionCompleted={state === 'completed'}
        locale={locale}
      />

      {/* Línea temporal (Mission Timeline, MISSION-002 Fase 7 simplificada) */}
      {timeline.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t.missionTimeline}</h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              {timeline.map((ev, i) => (
                <span key={ev.id} className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">
                    {timelineEventLabels[ev.event]}
                  </span>
                  {i < timeline.length - 1 && <span className="text-muted-foreground/40">→</span>}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lista de pasos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.missionStepsTitle}</h2>
          {totalSteps > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedSteps} / {totalSteps} {t.todayCompletedProgress}
            </span>
          )}
        </div>

        {steps.length === 0 ? (
          <EmptySteps workspaceId={workspaceId} t={t} />
        ) : (
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <StepCard
                key={step.id}
                step={step}
                index={idx + 1}
                workspaceId={workspaceId}
                objectiveId={objectiveId}
                toolsByCategory={toolsByCategory}
                t={t}
                locale={locale}
                categoryLabels={translatedCategoryLabels}
                stepPriorityLabels={stepPriorityLabels}
                responsibleActorLabels={responsibleActorLabels}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial / Workflow asociado */}
      {objective.linkedWorkflowId && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t.missionLinkedWorkflow}</h2>
          <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.missionLinkedWorkflowTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.missionLinkedWorkflowDescription}</p>
            </div>
            <Link
              href={`/workspace/${workspaceId}/workflows/${objective.linkedWorkflowId}`}
              className="text-sm text-primary hover:underline font-medium shrink-0"
            >
              {t.missionOpenWorkflow} →
            </Link>
          </div>
        </section>
      )}

      {/* CTA — nunca dejar al usuario sin próxima acción */}
      <div className="rounded-lg border bg-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t.missionNeedHelp}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.missionNeedHelpDescription}</p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/copilot`}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm bg-card border px-4 py-2 rounded-md font-medium hover:bg-muted transition-colors"
        >
          {t.missionOpenArkos}
        </Link>
      </div>
    </div>
  )
}

function ImpactStat({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-base" aria-label={`${score} de 5`}>
        {'★'.repeat(score)}{'☆'.repeat(5 - score)}
      </p>
    </div>
  )
}

function ProgressMetric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 font-mono ${highlight ? 'text-orange-600 dark:text-orange-400' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function StepCard({
  step,
  index,
  workspaceId,
  objectiveId,
  toolsByCategory,
  t,
  locale,
  categoryLabels,
  stepPriorityLabels,
  responsibleActorLabels,
}: {
  step:            MissionStepData
  index:           number
  workspaceId:     string
  objectiveId:     string
  toolsByCategory: Record<string, { id: string; name: string }[]>
  t:               DashboardTranslations
  locale:          Locale
  categoryLabels:  Record<string, string>
  stepPriorityLabels: Record<StepPriority, string>
  responsibleActorLabels: Record<ResponsibleActor, string>
}) {
  const isCompleted = step.status === 'completed'
  const isSkipped   = step.status === 'skipped'
  const tool        = step.recommendedCategory ? (toolsByCategory[step.recommendedCategory]?.[0] ?? null) : null
  const toolInstanceId = step.linkedToolInstanceId ?? tool?.id ?? null
  const toolHref    = toolInstanceId
    ? `/workspace/${workspaceId}/tools/${toolInstanceId}/run?fromMission=${objectiveId}&fromStep=${step.id}`
    : null

  return (
    <div className={`rounded-lg border bg-card p-4 space-y-2 transition-opacity ${isCompleted || isSkipped ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Número y estado */}
        <div className={`mt-0.5 text-base font-bold w-5 shrink-0 ${STATUS_STYLE[step.status]}`}>
          {STATUS_ICON[step.status]}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {step.title}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[step.priority]}`}>
              {stepPriorityLabels[step.priority]}
            </span>
            <span className="text-xs text-muted-foreground" title={t.missionResponsibleTitle}>
              {ACTOR_ICON[step.responsibleActor]} {responsibleActorLabels[step.responsibleActor]}
            </span>
          </div>

          {step.description && !isCompleted && (
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap pt-0.5">
            {step.estimatedMinutes && (
              <span className="text-xs text-muted-foreground">
                ⏱ {formatMinutes(step.estimatedMinutes)}
              </span>
            )}
            {step.recommendedCategory && (
              <span className="text-xs text-muted-foreground">
                {CATEGORY_ICONS[step.recommendedCategory] ?? '⬡'} {categoryLabels[step.recommendedCategory] ?? step.recommendedCategory}
              </span>
            )}
            {toolHref && !isCompleted && (
              <Link
                href={toolHref}
                className="text-xs text-primary hover:underline font-medium"
              >
                {t.missionOpenTool} →
              </Link>
            )}
            {!toolHref && !isCompleted && step.recommendedCategory && (
              <Link
                href={`/workspace/${workspaceId}/tools`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
              >
                {t.missionInstallTool} →
              </Link>
            )}
            {step.completedAt && (
              <span className="text-xs text-muted-foreground">
                ✓ {new Date(step.completedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        {/* Asignación + acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <StepAssignee
            stepId={step.id}
            objectiveId={objectiveId}
            workspaceId={workspaceId}
            assignedUserId={step.assignedUserId}
            assignedUserName={step.assignedUserName}
          />
          <MissionStepActions
            stepId={step.id}
            objectiveId={objectiveId}
            workspaceId={workspaceId}
            currentStatus={step.status}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}

function EmptySteps({ workspaceId, t }: { workspaceId: string; t: DashboardTranslations }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-10 text-center space-y-3">
      <p className="text-muted-foreground text-sm">
        {t.missionNoStepsTitle}
      </p>
      <p className="text-xs text-muted-foreground">
        {t.missionNoStepsDescription}
      </p>
      <Link
        href={`/workspace/${workspaceId}/copilot`}
        className="inline-block text-sm text-primary hover:underline font-medium"
      >
        {t.missionDefineStepsWithArkos} →
      </Link>
    </div>
  )
}
