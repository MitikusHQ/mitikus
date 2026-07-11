/**
 * Mission Execution Engine — tipos del sistema de ejecución de misiones.
 *
 * Un CompanyObjective es el QUÉ (objetivo estratégico).
 * Un MissionStep es el CÓMO (paso ejecutable dentro del objetivo).
 */

export type StepStatus   = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked'
export type StepPriority = 'low' | 'medium' | 'high' | 'critical'
export type ResponsibleActor = 'user' | 'ai' | 'shared'

// Mission State Engine (MISSION-002) — estado derivado del conjunto de pasos.
export type MissionState =
  | 'new'          // sin pasos definidos todavía
  | 'ready'        // pasos definidos, nada empezado aún
  | 'in_progress'  // el usuario está trabajando en el siguiente paso
  | 'waiting_user'  // hay progreso, pero el siguiente paso (de usuario) está pausado
  | 'waiting_ai'   // el siguiente paso depende de la IA
  | 'blocked'      // algún paso está bloqueado
  | 'completed'    // todos los pasos completados/omitidos
  | 'archived'     // objetivo cancelado/archivado manualmente

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  pending:     'Pendiente',
  in_progress: 'En progreso',
  completed:   'Completado',
  skipped:     'Omitido',
  blocked:     'Bloqueado',
}

export const STEP_PRIORITY_LABELS: Record<StepPriority, string> = {
  low:      'Baja',
  medium:   'Media',
  high:     'Alta',
  critical: 'Crítica',
}

export const RESPONSIBLE_ACTOR_LABELS: Record<ResponsibleActor, string> = {
  user:   'Tú',
  ai:     'IA',
  shared: 'Compartido',
}

export const MISSION_STATE_LABELS: Record<MissionState, string> = {
  new:          'Nueva',
  ready:        'Lista para empezar',
  in_progress:  'En progreso',
  waiting_user: 'Esperando a que continúes',
  waiting_ai:   'La IA está trabajando',
  blocked:      'Bloqueada',
  completed:    'Completada',
  archived:     'Archivada',
}

/** "Qué hacer ahora" — la respuesta que toda misión debe poder dar siempre. */
export interface NextAction {
  text:     string
  actor:    ResponsibleActor
  stepId:   string | null
  ctaLabel: string
}

export interface MissionStepData {
  id:          string
  objectiveId: string
  workspaceId: string

  title:            string
  description:      string | null
  status:           StepStatus
  priority:         StepPriority
  responsibleActor: ResponsibleActor
  estimatedMinutes: number | null
  sortOrder:        number

  assignedUserId:   string | null
  assignedUserName: string | null

  recommendedCategory:  string | null
  linkedToolInstanceId: string | null

  completedAt: string | null
  resultNote:  string | null

  createdAt: string
  updatedAt: string
}

export interface CreateStepInput {
  title:            string
  description?:     string
  priority?:        StepPriority
  responsibleActor?: ResponsibleActor
  estimatedMinutes?: number
  sortOrder?:       number
  recommendedCategory?:  string
  linkedToolInstanceId?: string
}

export interface UpdateStepInput {
  title?:           string
  description?:     string
  status?:          StepStatus
  priority?:        StepPriority
  responsibleActor?: ResponsibleActor
  estimatedMinutes?: number
  sortOrder?:       number
  assignedUserId?:  string | null
  recommendedCategory?:  string
  linkedToolInstanceId?: string
  resultNote?:      string
}

export interface AIRecommendation {
  title:  string
  reason: string
}

export interface MissionIntelligenceData {
  id:          string
  objectiveId: string
  workspaceId: string

  why:                 string | null
  expectedBenefit:     string | null
  whatItUnlocks:       string | null
  departmentsAffected: string | null

  impactScore:  number
  urgencyScore: number
  effortScore:  number
  riskLevel:    'low' | 'medium' | 'high'

  state: MissionState

  nextActionText:   string | null
  nextActionStepId: string | null

  aiRecommendations:  AIRecommendation[] | null
  completedLearnings: string | null

  createdAt: string
  updatedAt: string
}

export type TimelineEventType = 'created' | 'started' | 'paused' | 'completed'

export interface MissionTimelineEventData {
  id:          string
  objectiveId: string
  workspaceId: string
  event:       TimelineEventType
  note:        string | null
  createdAt:   string
}

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  created:   'Creada',
  started:   'Iniciada',
  paused:    'Pausada',
  completed: 'Completada',
}

/** Calcula el progreso (0-100) de un objetivo a partir de sus pasos. */
export function computeProgress(steps: MissionStepData[]): number {
  if (steps.length === 0) return 0
  const done = steps.filter((s) => s.status === 'completed').length
  return Math.round((done / steps.length) * 100)
}

/** Devuelve el primer paso pendiente o en progreso (la "próxima acción"). */
export function nextStep(steps: MissionStepData[]): MissionStepData | null {
  return (
    steps
      .filter((s) => s.status === 'in_progress' || s.status === 'pending')
      .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null
  )
}
