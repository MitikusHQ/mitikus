import { ToolCategory } from '@prisma/client'

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
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

export const CATEGORY_ICONS: Record<ToolCategory, string> = {
  AUDIT:      '🛡️',
  EVALUATION: '⭐',
  CHECKLIST:  '✅',
  CRM:        '📈',
  REPORT:     '📄',
  HR:         '👥',
  OPERATIONS: '⚙️',
  FINANCE:    '💰',
  CUSTOM:     '✦',
}

export interface CategoryColors {
  bg: string
  text: string
  border: string
  iconBg: string
  activeBg: string
  activeText: string
  activeBorder: string
}

export const CATEGORY_COLORS: Record<ToolCategory, CategoryColors> = {
  AUDIT: {
    bg:           'bg-blue-50 dark:bg-blue-950/30',
    text:         'text-blue-700 dark:text-blue-400',
    border:       'border-blue-200 dark:border-blue-800',
    iconBg:       'bg-blue-100 dark:bg-blue-900/50',
    activeBg:     'bg-blue-600 dark:bg-blue-500',
    activeText:   'text-white',
    activeBorder: 'border-blue-600 dark:border-blue-500',
  },
  EVALUATION: {
    bg:           'bg-cyan-50 dark:bg-cyan-950/30',
    text:         'text-cyan-700 dark:text-cyan-400',
    border:       'border-cyan-200 dark:border-cyan-800',
    iconBg:       'bg-cyan-100 dark:bg-cyan-900/50',
    activeBg:     'bg-cyan-600 dark:bg-cyan-500',
    activeText:   'text-white',
    activeBorder: 'border-cyan-600 dark:border-cyan-500',
  },
  CHECKLIST: {
    bg:           'bg-green-50 dark:bg-green-950/30',
    text:         'text-green-700 dark:text-green-400',
    border:       'border-green-200 dark:border-green-800',
    iconBg:       'bg-green-100 dark:bg-green-900/50',
    activeBg:     'bg-green-600 dark:bg-green-500',
    activeText:   'text-white',
    activeBorder: 'border-green-600 dark:border-green-500',
  },
  CRM: {
    bg:           'bg-indigo-50 dark:bg-indigo-950/30',
    text:         'text-indigo-700 dark:text-indigo-400',
    border:       'border-indigo-200 dark:border-indigo-800',
    iconBg:       'bg-indigo-100 dark:bg-indigo-900/50',
    activeBg:     'bg-indigo-600 dark:bg-indigo-500',
    activeText:   'text-white',
    activeBorder: 'border-indigo-600 dark:border-indigo-500',
  },
  REPORT: {
    bg:           'bg-slate-50 dark:bg-slate-800/30',
    text:         'text-slate-700 dark:text-slate-400',
    border:       'border-slate-200 dark:border-slate-700',
    iconBg:       'bg-slate-100 dark:bg-slate-800',
    activeBg:     'bg-slate-700 dark:bg-slate-600',
    activeText:   'text-white',
    activeBorder: 'border-slate-700 dark:border-slate-600',
  },
  HR: {
    bg:           'bg-rose-50 dark:bg-rose-950/30',
    text:         'text-rose-700 dark:text-rose-400',
    border:       'border-rose-200 dark:border-rose-800',
    iconBg:       'bg-rose-100 dark:bg-rose-900/50',
    activeBg:     'bg-rose-600 dark:bg-rose-500',
    activeText:   'text-white',
    activeBorder: 'border-rose-600 dark:border-rose-500',
  },
  OPERATIONS: {
    bg:           'bg-orange-50 dark:bg-orange-950/30',
    text:         'text-orange-700 dark:text-orange-400',
    border:       'border-orange-200 dark:border-orange-800',
    iconBg:       'bg-orange-100 dark:bg-orange-900/50',
    activeBg:     'bg-orange-600 dark:bg-orange-500',
    activeText:   'text-white',
    activeBorder: 'border-orange-600 dark:border-orange-500',
  },
  FINANCE: {
    bg:           'bg-emerald-50 dark:bg-emerald-950/30',
    text:         'text-emerald-700 dark:text-emerald-400',
    border:       'border-emerald-200 dark:border-emerald-800',
    iconBg:       'bg-emerald-100 dark:bg-emerald-900/50',
    activeBg:     'bg-emerald-600 dark:bg-emerald-500',
    activeText:   'text-white',
    activeBorder: 'border-emerald-600 dark:border-emerald-500',
  },
  CUSTOM: {
    bg:           'bg-purple-50 dark:bg-purple-950/30',
    text:         'text-purple-700 dark:text-purple-400',
    border:       'border-purple-200 dark:border-purple-800',
    iconBg:       'bg-purple-100 dark:bg-purple-900/50',
    activeBg:     'bg-purple-600 dark:bg-purple-500',
    activeText:   'text-white',
    activeBorder: 'border-purple-600 dark:border-purple-500',
  },
}

export const CAPABILITY_LABELS: Record<string, string> = {
  TABLE:      'Tabla',
  FORM:       'Formulario',
  SCORING:    'Scoring',
  PDF_EXPORT: 'PDF',
  CHECKLIST:  'Checklist',
}

export const CAPABILITY_ICONS: Record<string, string> = {
  TABLE:      '🗂️',
  FORM:       '📝',
  SCORING:    '📊',
  PDF_EXPORT: '📄',
  CHECKLIST:  '✅',
}

export const COMPLEXITY_LABELS: Record<string, string> = {
  simple:       'Simple',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

export const COMPLEXITY_COLORS: Record<string, string> = {
  simple:       'text-emerald-600 dark:text-emerald-400',
  intermediate: 'text-amber-600 dark:text-amber-400',
  advanced:     'text-red-600 dark:text-red-400',
}

// ── Versioning / ResourceStatus ──────────────────────────────────

export type ResourceStatusString = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export const STATUS_LABELS: Record<ResourceStatusString, string> = {
  DRAFT:     'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED:  'Archivado',
}

export const STATUS_ICONS: Record<ResourceStatusString, string> = {
  DRAFT:     '◐',
  PUBLISHED: '◉',
  ARCHIVED:  '○',
}

export const STATUS_BADGE_CLASSES: Record<ResourceStatusString, string> = {
  DRAFT:     'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  PUBLISHED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  ARCHIVED:  'bg-muted text-muted-foreground border-border',
}

export const STATUS_DESCRIPTIONS: Record<ResourceStatusString, string> = {
  DRAFT:     'En elaboración — no visible en el marketplace',
  PUBLISHED: 'Publicado y disponible para uso',
  ARCHIVED:  'Archivado — solo lectura, no disponible para nuevas instalaciones',
}

// ── Field types ──────────────────────────────────────────────────

export const FIELD_TYPE_LABELS: Record<string, string> = {
  string:   'Texto',
  number:   'Número',
  date:     'Fecha',
  select:   'Selección',
  boolean:  'Sí/No',
  textarea: 'Texto largo',
}
