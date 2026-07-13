import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const offerComparison: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Compras',
    icon: '⚖️',
    color: '#0369A1',
    tags: ['comparativa', 'ofertas', 'compras', 'licitación', 'adjudicación'],
    keywords: ['comparativa ofertas', 'offer comparison', 'análisis proveedores', 'licitación', 'adjudicación', 'tres presupuestos', 'concurso compras'],
    synonyms: ['análisis de ofertas', 'comparativo de presupuestos', 'bid comparison'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(21),
    slug: 'offer-comparison',
    name: 'Comparativa de Ofertas',
    description: 'Herramienta para comparar y evaluar ofertas de proveedores en procesos de compra. Permite registrar criterios, puntuaciones y documentar la decisión de adjudicación.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de compras especializado en evaluacion de proveedores tecnologicos. Genera un analisis comparativo de ofertas con: tabla comparativa de criterios evaluados (precio, plazo, soporte, garantias, referencias), puntuacion ponderada con justificacion de los pesos, analisis de riesgos de cada proveedor (financiero, tecnico, de servicio), recomendacion razonada del proveedor ganador, y condiciones clave a negociar antes de la firma. El informe es para el responsable de compras o la direccion.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        referencia: { type: 'string', label: 'Referencia del proceso', required: true },
        descripcion_compra: { type: 'string', label: 'Descripción de la compra', required: true },
        proveedor: { type: 'string', label: 'Proveedor ofertante', required: true },
        precio_ofertado: { type: 'number', label: 'Precio ofertado (€)', required: true, min: 0 },
        plazo_entrega: { type: 'string', label: 'Plazo de entrega', required: false },
        condiciones: { type: 'textarea', label: 'Condiciones y garantías', required: false },
        puntuacion_precio: { type: 'number', label: 'Puntuación precio (0-10)', required: false, min: 0, max: 10 },
        puntuacion_calidad: { type: 'number', label: 'Puntuación calidad/técnica (0-10)', required: false, min: 0, max: 10 },
        puntuacion_plazo: { type: 'number', label: 'Puntuación plazo (0-10)', required: false, min: 0, max: 10 },
        adjudicado: { type: 'boolean', label: 'Oferta adjudicada', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-oferta',
        label: 'Registrar oferta',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir oferta' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-ofertas',
        label: 'Comparativa de ofertas',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'proveedor', label: 'Proveedor' },
            { fieldId: 'precio_ofertado', label: 'Precio (€)' },
            { fieldId: 'plazo_entrega', label: 'Plazo' },
            { fieldId: 'puntuacion_precio', label: 'P.Precio' },
            { fieldId: 'puntuacion_calidad', label: 'P.Calidad' },
            { fieldId: 'adjudicado', label: 'Adjudicado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
