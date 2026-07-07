import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const strategicPlan: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Consultoría',
    icon: '📌',
    color: '#1E3A5F',
    tags: ['estrategia', 'plan estratégico', 'objetivos', 'consultoría', 'dirección'],
    keywords: ['plan estratégico', 'strategic plan', 'planificación estratégica', 'objetivos estratégicos', 'iniciativas estratégicas', 'balanced scorecard', 'kpi estratégico'],
    synonyms: ['planificación estratégica', 'strategic planning', 'plan director'],
    complexity: 'advanced',
    estimatedMinutes: 90,
  },
  schema: {
    id: oid(37),
    slug: 'strategic-plan',
    name: 'Plan Estratégico',
    description: 'Herramienta para gestionar iniciativas del plan estratégico. Alinea proyectos con objetivos estratégicos, asigna responsables, plazos y hace seguimiento del avance.',
    category: 'report',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        iniciativa: { type: 'string', label: 'Iniciativa estratégica', required: true },
        objetivo_estrategico: { type: 'string', label: 'Objetivo estratégico asociado', required: true },
        perspectiva: { type: 'select', label: 'Perspectiva (BSC)', required: false, options: ['Financiera', 'Cliente', 'Procesos internos', 'Aprendizaje y crecimiento'] },
        responsable: { type: 'string', label: 'Responsable', required: true },
        fecha_inicio: { type: 'date', label: 'Fecha de inicio', required: true },
        fecha_fin: { type: 'date', label: 'Fecha de finalización', required: true },
        progreso: { type: 'number', label: 'Progreso (%)', required: false, min: 0, max: 100 },
        estado: { type: 'select', label: 'Estado', required: true, options: ['No iniciada', 'En progreso', 'En riesgo', 'Completada', 'Cancelada'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-iniciativa-estrategica',
        label: 'Registrar iniciativa',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar iniciativa' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-plan-estrategico',
        label: 'Seguimiento del plan estratégico',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'iniciativa', label: 'Iniciativa' },
            { fieldId: 'perspectiva', label: 'Perspectiva' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha_fin', label: 'Fecha fin' },
            { fieldId: 'progreso', label: 'Progreso (%)' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
