import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const preventiveAction: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Calidad',
    icon: '🛡',
    color: '#8B5CF6',
    tags: ['acción preventiva', 'calidad', 'riesgo', 'prevención', 'mejora'],
    keywords: ['acción preventiva', 'preventive action', 'gestión riesgos', 'prevención fallos', 'oportunidad mejora', 'par', 'mejora proactiva'],
    synonyms: ['plan de prevención', 'preventive action plan', 'PAR'],
    complexity: 'intermediate',
    estimatedMinutes: 25,
  },
  schema: {
    id: oid(15),
    slug: 'preventive-action',
    name: 'Acciones Preventivas',
    description: 'Herramienta para gestionar acciones preventivas que eliminan causas de no conformidades potenciales. Permite actuar proactivamente sobre riesgos identificados.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de calidad especializado en gestion de riesgos para empresas IT. Genera un informe de accion preventiva con: descripcion del riesgo o situacion potencial identificada con probabilidad e impacto estimados, analisis de causas que podrian materializarlo, accion preventiva propuesta con responsable y plazo, coste estimado de la accion vs coste del riesgo si se materializa, y criterio de seguimiento para verificar que el riesgo se ha mitigado. El informe apoya la gestion proactiva de riesgos segun ISO 9001 clausula 6.1.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        referencia: { type: 'string', label: 'Referencia AP', required: true, placeholder: 'AP-2026-001' },
        riesgo_identificado: { type: 'textarea', label: 'Riesgo / Problema potencial identificado', required: true },
        origen: { type: 'select', label: 'Origen de detección', required: true, options: ['Análisis de datos', 'Auditoría interna', 'Revisión por dirección', 'Sugerencia empleado', 'Benchmarking', 'Cliente'] },
        probabilidad: { type: 'select', label: 'Probabilidad de ocurrencia', required: true, options: ['Alta', 'Media', 'Baja'] },
        impacto: { type: 'select', label: 'Impacto potencial', required: true, options: ['Crítico', 'Alto', 'Medio', 'Bajo'] },
        accion: { type: 'textarea', label: 'Acción preventiva planificada', required: true },
        responsable: { type: 'string', label: 'Responsable', required: true },
        fecha_objetivo: { type: 'date', label: 'Fecha objetivo', required: true },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Pendiente', 'En curso', 'Completada', 'Cerrada'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-accion-preventiva',
        label: 'Registrar acción preventiva',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Registrar acción' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-acciones-preventivas',
        label: 'Registro de APs',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'referencia', label: 'Referencia' },
            { fieldId: 'probabilidad', label: 'Prob.' },
            { fieldId: 'impacto', label: 'Impacto' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha_objetivo', label: 'Fecha objetivo' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
