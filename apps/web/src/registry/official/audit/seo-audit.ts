import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const seoAudit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '🔍',
    color: '#16A34A',
    tags: ['seo', 'posicionamiento', 'web', 'google', 'marketing digital'],
    keywords: ['auditoría seo', 'posicionamiento web', 'google', 'keywords', 'palabras clave', 'technical seo', 'on-page seo', 'link building', 'core web vitals'],
    synonyms: ['análisis seo', 'revisión seo', 'seo review', 'search engine optimization audit'],
    complexity: 'intermediate',
    estimatedMinutes: 60,
  },
  schema: {
    id: oid(4),
    slug: 'seo-audit',
    name: 'Auditoría SEO',
    description: 'Herramienta completa para auditar el posicionamiento SEO de un sitio web. Evalúa SEO técnico, contenido, autoridad y experiencia de usuario.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de marketing digital especializado en SEO tecnico para pymes. Tu cliente es una consultora IT que audita la presencia digital de sus clientes. Genera un informe de auditoria SEO con: evaluacion del elemento analizado, impacto en el posicionamiento (alto/medio/bajo), recomendacion tecnica especifica con ejemplo de implementacion, prioridad de correccion, y estimacion del impacto esperado. El informe debe ser comprensible para un responsable de negocio sin conocimientos SEO.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        url: { type: 'string', label: 'URL del sitio web', required: true, placeholder: 'https://www.ejemplo.com' },
        cliente: { type: 'string', label: 'Cliente / Proyecto', required: true },
        analista: { type: 'string', label: 'Analista SEO', required: true },
        fecha: { type: 'date', label: 'Fecha de auditoría', required: true },
        posicion_media: { type: 'number', label: 'Posición media en Google', required: false, min: 0, max: 1000 },
        puntuacion_tecnica: { type: 'number', label: 'Puntuación técnica (0-10)', required: false, min: 0, max: 10 },
        puntuacion_contenido: { type: 'number', label: 'Puntuación contenido (0-10)', required: false, min: 0, max: 10 },
        problemas_criticos: { type: 'textarea', label: 'Problemas críticos detectados', required: false },
        recomendaciones: { type: 'textarea', label: 'Recomendaciones prioritarias', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-auditoria-seo',
        label: 'Registrar auditoría',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Guardar auditoría' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-auditorias-seo',
        label: 'Historial de auditorías',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'cliente', label: 'Cliente' },
            { fieldId: 'url', label: 'URL' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'puntuacion_tecnica', label: 'Técnica' },
            { fieldId: 'puntuacion_contenido', label: 'Contenido' },
          ],
          showCreateButton: true,
        },
      },
      {
        type: 'SCORING',
        instanceId: 'scoring-seo',
        label: 'Evaluación SEO completa',
        isDefault: false,
        config: {
          criteria: [
            { id: 'tecnico', label: 'SEO técnico (velocidad, rastreo, indexación)', weight: 0.30 },
            { id: 'contenido', label: 'Calidad y optimización de contenido', weight: 0.25 },
            { id: 'autoridad', label: 'Autoridad de dominio y link building', weight: 0.20 },
            { id: 'experiencia', label: 'Experiencia de usuario (Core Web Vitals)', weight: 0.15 },
            { id: 'local', label: 'SEO local (si aplica)', weight: 0.10 },
          ],
          thresholds: [
            { min: 8, max: 10, label: 'Excelente', color: 'green' },
            { min: 5, max: 7.9, label: 'Mejorable', color: 'yellow' },
            { min: 0, max: 4.9, label: 'Requiere acción', color: 'red' },
          ],
          showTotal: true,
        },
      },
    ],
  },
}
