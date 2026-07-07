import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const performanceReview: OfficialToolDefinition = {
  meta: {
    displayCategory: 'RRHH',
    icon: '📈',
    color: '#0EA5E9',
    tags: ['desempeño', 'rendimiento', 'evaluación', 'trimestral', 'feedback'],
    keywords: ['evaluación desempeño', 'performance review', 'revisión rendimiento', 'feedback empleado', 'valoración desempeño', 'employee performance'],
    synonyms: ['revisión de rendimiento', 'feedback de desempeño', 'employee review'],
    complexity: 'simple',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(12),
    slug: 'performance-review',
    name: 'Evaluación del Desempeño',
    description: 'Herramienta para revisiones periódicas de desempeño (trimestral o semestral). Registra logros, dificultades, feedback y compromisos de desarrollo.',
    category: 'hr',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empleado: { type: 'string', label: 'Empleado', required: true },
        manager: { type: 'string', label: 'Manager', required: true },
        periodo: { type: 'string', label: 'Período', required: true, placeholder: 'Ej: Q2 2026' },
        fecha: { type: 'date', label: 'Fecha de revisión', required: true },
        nivel_desempeno: { type: 'select', label: 'Nivel de desempeño', required: true, options: ['Excelente', 'Bueno', 'Adecuado', 'Necesita mejora'] },
        logros: { type: 'textarea', label: 'Logros destacados', required: false },
        dificultades: { type: 'textarea', label: 'Dificultades / Obstáculos', required: false },
        plan_desarrollo: { type: 'textarea', label: 'Plan de desarrollo acordado', required: false },
        puntuacion: { type: 'number', label: 'Puntuación (0-10)', required: false, min: 0, max: 10 },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-revision-desempeno',
        label: 'Registrar revisión',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Guardar revisión' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-revisiones',
        label: 'Historial de revisiones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empleado', label: 'Empleado' },
            { fieldId: 'manager', label: 'Manager' },
            { fieldId: 'periodo', label: 'Período' },
            { fieldId: 'nivel_desempeno', label: 'Nivel' },
            { fieldId: 'puntuacion', label: 'Punt.' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
