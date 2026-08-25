import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const socialMediaManager: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Marketing',
    icon: '📣',
    color: '#2563EB',
    tags: ['redes sociales', 'social media', 'contenido', 'calendario', 'publicaciones'],
    keywords: [
      'gestión redes sociales',
      'social media manager',
      'calendario redes sociales',
      'publicaciones instagram',
      'publicaciones linkedin',
      'facebook',
      'twitter x',
      'tiktok',
      'borradores redes',
      'planificación social media',
      'contenido para clientes',
    ],
    synonyms: ['gestor de redes', 'calendario social', 'social planner', 'publicaciones redes'],
    complexity: 'simple',
    estimatedMinutes: 12,
    status: 'beta',
  },
  schema: {
    id: oid(53),
    slug: 'social-media-manager',
    name: 'Gestor de redes sociales',
    description: 'Herramienta opcional para preparar, organizar y revisar publicaciones de redes sociales por canal, fecha, cliente, estado y objetivo. Guarda el plan en MITIKUS; no publica automáticamente en redes externas.',
    category: 'report',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres Brain aplicado a publicaciones de redes sociales dentro de MITIKUS. Tu trabajo es ayudar a preparar ideas, borradores y calendario editorial, nunca publicar en redes externas. Usa el contexto disponible del workspace, cliente o marca para proponer contenido útil y verificable. Si el usuario solo aporta una idea breve, conviértela en un borrador claro. Si aporta un texto, mejóralo.

No uses tablas. Devuelve bloques limpios, fáciles de leer y preparados para copiar.

Devuelve una respuesta práctica con estas partes:
1. Enfoque recomendado: objetivo, audiencia y tono.
2. Borrador principal adaptado a la plataforma elegida.
3. Variante corta.
4. Variante más completa.
5. Llamada a la acción sugerida.
6. Hashtags o etiquetas útiles si encajan con el tema real.
7. Riesgos o ajustes antes de publicar manualmente.
8. Siguiente paso dentro de MITIKUS.

Si faltan campos opcionales, no los inventes como datos confirmados: propón una orientación inicial razonable. No digas que la publicación queda publicada, programada automáticamente o enviada a una red social.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        titulo: {
          type: 'string',
          label: 'Título interno',
          required: true,
          placeholder: 'Ej. Lanzamiento promoción agosto',
        },
        cliente_o_marca: {
          type: 'string',
          label: 'Cliente o marca',
          required: false,
          placeholder: 'Ej. Borja-Prieto, Lenke Harmath...',
        },
        contexto_marca: {
          type: 'textarea',
          label: 'Contexto de marca',
          required: false,
          rows: 4,
          placeholder: 'Ej. Tono cercano y directo, sin tecnicismos. Audiencia: autónomos 30-50 años. Evitar hablar de precios. Ejemplo de publicación que funcionó: "3 cosas que nadie te dice sobre facturar como freelance..."',
          helpText: 'Describe el tono, la audiencia y ejemplos reales de publicaciones que han funcionado. La IA usará este contexto al generar borradores.',
        },
        plataforma: {
          type: 'select',
          label: 'Plataforma',
          required: true,
          options: ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'YouTube', 'X/Twitter', 'Google Business', 'Newsletter', 'Otro'],
        },
        formato: {
          type: 'select',
          label: 'Formato',
          required: true,
          options: ['Post', 'Carrusel', 'Reel', 'Story', 'Vídeo', 'Short', 'Artículo', 'Encuesta', 'Anuncio', 'Otro'],
        },
        objetivo: {
          type: 'select',
          label: 'Objetivo',
          required: true,
          options: ['Visibilidad', 'Captación', 'Venta', 'Confianza', 'Educación', 'Comunidad', 'Soporte', 'Lanzamiento'],
        },
        audiencia: {
          type: 'string',
          label: 'Audiencia objetivo',
          required: false,
          placeholder: 'Ej. autónomos, clientes actuales, leads fríos...',
        },
        tono: {
          type: 'select',
          label: 'Tono',
          required: false,
          options: ['Profesional', 'Cercano', 'Educativo', 'Inspirador', 'Promocional', 'Técnico', 'Humor ligero'],
        },
        fecha_prevista: { type: 'date', label: 'Fecha prevista', required: false },
        hora_prevista: {
          type: 'string',
          label: 'Hora prevista',
          required: false,
          placeholder: 'Ej. 10:30',
        },
        estado: {
          type: 'select',
          label: 'Estado',
          required: true,
          options: ['Idea', 'Borrador', 'En revisión', 'Aprobado', 'Programado manualmente', 'Publicado', 'Descartado'],
          helpText: '“Programado manualmente” significa planificado dentro de MITIKUS, no publicado automáticamente en una red externa.',
        },
        copy: {
          type: 'textarea',
          label: 'Idea o borrador de la publicación',
          required: true,
          rows: 6,
          placeholder: 'Ej. Quiero anunciar una promoción, explicar un servicio o mejorar este borrador...',
        },
        llamada_accion: {
          type: 'string',
          label: 'Llamada a la acción',
          required: false,
          placeholder: 'Ej. Reserva una llamada, responde al post, visita la web...',
        },
        hashtags: {
          type: 'string',
          label: 'Hashtags',
          required: false,
          placeholder: '#mitikus #negocio #productividad',
        },
        enlace_recurso: {
          type: 'string',
          label: 'Imagen, vídeo o enlace de apoyo',
          required: false,
          placeholder: 'URL del recurso, carpeta o referencia interna',
        },
        enlace_publicado: {
          type: 'string',
          label: 'URL publicada',
          required: false,
          placeholder: 'Cuando la hayas publicado fuera de MITIKUS, pega aquí el enlace',
        },
        responsable: { type: 'string', label: 'Responsable', required: false },
        revision: {
          type: 'select',
          label: 'Revisión',
          required: false,
          options: ['Sin revisar', 'Revisar tono', 'Revisar diseño', 'Revisar legal', 'Listo'],
        },
        notas: { type: 'textarea', label: 'Notas internas', required: false, rows: 3 },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-publicacion-social',
        label: 'Nueva publicación',
        isDefault: true,
        config: {
          layout: 'sections',
          submitLabel: 'Guardar en MITIKUS',
          sections: [
            {
              id: 'planificacion',
              title: '1. Planificación',
              fieldIds: ['titulo', 'cliente_o_marca', 'contexto_marca', 'plataforma', 'formato', 'objetivo', 'audiencia', 'tono'],
            },
            {
              id: 'calendario',
              title: '2. Calendario y estado',
              fieldIds: ['fecha_prevista', 'hora_prevista', 'estado', 'responsable', 'revision'],
            },
            {
              id: 'contenido',
              title: '3. Contenido',
              fieldIds: ['copy', 'llamada_accion', 'hashtags', 'enlace_recurso'],
            },
            {
              id: 'seguimiento',
              title: '4. Seguimiento',
              fieldIds: ['enlace_publicado', 'notas'],
            },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-publicaciones-sociales',
        label: 'Calendario de publicaciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'fecha_prevista', label: 'Fecha', sortable: true },
            { fieldId: 'hora_prevista', label: 'Hora' },
            { fieldId: 'titulo', label: 'Publicación' },
            { fieldId: 'cliente_o_marca', label: 'Cliente / marca' },
            { fieldId: 'plataforma', label: 'Plataforma' },
            { fieldId: 'estado', label: 'Estado' },
            { fieldId: 'revision', label: 'Revisión' },
          ],
          defaultSortField: 'fecha_prevista',
          defaultSortDirection: 'asc',
          pageSize: 25,
          showCreateButton: true,
        },
      },
    ],
  },
}



