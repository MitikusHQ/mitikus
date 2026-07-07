import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const crmLeads: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Ventas',
    icon: '🎯',
    color: '#7C3AED',
    tags: ['crm', 'leads', 'ventas', 'prospectos', 'captación'],
    keywords: ['crm', 'leads', 'prospectos', 'captación clientes', 'customer relationship', 'gestión contactos', 'sales crm', 'pipeline ventas', 'oportunidades comerciales'],
    synonyms: ['gestión de leads', 'prospectos comerciales', 'customer leads management'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(22),
    slug: 'crm-leads',
    name: 'Gestión de Leads (CRM)',
    description: 'Herramienta CRM para capturar, calificar y hacer seguimiento de leads comerciales. Gestiona el ciclo de vida desde la captación hasta la conversión.',
    category: 'crm',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_contacto: { type: 'string', label: 'Nombre del contacto', required: true },
        empresa: { type: 'string', label: 'Empresa', required: false },
        email: { type: 'string', label: 'Email', required: false },
        telefono: { type: 'string', label: 'Teléfono', required: false },
        origen: { type: 'select', label: 'Origen del lead', required: true, options: ['Web', 'Referido', 'LinkedIn', 'Evento', 'Cold outreach', 'Inbound', 'Otro'] },
        temperatura: { type: 'select', label: 'Temperatura', required: true, options: ['Frío', 'Templado', 'Caliente', 'Urgente'] },
        comercial: { type: 'string', label: 'Comercial asignado', required: true },
        fecha_captacion: { type: 'date', label: 'Fecha de captación', required: true },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Nuevo', 'Contactado', 'Calificado', 'Propuesta enviada', 'Negociación', 'Convertido', 'Perdido'] },
        notas: { type: 'textarea', label: 'Notas', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-lead',
        label: 'Registrar lead',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir lead' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-leads',
        label: 'Base de leads',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_contacto', label: 'Contacto' },
            { fieldId: 'empresa', label: 'Empresa' },
            { fieldId: 'origen', label: 'Origen' },
            { fieldId: 'temperatura', label: 'Temperatura' },
            { fieldId: 'comercial', label: 'Comercial' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
