import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const editorialPlan: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Marketing',
    icon: '📅',
    color: '#BE185D',
    tags: ['editorial', 'contenidos', 'calendario', 'marketing', 'publicaciones'],
    keywords: ['plan editorial', 'calendario contenidos', 'content calendar', 'planificación contenidos', 'editorial plan', 'content marketing', 'publicaciones'],
    synonyms: ['calendario editorial', 'content calendar', 'planificación de contenidos'],
    complexity: 'simple',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(28),
    slug: 'editorial-plan',
    name: 'Plan Editorial de Contenidos',
    description: 'Herramienta para planificar y gestionar el calendario editorial de contenidos. Organiza publicaciones por canal, formato, responsable y fecha de publicación.',
    category: 'report',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        titulo: { type: 'string', label: 'Título del contenido', required: true },
        canal: { type: 'select', label: 'Canal', required: true, options: ['Blog', 'LinkedIn', 'Instagram', 'Twitter/X', 'Facebook', 'YouTube', 'Newsletter', 'TikTok', 'Podcast', 'Otro'] },
        formato: { type: 'select', label: 'Formato', required: true, options: ['Artículo', 'Vídeo', 'Imagen', 'Carrusel', 'Stories', 'Infografía', 'Podcast', 'Webinar', 'Email'] },
        responsable: { type: 'string', label: 'Responsable de creación', required: true },
        fecha_publicacion: { type: 'date', label: 'Fecha de publicación', required: true },
        palabras_clave: { type: 'string', label: 'Palabras clave / Topics', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Idea', 'En redacción', 'En revisión', 'Programado', 'Publicado', 'Cancelado'] },
        url: { type: 'string', label: 'URL (si ya está publicado)', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-contenido',
        label: 'Añadir contenido',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir al plan' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-editorial',
        label: 'Calendario editorial',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'titulo', label: 'Título' },
            { fieldId: 'canal', label: 'Canal' },
            { fieldId: 'formato', label: 'Formato' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha_publicacion', label: 'Publicación' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          defaultSortField: 'fecha_publicacion',
          showCreateButton: true,
        },
      },
    ],
  },
}
