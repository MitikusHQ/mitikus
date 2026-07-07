import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const processMap: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Consultoría',
    icon: '🗺️',
    color: '#0369A1',
    tags: ['procesos', 'mapa', 'flujo', 'consultoría', 'BPM'],
    keywords: ['mapa de procesos', 'process map', 'bpm', 'flujo de trabajo', 'proceso de negocio', 'workflow', 'documentación procesos', 'business process'],
    synonyms: ['documentación de procesos', 'flujograma', 'business process mapping'],
    complexity: 'intermediate',
    estimatedMinutes: 45,
  },
  schema: {
    id: oid(36),
    slug: 'process-map',
    name: 'Mapa de Procesos',
    description: 'Herramienta para documentar y gestionar procesos de negocio. Registra entradas, salidas, responsables, indicadores y oportunidades de mejora de cada proceso.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_proceso: { type: 'string', label: 'Nombre del proceso', required: true },
        tipo: { type: 'select', label: 'Tipo de proceso', required: true, options: ['Estratégico', 'Clave/Operativo', 'Soporte'] },
        propietario: { type: 'string', label: 'Propietario del proceso', required: true },
        departamento: { type: 'string', label: 'Departamento', required: true },
        objetivo: { type: 'string', label: 'Objetivo del proceso', required: true },
        entrada: { type: 'textarea', label: 'Entradas (inputs)', required: false },
        salida: { type: 'textarea', label: 'Salidas (outputs)', required: false },
        indicador_kpi: { type: 'string', label: 'KPI / Indicador de desempeño', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Documentado', 'En revisión', 'Pendiente documentar', 'Obsoleto'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-proceso',
        label: 'Documentar proceso',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar proceso' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-procesos',
        label: 'Inventario de procesos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_proceso', label: 'Proceso' },
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'propietario', label: 'Propietario' },
            { fieldId: 'departamento', label: 'Departamento' },
            { fieldId: 'indicador_kpi', label: 'KPI' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
