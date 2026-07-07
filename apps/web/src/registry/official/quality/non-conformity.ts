import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const nonConformity: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Calidad',
    icon: '⚠️',
    color: '#EF4444',
    tags: ['no conformidad', 'calidad', 'nc', 'sgc', 'incidencia calidad'],
    keywords: ['no conformidad', 'non conformity', 'nc', 'incidencia calidad', 'desviación proceso', 'producto no conforme', 'gestión calidad'],
    synonyms: ['desviación de calidad', 'incidencia de calidad', 'non-conformance report'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(13),
    slug: 'non-conformity',
    name: 'Gestión de No Conformidades',
    description: 'Herramienta para detectar, registrar y hacer seguimiento de no conformidades en procesos y productos. Facilita la trazabilidad y cierre de cada NC.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        numero_nc: { type: 'string', label: 'Número NC', required: true, placeholder: 'NC-2026-001' },
        fecha_deteccion: { type: 'date', label: 'Fecha de detección', required: true },
        area: { type: 'string', label: 'Área / Proceso', required: true },
        descripcion: { type: 'textarea', label: 'Descripción de la no conformidad', required: true },
        tipo: { type: 'select', label: 'Tipo', required: true, options: ['Interna', 'Externa (cliente)', 'Proveedor', 'Auditoría'] },
        gravedad: { type: 'select', label: 'Gravedad', required: true, options: ['Mayor', 'Menor', 'Observación'] },
        responsable: { type: 'string', label: 'Responsable de resolución', required: true },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Abierta', 'En análisis', 'Con acción correctiva', 'Cerrada', 'Verificada'] },
        fecha_cierre: { type: 'date', label: 'Fecha de cierre', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-no-conformidad',
        label: 'Registrar NC',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Abrir no conformidad' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-no-conformidades',
        label: 'Registro de NCs',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'numero_nc', label: 'NC' },
            { fieldId: 'fecha_deteccion', label: 'Detección' },
            { fieldId: 'area', label: 'Área' },
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'gravedad', label: 'Gravedad' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          defaultSortField: 'fecha_deteccion',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
    ],
  },
}
