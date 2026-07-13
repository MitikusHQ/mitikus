import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const supplierEvaluation: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Compras',
    icon: '🏭',
    color: '#D97706',
    tags: ['proveedor', 'evaluación', 'compras', 'calificación', 'supply chain'],
    keywords: ['evaluación proveedor', 'calificación proveedor', 'supplier evaluation', 'vendor assessment', 'aprovisionamiento', 'compras', 'supply chain', 'homologación proveedores'],
    synonyms: ['calificación de proveedor', 'vendor evaluation', 'supplier assessment'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(18),
    slug: 'supplier-evaluation',
    name: 'Evaluación de Proveedores',
    description: 'Herramienta para evaluar y calificar proveedores de forma periódica. Valora calidad, plazo de entrega, precio, comunicación y servicio postventa.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de gestion de proveedores para empresas de servicios IT. Genera una evaluacion de proveedor con: analisis de criterios de desempeno (calidad, plazo, servicio, precio, innovacion) con puntuacion y evidencias, tendencia respecto a evaluaciones anteriores, incidencias del periodo con su resolucion, clasificacion del proveedor (preferente/aprobado/en vigilancia/descalificado), y plan de mejora o salida segun el resultado. El informe fundamenta las decisiones de renovacion o cambio de proveedor.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        proveedor: { type: 'string', label: 'Nombre del proveedor', required: true },
        categoria: { type: 'string', label: 'Categoría de compra', required: true },
        evaluador: { type: 'string', label: 'Evaluador responsable', required: true },
        periodo: { type: 'string', label: 'Período evaluado', required: true, placeholder: 'Ej: 2025' },
        fecha: { type: 'date', label: 'Fecha de evaluación', required: true },
        calificacion_global: { type: 'select', label: 'Calificación global', required: true, options: ['Excelente', 'Bueno', 'Aceptable', 'Insatisfactorio', 'Bloqueado'] },
        puntuacion: { type: 'number', label: 'Puntuación (0-10)', required: false, min: 0, max: 10 },
        observaciones: { type: 'textarea', label: 'Observaciones y acciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-evaluacion-proveedor',
        label: 'Registrar evaluación',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar evaluación' },
      },
      {
        type: 'SCORING',
        instanceId: 'scoring-proveedor',
        label: 'Evaluación detallada',
        isDefault: false,
        config: {
          criteria: [
            { id: 'calidad', label: 'Calidad del producto / servicio', weight: 0.35 },
            { id: 'plazo', label: 'Cumplimiento de plazos de entrega', weight: 0.25 },
            { id: 'precio', label: 'Competitividad de precios', weight: 0.20 },
            { id: 'comunicacion', label: 'Comunicación y respuesta', weight: 0.10 },
            { id: 'postventa', label: 'Servicio postventa y garantías', weight: 0.10 },
          ],
          thresholds: [
            { min: 8, max: 10, label: 'Proveedor preferente', color: 'green' },
            { min: 6, max: 7.9, label: 'Proveedor aceptable', color: 'yellow' },
            { min: 0, max: 5.9, label: 'Proveedor a revisar', color: 'red' },
          ],
          showTotal: true,
          passingScore: 6,
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-evaluaciones-proveedor',
        label: 'Historial de evaluaciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'proveedor', label: 'Proveedor' },
            { fieldId: 'categoria', label: 'Categoría' },
            { fieldId: 'periodo', label: 'Período' },
            { fieldId: 'calificacion_global', label: 'Calificación' },
            { fieldId: 'puntuacion', label: 'Punt.' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
