import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const jobInterview: OfficialToolDefinition = {
  meta: {
    displayCategory: 'RRHH',
    icon: '💼',
    color: '#6366F1',
    tags: ['entrevista', 'selección', 'candidato', 'rrhh', 'reclutamiento'],
    keywords: ['entrevista trabajo', 'selección personal', 'entrevista candidato', 'job interview', 'recruitment', 'evaluación candidato', 'proceso selección'],
    synonyms: ['entrevista de selección', 'evaluación candidato', 'candidate interview'],
    complexity: 'simple',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(11),
    slug: 'job-interview',
    name: 'Entrevista de Trabajo',
    description: 'Herramienta para registrar y evaluar entrevistas de selección de personal. Documenta competencias, impresiones y decisión final sobre el candidato.',
    category: 'hr',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        candidato: { type: 'string', label: 'Nombre del candidato', required: true },
        puesto: { type: 'string', label: 'Puesto solicitado', required: true },
        entrevistador: { type: 'string', label: 'Entrevistador', required: true },
        fecha: { type: 'date', label: 'Fecha de entrevista', required: true },
        modalidad: { type: 'select', label: 'Modalidad', required: true, options: ['Presencial', 'Videollamada', 'Telefónica'] },
        experiencia: { type: 'select', label: 'Experiencia previa', required: true, options: ['Sin experiencia', 'Junior (<2 años)', 'Mid (2-5 años)', 'Senior (>5 años)'] },
        puntuacion: { type: 'number', label: 'Puntuación global (0-10)', required: false, min: 0, max: 10 },
        decision: { type: 'select', label: 'Decisión', required: true, options: ['Seleccionado', 'Segunda fase', 'Reserva', 'Descartado'] },
        observaciones: { type: 'textarea', label: 'Observaciones y puntos clave', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-entrevista',
        label: 'Registrar entrevista',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar evaluación' },
      },
      {
        type: 'SCORING',
        instanceId: 'scoring-candidato',
        label: 'Evaluación de competencias',
        isDefault: false,
        config: {
          criteria: [
            { id: 'formacion', label: 'Formación y conocimientos técnicos', weight: 0.25 },
            { id: 'experiencia', label: 'Experiencia relevante', weight: 0.25 },
            { id: 'comunicacion', label: 'Habilidades de comunicación', weight: 0.20 },
            { id: 'motivacion', label: 'Motivación y encaje cultural', weight: 0.20 },
            { id: 'potencial', label: 'Potencial de desarrollo', weight: 0.10 },
          ],
          thresholds: [
            { min: 7.5, max: 10, label: 'Recomendado', color: 'green' },
            { min: 5.5, max: 7.4, label: 'Posible segunda fase', color: 'yellow' },
            { min: 0, max: 5.4, label: 'No recomendado', color: 'red' },
          ],
          showTotal: true,
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-candidatos',
        label: 'Registro de candidatos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'candidato', label: 'Candidato' },
            { fieldId: 'puesto', label: 'Puesto' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'puntuacion', label: 'Punt.' },
            { fieldId: 'decision', label: 'Decisión' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
