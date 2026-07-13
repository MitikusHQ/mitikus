import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const salesForecast: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Ventas',
    icon: '📈',
    color: '#065F46',
    tags: ['forecast', 'previsión', 'ventas', 'objetivos', 'cuota'],
    keywords: ['previsión ventas', 'sales forecast', 'forecast comercial', 'cuota ventas', 'objetivo ventas', 'revenue forecast', 'presupuesto ventas'],
    synonyms: ['previsión de ventas', 'estimación de ventas', 'revenue forecast'],
    complexity: 'intermediate',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(27),
    slug: 'sales-forecast',
    name: 'Previsión de Ventas (Forecast)',
    description: 'Herramienta para registrar y hacer seguimiento de la previsión de ventas por comercial y período. Compara objetivo vs. real y calcula el ratio de consecución.',
    category: 'report',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de analisis comercial especializado en prevision de ventas para consultoras IT. Genera un analisis de prevision de ventas con: revision del pipeline actual por etapa con valoracion de la fiabilidad de cada oportunidad, prevision de ingresos para el periodo (optimista/realista/pesimista) con justificacion, identificacion de las oportunidades que mas impactan el forecast, desviacion respecto al objetivo con analisis de causas, y recomendaciones para mejorar pipeline y prevision. El informe es para la reunion de ventas semanal o comite de direccion mensual.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        comercial: { type: 'string', label: 'Comercial', required: true },
        periodo: { type: 'string', label: 'Período', required: true, placeholder: 'Ej: Q2 2026' },
        objetivo: { type: 'number', label: 'Objetivo (€)', required: true, min: 0 },
        commit: { type: 'number', label: 'Commit (€)', required: false, min: 0 },
        best_case: { type: 'number', label: 'Best case (€)', required: false, min: 0 },
        real: { type: 'number', label: 'Ventas reales (€)', required: false, min: 0 },
        estado: { type: 'select', label: 'Estado del período', required: true, options: ['En curso', 'Cerrado', 'Revisado'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-forecast',
        label: 'Registrar forecast',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar forecast' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-forecast',
        label: 'Forecast de ventas',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'comercial', label: 'Comercial' },
            { fieldId: 'periodo', label: 'Período' },
            { fieldId: 'objetivo', label: 'Objetivo (€)' },
            { fieldId: 'commit', label: 'Commit (€)' },
            { fieldId: 'real', label: 'Real (€)' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
