import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const annualReview: OfficialToolDefinition = {
  meta: {
    displayCategory: 'RRHH',
    icon: '⭐',
    color: '#F59E0B',
    tags: ['evaluación', 'desempeño', 'anual', 'rrhh', 'rendimiento'],
    keywords: ['evaluación anual', 'revisión anual', 'annual review', 'desempeño', 'performance review', 'evaluación empleado', 'valoración anual'],
    synonyms: ['valoración anual', 'revisión de desempeño', 'performance appraisal'],
    complexity: 'intermediate',
    estimatedMinutes: 45,
  },
  schema: {
    id: oid(9),
    slug: 'annual-review',
    name: 'Evaluación Anual del Empleado',
    description: 'Herramienta para realizar evaluaciones anuales de desempeño. Valora competencias, logros, objetivos cumplidos y planifica el desarrollo profesional.',
    category: 'hr',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de RRHH especializado en empresas de servicios tecnologicos. Genera un informe de revision anual del empleado con: evaluacion de competencias tecnicas y soft skills para perfil IT, analisis de objetivos del anno (cumplidos/parcialmente/no cumplidos), valoracion de la contribucion al equipo y proyectos cliente, areas de desarrollo con plan de accion concreto, y recomendacion salarial o de promocion justificada. El informe debe ser valido para la conversacion de feedback.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empleado: { type: 'string', label: 'Nombre del empleado', required: true },
        puesto: { type: 'string', label: 'Puesto', required: true },
        evaluador: { type: 'string', label: 'Evaluador / Manager', required: true },
        periodo: { type: 'string', label: 'Período evaluado', required: true, placeholder: 'Ej: 2025' },
        fecha: { type: 'date', label: 'Fecha de evaluación', required: true },
        valoracion_global: { type: 'select', label: 'Valoración global', required: true, options: ['Excepcional', 'Supera expectativas', 'Cumple expectativas', 'Por debajo de expectativas', 'Insatisfactorio'] },
        puntuacion: { type: 'number', label: 'Puntuación (0-10)', required: false, min: 0, max: 10 },
        logros: { type: 'textarea', label: 'Principales logros del período', required: false },
        areas_mejora: { type: 'textarea', label: 'Áreas de mejora', required: false },
        objetivos_siguente: { type: 'textarea', label: 'Objetivos para el siguiente período', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-evaluacion-anual',
        label: 'Registrar evaluación',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar evaluación' },
      },
      {
        type: 'SCORING',
        instanceId: 'scoring-competencias',
        label: 'Evaluación por competencias',
        isDefault: false,
        config: {
          criteria: [
            { id: 'resultados', label: 'Consecución de resultados', weight: 0.25 },
            { id: 'trabajo_equipo', label: 'Trabajo en equipo', weight: 0.20 },
            { id: 'comunicacion', label: 'Comunicación', weight: 0.15 },
            { id: 'iniciativa', label: 'Iniciativa y proactividad', weight: 0.15 },
            { id: 'liderazgo', label: 'Liderazgo (si aplica)', weight: 0.10 },
            { id: 'adaptabilidad', label: 'Adaptabilidad', weight: 0.15 },
          ],
          thresholds: [
            { min: 8, max: 10, label: 'Excepcional', color: 'green' },
            { min: 6, max: 7.9, label: 'Satisfactorio', color: 'yellow' },
            { min: 0, max: 5.9, label: 'Necesita mejora', color: 'red' },
          ],
          showTotal: true,
          passingScore: 6,
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-evaluaciones',
        label: 'Historial de evaluaciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empleado', label: 'Empleado' },
            { fieldId: 'periodo', label: 'Período' },
            { fieldId: 'evaluador', label: 'Evaluador' },
            { fieldId: 'valoracion_global', label: 'Valoración' },
            { fieldId: 'puntuacion', label: 'Punt.' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
