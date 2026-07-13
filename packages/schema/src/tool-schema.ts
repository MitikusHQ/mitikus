/**
 * ProTools Hub — ToolSchema v1 (MVP)
 *
 * Este archivo es la ÚNICA fuente de verdad del sistema.
 * Define la estructura de toda herramienta profesional de la plataforma.
 *
 * Reglas de uso:
 * - Nunca hardcodear lógica de negocio aquí — solo tipos y contratos
 * - Toda generación IA valida su output contra `toolSchemaV1Schema` (Zod)
 * - Todo código que lea un ToolSchema debe usar los tipos de este archivo
 */

import { z } from 'zod'

// ============================================================
// ENUMERACIONES
// ============================================================

/** Tipos de capabilities disponibles en MVP */
export const CAPABILITY_TYPES = [
  'FORM',
  'TABLE',
  'CHECKLIST',
  'SCORING',
  'PDF_EXPORT',
] as const

export type CapabilityType = (typeof CAPABILITY_TYPES)[number]

/** Categorías de herramientas */
export const TOOL_CATEGORIES = [
  'audit',
  'evaluation',
  'checklist',
  'crm',
  'report',
  'hr',
  'operations',
  'finance',
  'custom',
] as const

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

/** Etiquetas de categoría en español para la UI */
export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  audit: 'Auditoría',
  evaluation: 'Evaluación',
  checklist: 'Checklist',
  crm: 'CRM',
  report: 'Informes',
  hr: 'RRHH',
  operations: 'Operaciones',
  finance: 'Finanzas',
  custom: 'Personalizado',
}

// ============================================================
// DATA SCHEMA — modelo de datos de una herramienta
// ============================================================

/** Tipos de campo soportados en MVP */
export const FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'date',
  'textarea',
  'select',
  'multiselect',
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export interface DataSchemaField {
  /** Tipo de dato del campo */
  type: FieldType
  /** Etiqueta visible para el usuario */
  label: string
  /** Campo obligatorio */
  required?: boolean
  /** Placeholder en inputs de texto */
  placeholder?: string
  /** Texto de ayuda bajo el campo */
  helpText?: string
  /** Solo para type: 'select' / 'multiselect' — opciones disponibles */
  options?: string[]
  /** Solo para type: 'number' — valor mínimo */
  min?: number
  /** Solo para type: 'number' — valor máximo */
  max?: number
  /** Solo para type: 'textarea' — número de filas visible */
  rows?: number
}

export interface DataSchema {
  /** Mapa de fieldId → definición del campo */
  fields: Record<string, DataSchemaField>
}

// ============================================================
// CAPABILITY CONFIGS
// ============================================================

// ─── FORM ────────────────────────────────────────────────────

export interface FormSection {
  id: string
  title: string
  /** fieldIds del dataSchema que pertenecen a esta sección */
  fieldIds: string[]
}

export interface FormConfig {
  layout: 'single-column' | 'two-column' | 'sections'
  /** Texto del botón de envío (default: "Guardar") */
  submitLabel?: string
  /** Guardar automáticamente al cambiar campos */
  autosave?: boolean
  /** Solo cuando layout = 'sections' */
  sections?: FormSection[]
}

// ─── TABLE ───────────────────────────────────────────────────

export interface TableColumn {
  /** fieldId del dataSchema */
  fieldId: string
  /** Override de la etiqueta (default: usa label del campo) */
  label?: string
  sortable?: boolean
}

export interface TableConfig {
  columns: TableColumn[]
  defaultSortField?: string
  defaultSortDirection?: 'asc' | 'desc'
  /** Registros por página (default: 25) */
  pageSize?: number
  /** Mostrar botón "Nuevo registro" en la tabla */
  showCreateButton?: boolean
}

// ─── CHECKLIST ───────────────────────────────────────────────

export interface ChecklistItem {
  /** ID único dentro de la herramienta */
  id: string
  label: string
  /** Categoría para agrupar ítems */
  category?: string
  /** Si es true, no se puede completar el checklist sin marcar este ítem */
  required?: boolean
  helpText?: string
}

export interface ChecklistConfig {
  /** Ítems estáticos definidos en el schema */
  items: ChecklistItem[]
  /** Lista de categorías únicas (para ordenar las secciones) */
  categories?: string[]
  /** Mostrar barra de progreso y % */
  showProgress?: boolean
  /** Tipo de completado: checkbox simple o sí/no */
  completionType: 'check' | 'yes_no'
}

