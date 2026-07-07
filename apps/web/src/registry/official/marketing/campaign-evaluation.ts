import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const campaignEvaluation: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Marketing',
    icon: '📊',
    color: '#9333EA',
    tags: ['evaluación', 'campaña', 'resultados', 'roi', 'marketing'],
    keywords: ['evaluación campaña', 'resultados campaña', 'campaign evaluation', 'roi campaña', 'análisis resultados', 'campaign performance', 'métricas campaña'],
    synonyms: ['análisis de campaña', 'resultados de marketing', 'campaign results'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(32),
    slug: 'campaign-evaluation',
    name: 'Evaluación de Campaña de Marketing',
    description: 'Herramienta para analizar los resultados de campañas de marketing. Compara objetivos vs. resultados reales, calcula ROI y extrae aprendizajes para futuras campañas.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_campana: { type: 'string', label: 'Nombre de campaña', required: true },
        canal: { type: 'select', label: 'Canal principal', required: true, options: ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Email', 'SEO/Orgánico', 'Influencers', 'TV/Radio', 'OOH', 'Multicanal'] },
        responsable: { type: 'string', label: 'Responsable', required: true },
        fecha_inicio: { type: 'date', label: 'Fecha inicio', required: true },
        fecha_fin: { type: 'date', label: 'Fecha fin', required: true },
        presupuesto_invertido: { type: 'number', label: 'Presupuesto invertido (€)', required: false, min: 0 },
        ingresos_generados: { type: 'number', label: 'Ingresos generados (€)', required: false, min: 0 },
        leads_generados: { type: 'number', label: 'Leads generados', required: false, min: 0 },
        valoracion_global: { type: 'select', label: 'Valoración global', required: true, options: ['Excelente', 'Por encima de objetivo', 'En objetivo', 'Por debajo de objetivo', 'Muy por debajo'] },
        aprendizajes: { type: 'textarea', label: 'Aprendizajes y próximas mejoras', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-evaluacion-campana',
        label: 'Registrar evaluación',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar evaluación' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-campanas-evaluadas',
        label: 'Campañas evaluadas',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_campana', label: 'Campaña' },
            { fieldId: 'canal', label: 'Canal' },
            { fieldId: 'presupuesto_invertido', label: 'Inversión (€)' },
            { fieldId: 'ingresos_generados', label: 'Ingresos (€)' },
            { fieldId: 'leads_generados', label: 'Leads' },
            { fieldId: 'valoracion_global', label: 'Valoración' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
