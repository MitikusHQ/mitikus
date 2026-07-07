import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const objectivesTracking: OfficialToolDefinition = {
  meta: {
    displayCategory: 'RRHH',
    icon: '🎯',
    color: '#10B981',
    tags: ['objetivos', 'okr', 'kpi', 'metas', 'desempeño'],
    keywords: ['objetivos', 'okr', 'kpi', 'metas', 'seguimiento objetivos', 'objectives key results', 'gestión objetivos', 'goal tracking', 'indicadores rendimiento'],
    synonyms: ['seguimiento metas', 'gestión OKR', 'goal management', 'objectives tracking'],
    complexity: 'simple',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(10),
    slug: 'objectives-tracking',
    name: 'Seguimiento de Objetivos (OKR)',
    description: 'Herramienta para definir y hacer seguimiento de objetivos individuales y de equipo. Compatible con metodología OKR y gestión por objetivos tradicional.',
    category: 'hr',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empleado: { type: 'string', label: 'Empleado / Equipo', required: true },
        objetivo: { type: 'string', label: 'Objetivo', required: true, placeholder: 'Ej: Incrementar satisfacción de cliente' },
        resultado_clave: { type: 'string', label: 'Resultado clave (KR)', required: true, placeholder: 'Ej: NPS ≥ 75 en Q4' },
        periodo: { type: 'string', label: 'Período', required: true, placeholder: 'Ej: Q1 2026' },
        progreso: { type: 'number', label: 'Progreso (%)', required: false, min: 0, max: 100 },
        estado: { type: 'select', label: 'Estado', required: true, options: ['No iniciado', 'En progreso', 'En riesgo', 'Completado', 'Cancelado'] },
        ultimo_update: { type: 'date', label: 'Última actualización', required: false },
        notas: { type: 'textarea', label: 'Notas / Comentarios', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-objetivo',
        label: 'Registrar objetivo',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Guardar objetivo' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-objetivos',
        label: 'Seguimiento de objetivos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empleado', label: 'Empleado' },
            { fieldId: 'objetivo', label: 'Objetivo' },
            { fieldId: 'periodo', label: 'Período' },
            { fieldId: 'progreso', label: 'Progreso' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
