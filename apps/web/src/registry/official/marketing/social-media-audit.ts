import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const socialMediaAudit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Marketing',
    icon: '📱',
    color: '#E11D48',
    tags: ['redes sociales', 'social media', 'auditoría', 'community manager', 'digital'],
    keywords: ['auditoría redes sociales', 'social media audit', 'análisis redes sociales', 'community manager', 'engagement', 'instagram', 'linkedin', 'presencia digital'],
    synonyms: ['análisis redes sociales', 'social media review', 'revisión rrss'],
    complexity: 'intermediate',
    estimatedMinutes: 45,
  },
  schema: {
    id: oid(30),
    slug: 'social-media-audit',
    name: 'Auditoría de Redes Sociales',
    description: 'Herramienta para auditar la presencia y rendimiento en redes sociales. Evalúa cada canal, métricas de engagement, calidad de contenido y consistencia de marca.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        marca: { type: 'string', label: 'Marca / Empresa', required: true },
        red_social: { type: 'select', label: 'Red social', required: true, options: ['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook', 'TikTok', 'YouTube', 'Pinterest', 'Otro'] },
        analista: { type: 'string', label: 'Analista', required: true },
        fecha: { type: 'date', label: 'Fecha de auditoría', required: true },
        seguidores: { type: 'number', label: 'Seguidores actuales', required: false, min: 0 },
        tasa_engagement: { type: 'number', label: 'Tasa de engagement (%)', required: false, min: 0, max: 100 },
        frecuencia_publicacion: { type: 'select', label: 'Frecuencia de publicación', required: false, options: ['Diaria', '3-5 veces/semana', '1-2 veces/semana', 'Menos de 1 vez/semana', 'Irregular'] },
        puntuacion: { type: 'number', label: 'Puntuación global (0-10)', required: false, min: 0, max: 10 },
        recomendaciones: { type: 'textarea', label: 'Recomendaciones de mejora', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-red-social',
        label: 'Auditar red social',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar auditoría' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-redes-sociales',
        label: 'Resultado por red social',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'marca', label: 'Marca' },
            { fieldId: 'red_social', label: 'Red social' },
            { fieldId: 'seguidores', label: 'Seguidores' },
            { fieldId: 'tasa_engagement', label: 'Engagement (%)' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'puntuacion', label: 'Punt.' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
