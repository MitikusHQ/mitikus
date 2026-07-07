import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const incidentReport: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Seguridad',
    icon: '🚨',
    color: '#B91C1C',
    tags: ['incidente', 'accidente', 'seguridad', 'prl', 'parte'],
    keywords: ['informe incidente', 'parte de accidente', 'incident report', 'accidente laboral', 'casi-accidente', 'near miss', 'investigación accidente'],
    synonyms: ['parte de incidente', 'reporte de accidente', 'accident report'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(39),
    slug: 'incident-report',
    name: 'Informe de Incidentes / Accidentes',
    description: 'Herramienta para registrar e investigar incidentes, accidentes y casi-accidentes laborales. Documenta causas, consecuencias y medidas correctivas para prevenir recurrencias.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        tipo: { type: 'select', label: 'Tipo de evento', required: true, options: ['Accidente con baja', 'Accidente sin baja', 'Casi-accidente (near miss)', 'Incidente de seguridad', 'Enfermedad profesional'] },
        fecha_evento: { type: 'date', label: 'Fecha del evento', required: true },
        lugar: { type: 'string', label: 'Lugar del evento', required: true },
        afectado: { type: 'string', label: 'Persona afectada', required: false },
        descripcion: { type: 'textarea', label: 'Descripción detallada del evento', required: true },
        causa_inmediata: { type: 'textarea', label: 'Causa inmediata', required: false },
        causa_raiz: { type: 'textarea', label: 'Causa raíz', required: false },
        gravedad: { type: 'select', label: 'Gravedad', required: true, options: ['Leve', 'Grave', 'Muy grave', 'Mortal', 'Sin daño'] },
        medidas: { type: 'textarea', label: 'Medidas correctivas adoptadas', required: true },
        estado: { type: 'select', label: 'Estado de investigación', required: true, options: ['Abierto', 'En investigación', 'Cerrado'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-incidente',
        label: 'Registrar incidente',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Abrir informe de incidente' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-incidentes',
        label: 'Registro de incidentes',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'fecha_evento', label: 'Fecha' },
            { fieldId: 'lugar', label: 'Lugar' },
            { fieldId: 'gravedad', label: 'Gravedad' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          defaultSortField: 'fecha_evento',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
    ],
  },
}
