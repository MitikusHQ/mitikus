import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const qualityInspection: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Calidad',
    icon: '🔬',
    color: '#059669',
    tags: ['inspección', 'calidad', 'producto', 'control', 'verificación'],
    keywords: ['inspección calidad', 'quality inspection', 'control de calidad', 'inspección producto', 'lote', 'muestreo', 'control recepción'],
    synonyms: ['control de calidad', 'inspección de producto', 'quality control'],
    complexity: 'intermediate',
    estimatedMinutes: 25,
  },
  schema: {
    id: oid(17),
    slug: 'quality-inspection',
    name: 'Inspección de Calidad',
    description: 'Herramienta para registrar inspecciones de calidad de productos o lotes. Documenta muestras, mediciones, defectos detectados y resultado de la inspección.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un inspector de calidad especializado en servicios y proyectos IT. Genera un informe de inspeccion de calidad con: descripcion del elemento o servicio inspeccionado y criterios de aceptacion aplicados, resultado de cada punto de inspeccion (conforme/no conforme/pendiente) con evidencia, clasificacion de defectos por tipo y gravedad, decision de aceptacion/rechazo/aceptacion condicional con justificacion, y acciones correctivas requeridas con plazo. El informe es la evidencia objetiva del control de calidad realizado.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        referencia_lote: { type: 'string', label: 'Referencia de lote / Producto', required: true },
        inspector: { type: 'string', label: 'Inspector de calidad', required: true },
        fecha: { type: 'date', label: 'Fecha de inspección', required: true },
        cantidad_inspeccionada: { type: 'number', label: 'Cantidad inspeccionada', required: true, min: 0 },
        defectos_criticos: { type: 'number', label: 'Defectos críticos', required: false, min: 0 },
        defectos_mayores: { type: 'number', label: 'Defectos mayores', required: false, min: 0 },
        defectos_menores: { type: 'number', label: 'Defectos menores', required: false, min: 0 },
        resultado: { type: 'select', label: 'Resultado', required: true, options: ['Aprobado', 'Aprobado condicionalmente', 'Rechazado'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-inspeccion',
        label: 'Registrar inspección',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar inspección' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-inspecciones',
        label: 'Historial de inspecciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'referencia_lote', label: 'Lote / Producto' },
            { fieldId: 'inspector', label: 'Inspector' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'cantidad_inspeccionada', label: 'Cantidad' },
            { fieldId: 'defectos_criticos', label: 'D.Críticos' },
            { fieldId: 'resultado', label: 'Resultado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
