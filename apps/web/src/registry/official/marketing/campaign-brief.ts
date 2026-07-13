import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const campaignBrief: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Marketing',
    icon: '📋',
    color: '#7C2D92',
    tags: ['brief', 'campaña', 'marketing', 'briefing', 'creatividad'],
    keywords: ['brief campaña', 'briefing marketing', 'campaign brief', 'creative brief', 'briefing publicitario', 'planificación campaña'],
    synonyms: ['briefing de campaña', 'creative brief', 'marketing brief'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(29),
    slug: 'campaign-brief',
    name: 'Brief de Campaña de Marketing',
    description: 'Herramienta para crear y gestionar briefs de campañas de marketing. Define objetivos, público objetivo, mensajes clave, canales y presupuesto.',
    category: 'custom',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de marketing especializado en servicios IT y tecnologia B2B. Genera un brief de campana con: analisis del objetivo y su viabilidad con el presupuesto, definicion del publico objetivo (ICP: sector, tamano empresa, cargo decisor), mensajes clave diferenciadores para el mercado IT, canales recomendados con justificacion (LinkedIn, email, eventos tech, contenido), KPIs de exito medibles, y calendario de ejecucion con hitos. El brief debe ser suficientemente especifico para ejecutarlo sin mas contexto.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_campana: { type: 'string', label: 'Nombre de la campaña', required: true },
        cliente: { type: 'string', label: 'Cliente / Marca', required: true },
        responsable: { type: 'string', label: 'Responsable de campaña', required: true },
        fecha_inicio: { type: 'date', label: 'Fecha de inicio', required: true },
        fecha_fin: { type: 'date', label: 'Fecha de fin', required: true },
        objetivo_principal: { type: 'select', label: 'Objetivo principal', required: true, options: ['Awareness', 'Generación de leads', 'Conversión', 'Retención', 'Lanzamiento producto', 'Branding'] },
        publico_objetivo: { type: 'textarea', label: 'Público objetivo', required: true },
        mensaje_clave: { type: 'textarea', label: 'Mensaje clave / Propuesta de valor', required: true },
        presupuesto: { type: 'number', label: 'Presupuesto (€)', required: false, min: 0 },
        kpis: { type: 'textarea', label: 'KPIs y métricas de éxito', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-brief',
        label: 'Crear brief',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Guardar brief' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-briefs',
        label: 'Briefs de campaña',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_campana', label: 'Campaña' },
            { fieldId: 'cliente', label: 'Cliente' },
            { fieldId: 'objetivo_principal', label: 'Objetivo' },
            { fieldId: 'fecha_inicio', label: 'Inicio' },
            { fieldId: 'fecha_fin', label: 'Fin' },
            { fieldId: 'presupuesto', label: 'Presupuesto' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
