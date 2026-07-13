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
    aiPrompt: `Eres un consultor de gestion de licencias de software para empresas IT. Genera un analisis de control de licencias con: estado del software o licencia analizado (correctamente licenciado, infralicenciado, supralicenciado, sin uso, proximo a vencer), riesgo de auditoria del fabricante con estimacion de coste de regularizacion, impacto economico de supralicenciamiento, recomendacion de accion (comprar, cancelar, redistribuir, renovar o no renovar), y siguiente hito relevante (fecha de vencimiento, renovacion, revision). El analisis forma parte del asset management IT.`,
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
