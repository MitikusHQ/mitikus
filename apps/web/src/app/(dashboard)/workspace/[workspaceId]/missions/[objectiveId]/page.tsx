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
  STEP_STATUS_LABELS,
  STEP_PRIORITY_LABELS,
  RESPONSIBLE_ACTOR_LABELS,
  MISSION_STATE_LABELS,
  TIMELINE_EVENT_LABELS,
} from '@/lib/missions/types'
import type { MissionStepData } from '@/lib/missions/types'
import { getOrCreateIntelligence } from '@/lib/missions/intelligence'
import { computeMissionState, getNextAction } from '@/lib/missions/mission-state'
import { getTimeline } from '@/lib/missions/timeline'
import { MissionStepActions } from './_components/MissionStepActions'
import { AISuggestionPanel } from './_components/AISuggestionPanel'
import { StepAssignee } from './_components/StepAssignee'

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

function deriveWhy(objectiveLabel: string, priority: string): string {
  if (priority === 'critical' || priority === 'high')
    return `"${objectiveLabel}" está marcada como prioridad ${priority === 'critical' ? 'crítica' : 'alta'} para el negocio — conviene resolverla cuanto antes.`
  return `"${objectiveLabel}" forma parte de los objetivos activos de la empresa.`
}

function deriveBenefit(impactScore: number): string {
  if (impactScore >= 4) return 'Alto impacto: desbloquea capacidades y mejora el conocimiento de la empresa.'
  if (impactScore === 3) return 'Impacto moderado: avanza el conocimiento y la operativa de la empresa.'
  return 'Impacto puntual: mejora un aspecto concreto de la operativa.'
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

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default async function MissionPage({ params }: Props) {
  const [{ workspaceId, objectiveId }, user] = await Promise.all([params, requireUser()])

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
    active:    'Activa',
    completed: 'Completada',
    paused:    'En pausa',
    cancelled: 'Cancelada',
  }
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
        <Link href={`/workspace/${workspaceId}`} className="hover:text-foreground transition-colors">
          Mission Control
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
            {STEP_PRIORITY_LABELS[objective.priority as keyof typeof STEP_PRIORITY_LABELS] ?? objective.priority}
          </span>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATE_STYLE[state] ?? 'bg-muted text-muted-foreground'}`}>
            {MISSION_STATE_LABELS[state]}
          </span>
        </div>

        {objective.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{objective.description}</p>
        )}

        {objective.dueDate && (
          <p className="text-xs text-muted-foreground">
            Fecha límite:{' '}
            <span className="font-medium text-foreground">
              {new Date(objective.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progreso de la misión</span>
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
                title={`${step.title}: ${STEP_STATUS_LABELS[step.status]}`}
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
            label="Pasos completados"
            value={totalSteps > 0 ? `${completedSteps}/${totalSteps}` : `${progress}%`}
          />
          <ProgressMetric
            label="Pendientes"
            value={String(pendingSteps)}
            highlight={pendingSteps > 0}
          />
          <ProgressMetric
            label="Tiempo restante"
            value={remainMinutes > 0 ? formatMinutes(remainMinutes) : totalMinutes > 0 ? '✓ Completado' : '—'}
          />
          <ProgressMetric
            label="Impacto esperado"
            value={objective.priority === 'critical' ? 'Crítico' : objective.priority === 'high' ? 'Alto' : 'Medio'}
          />
        </div>
      </div>

      {/* Próxima acción — siempre visible (Next Action, MISSION-002) */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-primary">→</span>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Próxima acción</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {ACTOR_ICON[action.actor]} {RESPONSIBLE_ACTOR_LABELS[action.actor]}
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
                {' '}Abrir herramienta
              </Link>
            )}
          </div>
        </>
        )}
      </div>

      {/* Por qué importa esta misión (Mission Insights, MISSION-002) */}
      <section className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Por qué importa</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intelligence.why ?? deriveWhy(objective.label, objective.priority)}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intelligence.expectedBenefit ?? deriveBenefit(intelligence.impactScore)}
        </p>
        {intelligence.whatItUnlocks && (
          <p className="text-sm">
            <span className="font-medium">Desbloqueará: </span>
            <span className="text-muted-foreground">{intelligence.whatItUnlocks}</span>
          </p>
        )}
        {intelligence.departmentsAffected && (
          <p className="text-sm">
            <span className="font-medium">Departamentos afectados: </span>
            <span className="text-muted-foreground">{intelligence.departmentsAffected}</span>
          </p>
        )}
      </section>

      {/* Impacto esperado (Business Impact, MISSION-002 Fase 4) */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Impacto esperado</h2>
        <div className="grid grid-cols-3 gap-4">
          <ImpactStat label="Impacto" score={intelligence.impactScore} />
          <ImpactStat label="Urgencia" score={intelligence.urgencyScore} />
          <ImpactStat label="Esfuerzo" score={intelligence.effortScore} />
        </div>
        {intelligence.riskLevel === 'high' && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-3">⚠ Riesgo alto si se pospone</p>
        )}
      </section>

      {/* Sugerencias de IA — disponibles durante la ejecución, no solo al completar */}
      <AISuggestionPanel
        objectiveId={objectiveId}
        workspaceId={workspaceId}
        initialRecommendations={intelligence.aiRecommendations}
        missionCompleted={state === 'completed'}
      />

      {/* Línea temporal (Mission Timeline, MISSION-002 Fase 7 simplificada) */}
      {timeline.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Línea temporal</h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              {timeline.map((ev, i) => (
                <span key={ev.id} className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">
                    {TIMELINE_EVENT_LABELS[ev.event]}
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
          <h2 className="text-base font-semibold">Pasos de la misión</h2>
          {totalSteps > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedSteps} de {totalSteps} completados
            </span>
          )}
        </div>

        {steps.length === 0 ? (
          <EmptySteps workspaceId={workspaceId} />
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
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial / Workflow asociado */}
      {objective.linkedWorkflowId && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Flow asociado</h2>
          <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Flow vinculado a esta misión</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ver el proceso automatizado asociado</p>
            </div>
            <Link
              href={`/workspace/${workspaceId}/workflows/${objective.linkedWorkflowId}`}
              className="text-sm text-primary hover:underline font-medium shrink-0"
            >
              Abrir Flow →
            </Link>
          </div>
        </section>
      )}

      {/* CTA — nunca dejar al usuario sin próxima acción */}
      <div className="rounded-lg border bg-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">¿Necesitas ayuda con esta misión?</p>
          <p className="text-xs text-muted-foreground mt-0.5">El Copilot puede guiarte, crear pasos y recomendar herramientas.</p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/copilot`}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm bg-card border px-4 py-2 rounded-md font-medium hover:bg-muted transition-colors"
        >
          Abrir Copilot
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
}: {
  step:            MissionStepData
  index:           number
  workspaceId:     string
  objectiveId:     string
  toolsByCategory: Record<string, { id: string; name: string }[]>
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
              {STEP_PRIORITY_LABELS[step.priority]}
            </span>
            <span className="text-xs text-muted-foreground" title="Responsable">
              {ACTOR_ICON[step.responsibleActor]} {RESPONSIBLE_ACTOR_LABELS[step.responsibleActor]}
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
                {CATEGORY_ICONS[step.recommendedCategory] ?? '⬡'} {CATEGORY_LABELS[step.recommendedCategory] ?? step.recommendedCategory}
              </span>
            )}
            {toolHref && !isCompleted && (
              <Link
                href={toolHref}
                className="text-xs text-primary hover:underline font-medium"
              >
                Abrir herramienta →
              </Link>
            )}
            {!toolHref && !isCompleted && step.recommendedCategory && (
              <Link
                href={`/workspace/${workspaceId}/tools`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
              >
                Instalar herramienta →
              </Link>
            )}
            {step.completedAt && (
              <span className="text-xs text-muted-foreground">
                ✓ {new Date(step.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
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
          />
        </div>
      </div>
    </div>
  )
}

function EmptySteps({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-10 text-center space-y-3">
      <p className="text-muted-foreground text-sm">
        Esta misión no tiene pasos definidos todavía.
      </p>
      <p className="text-xs text-muted-foreground">
        Define los pasos para saber exactamente qué hacer, en qué orden y con qué herramienta.
      </p>
      <Link
        href={`/workspace/${workspaceId}/copilot`}
        className="inline-block text-sm text-primary hover:underline font-medium"
      >
        Definir pasos con el Copilot →
      </Link>
    </div>
  )
}
