import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const swotAnalysis: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Consultoría',
    icon: '🧩',
    color: '#0891B2',
    tags: ['dafo', 'swot', 'estrategia', 'análisis', 'consultoría'],
    keywords: ['análisis dafo', 'swot analysis', 'dafo', 'fortalezas debilidades oportunidades amenazas', 'análisis estratégico', 'strategic analysis', 'matriz dafo'],
    synonyms: ['análisis foda', 'matriz swot', 'dafo empresarial', 'strategic swot'],
    complexity: 'intermediate',
    estimatedMinutes: 60,
  },
  schema: {
    id: oid(33),
    slug: 'swot-analysis',
    name: 'Análisis DAFO / SWOT',
    description: 'Herramienta para realizar análisis DAFO (Debilidades, Amenazas, Fortalezas, Oportunidades). Estructura el análisis estratégico interno y externo de una organización.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor estrategico especializado en empresas de servicios tecnologicos. Genera un analisis DAFO completo con: fortalezas internas diferenciadoras (valorando cuales son sostenibles), debilidades internas con impacto en competitividad, oportunidades del mercado IT con plazo de aprovechamiento, amenazas del entorno con probabilidad e impacto, y matriz de estrategias cruzadas con las 3 iniciativas estrategicas prioritarias. El analisis debe ser accionable, no teorico.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empresa: { type: 'string', label: 'Empresa / Proyecto', required: true },
        consultor: { type: 'string', label: 'Consultor responsable', required: true },
        fecha: { type: 'date', label: 'Fecha de análisis', required: true },
        cuadrante: { type: 'select', label: 'Cuadrante DAFO', required: true, options: ['Fortaleza (F)', 'Debilidad (D)', 'Oportunidad (O)', 'Amenaza (A)'] },
        descripcion: { type: 'textarea', label: 'Descripción del factor', required: true },
        impacto: { type: 'select', label: 'Nivel de impacto', required: true, options: ['Alto', 'Medio', 'Bajo'] },
        prioridad: { type: 'number', label: 'Prioridad (1=máxima)', required: false, min: 1, max: 10 },
        acciones: { type: 'textarea', label: 'Acciones estratégicas derivadas', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-factor-dafo',
        label: 'Registrar factor DAFO',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Añadir factor' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-dafo',
        label: 'Matriz DAFO completa',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empresa', label: 'Empresa' },
            { fieldId: 'cuadrante', label: 'Cuadrante' },
            { fieldId: 'descripcion', label: 'Factor' },
            { fieldId: 'impacto', label: 'Impacto' },
            { fieldId: 'prioridad', label: 'Prioridad' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
