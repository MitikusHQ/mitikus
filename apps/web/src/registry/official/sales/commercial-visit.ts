import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const commercialVisit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Ventas',
    icon: '🤝',
    color: '#1D4ED8',
    tags: ['visita', 'comercial', 'reunión', 'cliente', 'ventas'],
    keywords: ['visita comercial', 'reunión comercial', 'sales visit', 'customer visit', 'informe visita', 'reporte visita comercial'],
    synonyms: ['informe de visita comercial', 'customer meeting report', 'sales call report'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(24),
    slug: 'commercial-visit',
    name: 'Informe de Visita Comercial',
    description: 'Herramienta para registrar y documentar visitas comerciales a clientes. Captura objetivos, acuerdos alcanzados, próximos pasos y oportunidades detectadas.',
    category: 'crm',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        cliente: { type: 'string', label: 'Cliente / Empresa', required: true },
        contacto: { type: 'string', label: 'Persona de contacto', required: true },
        comercial: { type: 'string', label: 'Comercial', required: true },
        fecha: { type: 'date', label: 'Fecha de visita', required: true },
        modalidad: { type: 'select', label: 'Modalidad', required: true, options: ['Presencial', 'Videollamada', 'Telefónica'] },
        objetivo: { type: 'string', label: 'Objetivo de la visita', required: true },
        resultado: { type: 'select', label: 'Resultado', required: true, options: ['Positivo', 'Neutro', 'Negativo', 'Pendiente seguimiento'] },
        acuerdos: { type: 'textarea', label: 'Acuerdos y compromisos', required: false },
        proximos_pasos: { type: 'textarea', label: 'Próximos pasos', required: false },
        oportunidad: { type: 'boolean', label: '¿Oportunidad comercial detectada?', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-visita',
        label: 'Registrar visita',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar informe' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-visitas',
        label: 'Historial de visitas',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'cliente', label: 'Cliente' },
            { fieldId: 'contacto', label: 'Contacto' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'objetivo', label: 'Objetivo' },
            { fieldId: 'resultado', label: 'Resultado' },
            { fieldId: 'oportunidad', label: 'Oportunidad' },
          ],
          defaultSortField: 'fecha',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
    ],
  },
}
