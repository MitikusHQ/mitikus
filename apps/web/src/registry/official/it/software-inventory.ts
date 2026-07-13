import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const softwareInventory: OfficialToolDefinition = {
  meta: {
    displayCategory: 'IT',
    icon: '📦',
    color: '#0F766E',
    tags: ['software', 'licencias', 'inventario', 'it', 'aplicaciones'],
    keywords: ['inventario software', 'software inventory', 'licencias software', 'gestión licencias', 'sam', 'software asset management', 'aplicaciones empresa'],
    synonyms: ['inventario de aplicaciones', 'software asset management', 'license inventory'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(43),
    slug: 'software-inventory',
    name: 'Inventario de Software y Licencias',
    description: 'Herramienta para gestionar el inventario de software y licencias de la organización. Controla aplicaciones, versiones, fechas de renovación y usuarios autorizados.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor IT especializado en gestión de licencias y cumplimiento de software. Genera un análisis del software inventariado con: estado de licenciamiento (correcto, infralicenciado, supralicenciado, sin licencia), riesgo de auditoría del fabricante, coste de regularización estimado si hay incumplimiento, versión instalada vs versión actual con análisis de vulnerabilidades conocidas, y recomendación de acción. El informe sirve para la revisión de licencias del cliente.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        aplicacion: { type: 'string', label: 'Nombre de la aplicación', required: true },
        version: { type: 'string', label: 'Versión', required: false },
        tipo_licencia: { type: 'select', label: 'Tipo de licencia', required: true, options: ['Perpetua', 'Suscripción anual', 'Suscripción mensual', 'Gratuita/Open source', 'De evaluación'] },
        proveedor: { type: 'string', label: 'Proveedor / Fabricante', required: false },
        numero_licencias: { type: 'number', label: 'Número de licencias', required: false, min: 0 },
        coste_anual: { type: 'number', label: 'Coste anual (€)', required: false, min: 0 },
        fecha_renovacion: { type: 'date', label: 'Fecha de renovación', required: false },
        responsable: { type: 'string', label: 'Responsable de contrato', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Activo', 'Pendiente renovación', 'Caducado', 'Cancelado'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-software',
        label: 'Registrar software',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir licencia' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-software',
        label: 'Inventario de software',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'aplicacion', label: 'Aplicación' },
            { fieldId: 'tipo_licencia', label: 'Tipo' },
            { fieldId: 'numero_licencias', label: 'Licencias' },
            { fieldId: 'coste_anual', label: 'Coste/año (€)' },
            { fieldId: 'fecha_renovacion', label: 'Renovación' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
