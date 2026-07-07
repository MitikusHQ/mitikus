import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const licenseControl: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Administración',
    icon: '🏛️',
    color: '#374151',
    tags: ['licencias', 'permisos', 'administración', 'legal', 'cumplimiento'],
    keywords: ['control licencias', 'license management', 'permisos administrativos', 'licencias actividad', 'certificados vigentes', 'carnet profesional', 'habilitaciones'],
    synonyms: ['gestión de licencias', 'permisos y licencias', 'business licenses'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(51),
    slug: 'license-control',
    name: 'Control de Licencias y Permisos',
    description: 'Herramienta para gestionar licencias, permisos y habilitaciones legales de la empresa. Controla vencimientos, renovaciones y cumplimiento normativo.',
    category: 'finance',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_licencia: { type: 'string', label: 'Nombre de la licencia / Permiso', required: true },
        tipo: { type: 'select', label: 'Tipo', required: true, options: ['Licencia de actividad', 'Permiso de obras', 'Certificado ISO', 'Carnet/Habilitación profesional', 'Registro sanitario', 'Licencia ambiental', 'Otro'] },
        organismo_emisor: { type: 'string', label: 'Organismo emisor', required: false },
        responsable: { type: 'string', label: 'Responsable interno', required: true },
        fecha_emision: { type: 'date', label: 'Fecha de emisión', required: false },
        fecha_vencimiento: { type: 'date', label: 'Fecha de vencimiento', required: false },
        renovacion_necesaria: { type: 'boolean', label: '¿Requiere renovación?', required: false },
        coste_renovacion: { type: 'number', label: 'Coste de renovación (€)', required: false, min: 0 },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Vigente', 'Próxima renovación', 'En trámite', 'Caducada', 'Cancelada'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-licencia',
        label: 'Registrar licencia',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir licencia' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-licencias',
        label: 'Registro de licencias',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_licencia', label: 'Licencia' },
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha_vencimiento', label: 'Vencimiento' },
            { fieldId: 'renovacion_necesaria', label: 'Renovación' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          defaultSortField: 'fecha_vencimiento',
          showCreateButton: true,
        },
      },
    ],
  },
}
