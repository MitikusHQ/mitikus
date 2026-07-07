import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const epiInspection: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Seguridad',
    icon: '🥽',
    color: '#EA580C',
    tags: ['epi', 'equipos protección', 'seguridad', 'inspección', 'prl'],
    keywords: ['epi', 'equipos protección individual', 'ppe inspection', 'inspección epi', 'casco', 'guantes', 'calzado seguridad', 'personal protective equipment'],
    synonyms: ['revisión equipos protección', 'ppe review', 'inspección equipos seguridad'],
    complexity: 'simple',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(41),
    slug: 'epi-inspection',
    name: 'Inspección de EPIs',
    description: 'Herramienta para registrar la entrega, estado y revisión periódica de Equipos de Protección Individual (EPIs). Garantiza que los trabajadores disponen de EPIs en correcto estado.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        trabajador: { type: 'string', label: 'Trabajador', required: true },
        puesto: { type: 'string', label: 'Puesto de trabajo', required: true },
        tipo_epi: { type: 'select', label: 'Tipo de EPI', required: true, options: ['Casco', 'Guantes', 'Calzado de seguridad', 'Gafas/Pantalla', 'Protección auditiva', 'Mascarilla/Respirador', 'Arnés/Anticaída', 'Chaleco reflectante', 'Ropa protectora'] },
        marca_modelo: { type: 'string', label: 'Marca / Modelo', required: false },
        fecha_entrega: { type: 'date', label: 'Fecha de entrega', required: true },
        fecha_revision: { type: 'date', label: 'Fecha de revisión', required: true },
        estado: { type: 'select', label: 'Estado del EPI', required: true, options: ['Correcto', 'Desgastado', 'Dañado — requiere sustitución', 'Sustituido'] },
        firma_recibido: { type: 'boolean', label: 'Trabajador ha firmado recepción', required: false },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-epi',
        label: 'Registrar EPI',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar registro' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-epis',
        label: 'Registro de EPIs',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'trabajador', label: 'Trabajador' },
            { fieldId: 'tipo_epi', label: 'EPI' },
            { fieldId: 'fecha_entrega', label: 'Entrega' },
            { fieldId: 'fecha_revision', label: 'Revisión' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
