import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const itAudit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '💻',
    color: '#4F46E5',
    tags: ['ti', 'tecnología', 'auditoría', 'sistemas', 'informática'],
    keywords: ['auditoría ti', 'auditoría informática', 'systems audit', 'tecnología información', 'it audit', 'controles ti', 'cobit', 'tecnologías información'],
    synonyms: ['auditoría sistemas', 'auditoría tecnológica', 'it systems audit'],
    complexity: 'advanced',
    estimatedMinutes: 90,
  },
  schema: {
    id: oid(3),
    slug: 'it-audit',
    name: 'Auditoría Informática',
    description: 'Herramienta para auditorías de sistemas de información y tecnología. Evalúa controles de infraestructura, aplicaciones, datos y seguridad TI.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor IT senior especializado en auditorías técnicas para pymes y empresas medianas. Tu cliente es una consultora IT que necesita un informe profesional para entregar a su cliente final.

Genera un informe de auditoría IT estructurado con: resumen ejecutivo del hallazgo, análisis técnico detallado, impacto real en el negocio del cliente, recomendación de remediación con pasos concretos y estimación de esfuerzo, y clasificación de riesgo justificada. Usa terminología técnica precisa pero comprensible para un responsable IT no especialista. El informe debe poder enviarse directamente al cliente sin edición adicional.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        sistema: { type: 'string', label: 'Sistema / Aplicación', required: true },
        area: { type: 'select', label: 'Área de auditoría', required: true, options: ['Infraestructura', 'Seguridad lógica', 'Gestión de datos', 'Desarrollo', 'Continuidad', 'Cumplimiento', 'Redes y comunicaciones'] },
        auditor: { type: 'string', label: 'Auditor', required: true },
        fecha: { type: 'date', label: 'Fecha', required: true },
        hallazgo: { type: 'textarea', label: 'Hallazgo', required: true },
        criticidad: { type: 'select', label: 'Criticidad', required: true, options: ['Crítica', 'Alta', 'Media', 'Baja', 'Informativa'] },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Abierto', 'En progreso', 'Resuelto', 'Aceptado'] },
        responsable: { type: 'string', label: 'Responsable de subsanación', required: false },
        fecha_cierre: { type: 'date', label: 'Fecha objetivo de cierre', required: false },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-hallazgo-ti',
        label: 'Registrar hallazgo',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar hallazgo' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-hallazgos-ti',
        label: 'Registro de hallazgos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'sistema', label: 'Sistema' },
            { fieldId: 'area', label: 'Área' },
            { fieldId: 'criticidad', label: 'Criticidad' },
            { fieldId: 'estado', label: 'Estado' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha_cierre', label: 'Cierre' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