// ─── SCORING ─────────────────────────────────────────────────

export interface ScoringCriterion {
  /** ID del criterio — también se usa como fieldId en dataSchema: score_{id} */
  id: string
  label: string
  /**
   * Peso relativo para la puntuación total (0-1).
   * Si se usan pesos, deben sumar 1.0 en total.
   * Si no se definen, se calcula la media simple.
   */
  weight?: number
  min?: number  // default: 1
  max?: number  // default: 10
  /** Agrupación de criterios relacionados */
  category?: string
  helpText?: string
}

export interface ScoringThreshold {
  min: number
  max: number
  label: string
  color: 'green' | 'yellow' | 'red'
}

export interface ScoringConfig {
  criteria: ScoringCriterion[]
  /** Umbrales de interpretación del total */
  thresholds?: ScoringThreshold[]
  showTotal?: boolean
  /** Puntuación mínima para considerar "aprobado" */
  passingScore?: number
}

// ─── PDF_EXPORT ───────────────────────────────────────────────

export interface PdfExportConfig {
  /** Incluir nombre de la herramienta en el encabezado */
  includeHeader?: boolean
  /** Incluir fecha de generación */
  includeDate?: boolean
  /** Incluir nombre de la organización */
  includeOrgName?: boolean
  /** Un registro específico o todos los registros */
  scope: 'single_record' | 'all_records'
}

// ─── UNION de todas las configs ───────────────────────────────

export type CapabilityConfigData =
  | FormConfig
  | TableConfig
  | ChecklistConfig
  | ScoringConfig
  | PdfExportConfig

// ============================================================
// CAPABILITY CONFIG (instancia de una capability en un tool)
// ============================================================

export interface CapabilityConfig {
  /** Tipo de capability del registro central */
  type: CapabilityType
  /**
   * ID único de esta instancia de capability dentro de la herramienta.
   * Permite múltiples instancias del mismo tipo (ej: dos FORM en una herramienta).
   */
  instanceId: string
  /** Nombre visible en la UI (tab, botón, sección) */
  label: string
  /** Configuración específica del tipo de capability */
  config: CapabilityConfigData
  /** Si true, esta capability se muestra por defecto al abrir la herramienta */
  isDefault?: boolean
}

// ============================================================
// TOOL PERMISSIONS
// ============================================================

export interface ToolPermissions {
  /** Rol asignado por defecto a nuevos miembros */
  defaultMemberRole: 'EDITOR' | 'VIEWER'
  /** Permitir compartir la herramienta con URL pública */
  allowPublicShare: boolean
}

// ============================================================
// TOOL SCHEMA V1 — el objeto central del sistema
// ============================================================

export interface ToolSchemaV1 {
  /** UUID v4 — inmutable una vez creado */
  id: string
  /**
   * Identificador URL-safe único en su scope.
   * Solo minúsculas, números y guiones.
   * Inmutable una vez publicado.
   */
  slug: string
  /** Nombre de la herramienta para el usuario final (3-80 chars) */
  name: string
  /** Descripción orientada al usuario (20-500 chars) */
  description: string
  /** Categoría principal */
  category: ToolCategory
  /**
   * Lista de capabilities que componen esta herramienta.
   * El orden determina la presentación visual (tabs/secciones).
   * Mínimo una capability.
   */
  capabilities: CapabilityConfig[]
  /** Modelo de datos — define los campos que gestionan los records */
  dataSchema: DataSchema
  /** Configuración de permisos */
  permissions: ToolPermissions
  /** Visible en el catálogo global */
  isPublic: boolean
  /** 'system' para herramientas seed, userId para las generadas por usuarios */
  createdBy: string
  /** Versión del formato ToolSchema — siempre '1' en MVP */
  version: '1'
  /** Instrucciones específicas para la IA — sobrescribe las genéricas de categoría */
  aiPrompt?: string
}

// ============================================================
// ZOD SCHEMAS — validación del output de la IA
// ============================================================

const capabilityTypeSchema = z.enum(CAPABILITY_TYPES)
const toolCategorySchema = z.enum(TOOL_CATEGORIES)

const dataSchemaFieldSchema = z.object({
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, 'El label del campo no puede estar vacío'),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  rows: z.number().int().positive().optional(),
})

const dataSchemaSchema = z.object({
  fields: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/), dataSchemaFieldSchema),
})

const formSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  fieldIds: z.array(z.string()).min(1),
})

