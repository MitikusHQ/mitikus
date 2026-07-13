import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const digitalMaturity: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Consultoría',
    icon: '🚀',
    color: '#2563EB',
    tags: ['madurez digital', 'transformación digital', 'digitalización', 'diagnóstico', 'consultoría'],
    keywords: ['madurez digital', 'digital maturity', 'transformación digital', 'digitalización empresa', 'nivel digitalización', 'digital transformation assessment'],
    synonyms: ['diagnóstico digital', 'nivel de digitalización', 'digital transformation review'],
    complexity: 'advanced',
    estimatedMinutes: 90,
  },
  schema: {
    id: oid(34),
    slug: 'digital-maturity',
    name: 'Evaluación de Madurez Digital',
    description: 'Herramienta para evaluar el nivel de madurez digital de una organización. Analiza dimensiones como estrategia, datos, tecnología, procesos y cultura digital.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de transformación digital especializado en pymes industriales y de servicios. Genera una evaluación de madurez digital con: puntuación del área analizada (1-5) con justificación detallada, comparativa con el nivel típico del sector, impacto en competitividad de la brecha detectada, plan de mejora concreto con acciones priorizadas y coste estimado de implementación, y quick wins (mejoras con alta rentabilidad y bajo esfuerzo) que la empresa puede acometer en los próximos 30-90 días.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empresa: { type: 'string', label: 'Empresa', required: true },
        sector: { type: 'string', label: 'Sector / Industria', required: false },
        consultor: { type: 'string', label: 'Consultor', required: true },
        fecha: { type: 'date', label: 'Fecha de evaluación', required: true },
        tamano: { type: 'select', label: 'Tamaño de empresa', required: false, options: ['Microempresa (<10)', 'Pequeña (10-49)', 'Mediana (50-249)', 'Grande (>250)'] },
        puntuacion_global: { type: 'number', label: 'Puntuación global (0-10)', required: false, min: 0, max: 10 },
        nivel_actual: { type: 'select', label: 'Nivel de madurez', required: false, options: ['Inicial', 'Emergente', 'Definido', 'Avanzado', 'Líder'] },
        fortalezas: { type: 'textarea', label: 'Fortalezas identificadas', required: false },
        gaps: { type: 'textarea', label: 'Brechas / Gaps digitales', required: false },
        roadmap: { type: 'textarea', label: 'Hoja de ruta recomendada', required: false },
      },
    },
    capabilities: [
      {
        type: 'SCORING',
        instanceId: 'scoring-madurez-digital',
        label: 'Evaluación por dimensiones',
        isDefault: true,
        config: {
          criteria: [
            { id: 'estrategia', label: 'Estrategia y liderazgo digital', weight: 0.20 },
            { id: 'datos', label: 'Gestión de datos y analítica', weight: 0.20 },
            { id: 'tecnologia', label: 'Tecnología e infraestructura', weight: 0.20 },
            { id: 'procesos', label: 'Digitalización de procesos', weight: 0.20 },
            { id: 'cultura', label: 'Cultura y talento digital', weight: 0.20 },
          ],
          thresholds: [
            { min: 8, max: 10, label: 'Líder digital', color: 'green' },
            { min: 6, max: 7.9, label: 'Avanzado', color: 'yellow' },
            { min: 4, max: 5.9, label: 'Emergente', color: 'yellow' },
            { min: 0, max: 3.9, label: 'Inicial', color: 'red' },
          ],
          showTotal: true,
        },
      },
      {
        type: 'FORM',
        instanceId: 'form-diagnostico-digital',
        label: 'Datos del diagnóstico',
        isDefault: false,
        config: { layout: 'two-column', submitLabel: 'Guardar diagnóstico' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-diagnosticos-digitales',
        label: 'Diagnósticos realizados',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empresa', label: 'Empresa' },
            { fieldId: 'sector', label: 'Sector' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'nivel_actual', label: 'Nivel' },
            { fieldId: 'puntuacion_global', label: 'Punt.' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
