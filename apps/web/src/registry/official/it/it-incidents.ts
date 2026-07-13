import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const itIncidents: OfficialToolDefinition = {
  meta: {
    displayCategory: 'IT',
    icon: '🚨',
    color: '#DC2626',
    tags: ['incidencias', 'it', 'helpdesk', 'soporte', 'tickets'],
    keywords: ['incidencias ti', 'it incidents', 'helpdesk', 'soporte técnico', 'ticket it', 'service desk', 'itsm', 'resolución incidencias'],
    synonyms: ['tickets de soporte', 'service desk', 'it help desk'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(44),
    slug: 'it-incidents',
    name: 'Gestión de Incidencias IT',
    description: 'Herramienta para registrar y gestionar incidencias y solicitudes de soporte técnico. Permite hacer seguimiento desde la apertura hasta la resolución del ticket.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor IT que gestiona incidencias técnicas para clientes empresariales. Genera un informe de incidencia con: descripción técnica del problema, análisis de causa raíz (5 Whys si aplica), impacto real en el negocio del cliente (tiempo de parada, usuarios afectados, pérdida de datos), solución aplicada y efectividad, acciones preventivas para evitar recurrencia, y SLA: si se cumplió el tiempo de respuesta y resolución. Formato válido para comunicar al cliente y para el registro interno.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        numero_ticket: { type: 'string', label: 'Número de ticket', required: true, placeholder: 'INC-2026-001' },
        solicitante: { type: 'string', label: 'Solicitante', required: true },
        tipo: { type: 'select', label: 'Tipo', required: true, options: ['Incidencia', 'Solicitud de servicio', 'Cambio', 'Problema'] },
        categoria: { type: 'select', label: 'Categoría', required: true, options: ['Hardware', 'Software', 'Red/Conectividad', 'Email', 'Accesos y permisos', 'Impresión', 'Otro'] },
        prioridad: { type: 'select', label: 'Prioridad', required: true, options: ['Crítica', 'Alta', 'Media', 'Baja'] },
        descripcion: { type: 'textarea', label: 'Descripción del problema', required: true },
        tecnico_asignado: { type: 'string', label: 'Técnico asignado', required: false },
        fecha_apertura: { type: 'date', label: 'Fecha de apertura', required: true },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Abierto', 'En progreso', 'En espera usuario', 'Resuelto', 'Cerrado'] },
        resolucion: { type: 'textarea', label: 'Resolución / Solución aplicada', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-ticket-it',
        label: 'Abrir ticket',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Abrir ticket' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-incidencias-it',
        label: 'Cola de incidencias',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'numero_ticket', label: 'Ticket' },
            { fieldId: 'solicitante', label: 'Solicitante' },
            { fieldId: 'categoria', label: 'Categoría' },
            { fieldId: 'prioridad', label: 'Prioridad' },
            { fieldId: 'tecnico_asignado', label: 'Técnico' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
