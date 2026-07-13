import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const seoChecklist: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Marketing',
    icon: '🔍',
    color: '#16A34A',
    tags: ['seo', 'checklist', 'on-page', 'publicación', 'contenido'],
    keywords: ['checklist seo', 'seo on-page', 'lista verificación seo', 'publicar artículo', 'optimización seo', 'meta tags', 'keywords', 'posicionamiento'],
    synonyms: ['lista seo', 'seo on-page checklist', 'content seo checklist'],
    complexity: 'simple',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(31),
    slug: 'seo-checklist',
    name: 'Checklist SEO On-Page',
    description: 'Herramienta para verificar los elementos SEO on-page antes de publicar contenido. Garantiza que cada publicación cumple con los estándares de optimización para buscadores.',
    category: 'checklist',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor SEO especializado en posicionamiento para empresas de servicios IT y consultoria tecnologica. Analiza el estado del checklist SEO con: evaluacion del elemento revisado con diagnostico tecnico especifico, impacto estimado en posicionamiento si se corrige (alto/medio/bajo), instruccion de implementacion concreta con ejemplo, herramienta recomendada para verificar la correccion, y prioridad de ejecucion. El analisis debe ser accionable para un desarrollador o responsable de marketing.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        url: { type: 'string', label: 'URL / Slug del artículo', required: true },
        titulo: { type: 'string', label: 'Título del artículo', required: true },
        responsable: { type: 'string', label: 'Responsable SEO', required: true },
        fecha: { type: 'date', label: 'Fecha de revisión', required: true },
        keyword_principal: { type: 'string', label: 'Keyword principal', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-seo-onpage',
        label: 'Verificación SEO',
        isDefault: true,
        config: {
          completionType: 'yes_no',
          showProgress: true,
          categories: ['Título y descripción', 'Contenido', 'URLs y enlaces', 'Técnico', 'Experiencia usuario'],
          items: [
            { id: 'title_tag', label: 'Title tag con keyword principal (50-60 chars)', category: 'Título y descripción', required: true },
            { id: 'meta_desc', label: 'Meta description optimizada (150-160 chars)', category: 'Título y descripción', required: true },
            { id: 'h1', label: 'H1 único con keyword principal', category: 'Contenido', required: true },
            { id: 'estructura_h', label: 'Estructura de encabezados H2/H3 coherente', category: 'Contenido' },
            { id: 'keyword_densidad', label: 'Keyword density natural (1-3%)', category: 'Contenido' },
            { id: 'long_tail', label: 'Keywords long-tail y sinónimos incluidos', category: 'Contenido' },
            { id: 'enlace_interno', label: 'Al menos 2-3 enlaces internos relevantes', category: 'URLs y enlaces' },
            { id: 'enlace_externo', label: 'Enlace externo a fuente autorizada', category: 'URLs y enlaces' },
            { id: 'url_amigable', label: 'URL amigable con keyword (sin stop words)', category: 'URLs y enlaces', required: true },
            { id: 'imagenes_alt', label: 'Imágenes con texto alt optimizado', category: 'Técnico' },
            { id: 'velocidad', label: 'Velocidad de página verificada (>80 PageSpeed)', category: 'Técnico' },
            { id: 'schema', label: 'Schema markup implementado (si aplica)', category: 'Técnico' },
            { id: 'mobile', label: 'Versión móvil revisada', category: 'Experiencia usuario', required: true },
            { id: 'legibilidad', label: 'Legibilidad y formato verificados', category: 'Experiencia usuario' },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-revisiones-seo',
        label: 'Historial de revisiones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'titulo', label: 'Artículo' },
            { fieldId: 'url', label: 'URL' },
            { fieldId: 'keyword_principal', label: 'Keyword' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha', label: 'Fecha' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
