import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const contractReview: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Administración',
    icon: '📄',
    color: '#1D4ED8',
    tags: ['contratos', 'revisión', 'legal', 'administración', 'gestión contratos'],
    keywords: ['revisión contratos', 'contract review', 'gestión contratos', 'contrato proveedor', 'contrato cliente', 'renovación contrato', 'vencimiento contrato'],
    synonyms: ['gestión de contratos', 'contract management', 'revisión legal'],
    complexity: 'intermediate',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(50),
    slug: 'contract-review',
    name: 'Revisión y Gestión de Contratos',
    description: 'Herramienta para gestionar el ciclo de vida de contratos. Controla vigencia, condiciones, partes implicadas, renovaciones y alertas de vencimiento.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de gestion de contratos para empresas de servicios tecnologicos. Genera un analisis de revision de contrato con: resumen ejecutivo de las condiciones clave (objeto, precio, duracion, renovacion automatica, penalizaciones, SLA), identificacion de clausulas de riesgo o condiciones desfavorables, comparativa con el estandar del mercado, puntos criticos a negociar antes de la firma o renovacion, y recomendacion de firmar/negociar/rechazar con justificacion. El analisis es para el responsable de contratacion o la direccion general.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        referencia: { type: 'string', label: 'Referencia del contrato', required: true },
        tipo: { type: 'select', label: 'Tipo de contrato', required: true, options: ['Con proveedor', 'Con cliente', 'Arrendamiento', 'Laboral', 'Confidencialidad (NDA)', 'Marco de servicios', 'Otro'] },
        contraparte: { type: 'string', label: 'Parte contratante', required: true },
        responsable: { type: 'string', label: 'Responsable interno', required: true },
        fecha_inicio: { type: 'date', label: 'Fecha de inicio', required: true },
        fecha_vencimiento: { type: 'date', label: 'Fecha de vencimiento', required: false },
        renovacion_automatica: { type: 'boolean', label: '¿Renovación automática?', required: false },
        importe_anual: { type: 'number', label: 'Importe anual (€)', required: false, min: 0 },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Vigente', 'Pendiente firma', 'En negociación', 'Vencido', 'Cancelado'] },
        observaciones: { type: 'textarea', label: 'Condiciones especiales / Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-contrato',
        label: 'Registrar contrato',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar contrato' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-contratos',
        label: 'Cartera de contratos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'referencia', label: 'Referencia' },
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'contraparte', label: 'Contraparte' },
            { fieldId: 'fecha_vencimiento', label: 'Vencimiento' },
            { fieldId: 'importe_anual', label: 'Importe/año (€)' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          defaultSortField: 'fecha_vencimiento',
          showCreateButton: true,
        },
      },
    ],
  },
}
