import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const opportunityTracking: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Ventas',
    icon: '💎',
    color: '#0F766E',
    tags: ['oportunidad', 'ventas', 'crm', 'pipeline', 'propuesta'],
    keywords: ['oportunidad comercial', 'opportunity tracking', 'seguimiento oportunidades', 'pipeline de ventas', 'sales opportunity', 'propuesta comercial', 'negociación'],
    synonyms: ['seguimiento de oportunidades', 'sales pipeline', 'deal tracking'],
    complexity: 'intermediate',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(23),
    slug: 'opportunity-tracking',
    name: 'Seguimiento de Oportunidades',
    description: 'Herramienta para gestionar y hacer seguimiento de oportunidades comerciales activas. Registra valor, probabilidad, próximas acciones y estado del pipeline.',
    category: 'crm',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_oportunidad: { type: 'string', label: 'Nombre de la oportunidad', required: true },
        cliente: { type: 'string', label: 'Cliente / Empresa', required: true },
        comercial: { type: 'string', label: 'Comercial responsable', required: true },
        valor_estimado: { type: 'number', label: 'Valor estimado (€)', required: false, min: 0 },
        probabilidad: { type: 'number', label: 'Probabilidad de cierre (%)', required: false, min: 0, max: 100 },
        fecha_cierre_previsto: { type: 'date', label: 'Fecha prevista de cierre', required: false },
        etapa: { type: 'select', label: 'Etapa del pipeline', required: true, options: ['Calificación', 'Propuesta', 'Negociación', 'Cierre', 'Ganada', 'Perdida'] },
        proxima_accion: { type: 'string', label: 'Próxima acción', required: false },
        notas: { type: 'textarea', label: 'Notas', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-oportunidad',
        label: 'Registrar oportunidad',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar oportunidad' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-oportunidades',
        label: 'Pipeline de oportunidades',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_oportunidad', label: 'Oportunidad' },
            { fieldId: 'cliente', label: 'Cliente' },
            { fieldId: 'valor_estimado', label: 'Valor (€)' },
            { fieldId: 'probabilidad', label: 'Prob. (%)' },
            { fieldId: 'fecha_cierre_previsto', label: 'Cierre previsto' },
            { fieldId: 'etapa', label: 'Etapa' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
