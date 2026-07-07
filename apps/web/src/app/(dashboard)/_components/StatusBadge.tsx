import { cn } from '@/lib/utils'

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'blue'

const STATUS_MAP: Record<string, Variant> = {
  // Approval
  approve: 'success',
  approved: 'success',
  aprobado: 'success',
  aprobada: 'success',
  yes: 'success',
  sí: 'success',
  si: 'success',
  activo: 'success',
  activa: 'success',
  active: 'success',
  completado: 'success',
  completada: 'success',
  completed: 'success',
  done: 'success',
  hecho: 'success',
  // Rejection
  reject: 'danger',
  rejected: 'danger',
  rechazado: 'danger',
  rechazada: 'danger',
  no: 'danger',
  inactivo: 'danger',
  inactive: 'danger',
  cancelado: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  error: 'danger',
  // Pending / Warning
  pending: 'warning',
  pendiente: 'warning',
  review: 'warning',
  'en revisión': 'warning',
  'en revision': 'warning',
  'in progress': 'warning',
  'en proceso': 'warning',
  draft: 'warning',
  borrador: 'warning',
  // Neutral / Info
  na: 'neutral',
  'n/a': 'neutral',
  '-': 'neutral',
  '—': 'neutral',
}

const VARIANT_CLASSES: Record<Variant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  danger:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  blue:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-muted text-muted-foreground',
}

/** Detect variant for a raw string value */
export function detectStatusVariant(value: string): Variant | null {
  return STATUS_MAP[value.toLowerCase().trim()] ?? null
}

/** Score 0-10 → variant */
export function scoreVariant(score: number): Variant {
  if (score >= 9) return 'success'
  if (score >= 7) return 'blue'
  if (score >= 5) return 'warning'
  return 'danger'
}

interface Props {
  value: string
  variant?: Variant
  className?: string
}

export function StatusBadge({ value, variant, className }: Props) {
  const v = variant ?? detectStatusVariant(value) ?? 'neutral'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[v],
        className,
      )}
    >
      {value}
    </span>
  )
}

interface ScoreBadgeProps {
  score: number
  max?: number
  className?: string
}

export function ScoreBadge({ score, max = 10, className }: ScoreBadgeProps) {
  const normalized = max > 0 ? (score / max) * 10 : 0
  const v = scoreVariant(normalized)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-mono',
        VARIANT_CLASSES[v],
        className,
      )}
    >
      {score.toFixed(1)}
    </span>
  )
}
