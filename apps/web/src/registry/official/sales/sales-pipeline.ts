import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const salesPipeline: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Ventas',
    icon: '📊',
    color: '#DC2626',
    tags: ['pipeline', 'ventas', 'embudo', 'funnel', 'forecast'],
    keywords: ['pipeline ventas', 'sales pipeline', 'embudo ventas', 'funnel comercial', 'previsión ventas', 'revenue forecast', 'cuota ventas'],
    synonyms: ['embudo de ventas', 'funnel de ventas', 'revenue pipeline'],
    complexity: 'intermediate',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(26),
    slug: 'sales-pipeline',
    name: 'Pipeline de Ventas',
    description: 'Herramienta para gestionar el pipeline comercial del equipo de ventas. Visualiza el estado de todas las oportunidades, valores y probabilidades de cierre por período.',
    category: 'crm',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        oportunidad: { type: 'string', label: 'Nombre oportunidad', required: true },
        cliente: { type: 'string', label: 'Cliente', required: true },
        comercial: { type: 'string', label: 'Comercial', required: true },
        producto_servicio: { type: 'string', label: 'Producto / Servicio', required: false },
        valor_bruto: { type: 'number', label: 'Valor bruto (€)', required: true, min: 0 },
        probabilidad: { type: 'number', label: 'Probabilidad (%)', required: true, min: 0, max: 100 },
        etapa: { type: 'select', label: 'Etapa', required: true, options: ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Cierre'] },
        trimestre: { type: 'select', label: 'Trimestre previsto', required: true, options: ['Q1', 'Q2', 'Q3', 'Q4'] },
        fecha_cierre_previsto: { type: 'date', label: 'Fecha de cierre prevista', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Activa', 'Ganada', 'Perdida', 'Aplazada'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-pipeline',
        label: 'Añadir oportunidad',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir al pipeline' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-pipeline',
        label: 'Pipeline completo',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'oportunidad', label: 'Oportunidad' },
            { fieldId: 'cliente', label: 'Cliente' },
            { fieldId: 'comercial', label: 'Comercial' },
            { fieldId: 'valor_bruto', label: 'Valor (€)' },
            { fieldId: 'probabilidad', label: 'Prob.' },
            { fieldId: 'etapa', label: 'Etapa' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
