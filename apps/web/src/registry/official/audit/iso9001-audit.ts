import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const iso9001Audit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '📋',
    color: '#3B82F6',
    tags: ['iso', 'calidad', 'auditoría', 'norma', 'sgc'],
    keywords: ['iso 9001', 'calidad', 'norma', 'auditoría interna', 'proceso', 'conformidad', 'certificación', 'quality management', 'sgc', 'sistema gestión calidad'],
    synonyms: ['auditoría iso', 'auditoría calidad', 'sistema gestión calidad', 'quality audit'],
    complexity: 'advanced',
    estimatedMinutes: 90,
  },
  schema: {
    id: oid(1),
    slug: 'iso-9001-audit',
    name: 'Auditoría ISO 9001',
    description: 'Herramienta para auditorías internas del sistema de gestión de calidad conforme a ISO 9001:2015. Registra hallazgos, evidencias y acciones correctivas.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empresa: { type: 'string', label: 'Empresa / Departamento', required: true },
        proceso: { type: 'string', label: 'Proceso auditado', required: true },
        auditor: { type: 'string', label: 'Auditor responsable', required: true },
        fecha: { type: 'date', label: 'Fecha de auditoría', required: true },
        clausula: { type: 'string', label: 'Cláusula ISO 9001', required: true, placeholder: 'Ej: 8.1 Planificación operacional' },
        resultado: { type: 'select', label: 'Resultado', required: true, options: ['Conforme', 'No conforme menor', 'No conforme mayor', 'Observación', 'Oportunidad de mejora'] },
        hallazgo: { type: 'textarea', label: 'Hallazgo', required: true, placeholder: 'Describe el hallazgo encontrado' },
        evidencia: { type: 'textarea', label: 'Evidencia objetiva', required: false },
        accion: { type: 'textarea', label: 'Acción requerida', required: false },
        plazo: { type: 'date', label: 'Fecha límite corrección', required: false },
        puntuacion: { type: 'number', label: 'Puntuación (0-10)', required: false, min: 0, max: 10 },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'formulario-hallazgo',
        label: 'Registrar hallazgo',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar hallazgo' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-hallazgos',
        label: 'Historial de auditorías',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empresa', label: 'Empresa' },
            { fieldId: 'proceso', label: 'Proceso' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'clausula', label: 'Cláusula' },
            { fieldId: 'resultado', label: 'Resultado' },
            { fieldId: 'puntuacion', label: 'Punt.' },
          ],
          defaultSortField: 'fecha',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
      {
        type: 'SCORING',
        instanceId: 'scoring-iso9001',
        label: 'Evaluación por capítulo',
        isDefault: false,
        config: {
          criteria: [
            { id: 'cap4', label: 'Contexto de la organización (cap. 4)', weight: 0.15 },
            { id: 'cap5', label: 'Liderazgo (cap. 5)', weight: 0.15 },
            { id: 'cap6', label: 'Planificación (cap. 6)', weight: 0.15 },
            { id: 'cap7', label: 'Apoyo (cap. 7)', weight: 0.15 },
            { id: 'cap8', label: 'Operación (cap. 8)', weight: 0.20 },
            { id: 'cap9', label: 'Evaluación del desempeño (cap. 9)', weight: 0.10 },
            { id: 'cap10', label: 'Mejora (cap. 10)', weight: 0.10 },
          ],
          thresholds: [
            { min: 8, max: 10, label: 'Conforme', color: 'green' },
            { min: 6, max: 7.9, label: 'Con observaciones', color: 'yellow' },
            { min: 0, max: 5.9, label: 'No conforme', color: 'red' },
          ],
          showTotal: true,
          passingScore: 6,
        },
      },
    ],
  },
}