const formConfigSchema = z.object({
  layout: z.enum(['single-column', 'two-column', 'sections']),
  submitLabel: z.string().optional(),
  autosave: z.boolean().optional(),
  sections: z.array(formSectionSchema).optional(),
})

const tableConfigSchema = z.object({
  columns: z.array(
    z.object({
      fieldId: z.string().min(1),
      label: z.string().optional(),
      sortable: z.boolean().optional(),
    })
  ).min(1),
  defaultSortField: z.string().optional(),
  defaultSortDirection: z.enum(['asc', 'desc']).optional(),
  pageSize: z.number().int().positive().optional(),
  showCreateButton: z.boolean().optional(),
})

const checklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: z.string().optional(),
  required: z.boolean().optional(),
  helpText: z.string().optional(),
})

const checklistConfigSchema = z.object({
  items: z.array(checklistItemSchema).min(1, 'Un checklist debe tener al menos un ítem'),
  categories: z.array(z.string()).optional(),
  showProgress: z.boolean().optional(),
  completionType: z.enum(['check', 'yes_no']),
})

const scoringCriterionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().min(0).max(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  category: z.string().optional(),
  helpText: z.string().optional(),
})

const scoringThresholdSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: z.string().min(1),
  color: z.enum(['green', 'yellow', 'red']),
})

const scoringConfigSchema = z.object({
  criteria: z.array(scoringCriterionSchema).min(1).max(50),
  thresholds: z.array(scoringThresholdSchema).optional(),
  showTotal: z.boolean().optional(),
  passingScore: z.number().optional(),
})

const pdfExportConfigSchema = z.object({
  includeHeader: z.boolean().optional(),
  includeDate: z.boolean().optional(),
  includeOrgName: z.boolean().optional(),
  scope: z.enum(['single_record', 'all_records']),
})

const capabilityConfigSchema = z.object({
  type: capabilityTypeSchema,
  instanceId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'instanceId debe ser kebab-case'),
  label: z.string().min(1).max(60),
  config: z.union([
    formConfigSchema,
    tableConfigSchema,
    checklistConfigSchema,
    scoringConfigSchema,
    pdfExportConfigSchema,
  ]),
  isDefault: z.boolean().optional(),
})

/** Schema Zod principal — valida todo el ToolSchema */
export const toolSchemaV1Schema = z.object({
  id: z.string().uuid('id debe ser un UUID v4 válido'),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug solo puede contener minúsculas, números y guiones'),
  name: z.string().min(3, 'Nombre mínimo 3 caracteres').max(80, 'Nombre máximo 80 caracteres'),
  description: z
    .string()
    .min(20, 'Descripción mínima 20 caracteres')
    .max(500, 'Descripción máxima 500 caracteres'),
  category: toolCategorySchema,
  capabilities: z
    .array(capabilityConfigSchema)
    .min(1, 'Una herramienta debe tener al menos una capability'),
  dataSchema: dataSchemaSchema,
  permissions: z.object({
    defaultMemberRole: z.enum(['EDITOR', 'VIEWER']),
    allowPublicShare: z.boolean(),
  }),
  isPublic: z.boolean(),
  createdBy: z.string().min(1),
  version: z.literal('1'),
  aiPrompt: z.string().max(2000).optional(),
})

/** Tipo inferido desde el Zod schema — equivalente a ToolSchemaV1 pero garantizado válido */
export type ValidatedToolSchema = z.infer<typeof toolSchemaV1Schema>

// ============================================================
// HELPERS — funciones de utilidad del schema
// ============================================================

/**
 * Extrae la config tipada de una capability por tipo.
 * Útil en el Tool Runner para obtener la config con tipo correcto.
 */
export function getCapabilityConfig<T extends CapabilityType>(
  schema: ToolSchemaV1,
  type: T
): CapabilityConfig | undefined {
  return schema.capabilities.find((c) => c.type === type)
}

/**
 * Obtiene la capability marcada como isDefault.
 * Si ninguna está marcada, devuelve la primera.
 */
export function getDefaultCapability(schema: ToolSchemaV1): CapabilityConfig | undefined {
  return schema.capabilities.find((c) => c.isDefault) ?? schema.capabilities[0]
}

/**
 * Valida un ToolSchema y devuelve el resultado.
 * Usar en el proceso de generación IA antes de guardar.
 */
export function validateToolSchema(
  data: unknown
): { success: true; data: ValidatedToolSchema } | { success: false; error: z.ZodError } {
  const result = toolSchemaV1Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}
