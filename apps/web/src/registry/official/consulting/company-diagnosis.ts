import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const companyDiagnosis: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Consultoría',
    icon: '🏢',
    color: '#374151',
    tags: ['diagnóstico', 'empresa', 'consultoría', 'análisis', 'situación'],
    keywords: ['diagnóstico empresarial', 'company diagnosis', 'análisis empresa', 'situación actual empresa', 'consultoría empresarial', 'business diagnosis'],
    synonyms: ['diagnóstico organizacional', 'análisis empresarial', 'business assessment'],
    complexity: 'advanced',
    estimatedMinutes: 120,
  },
  schema: {
    id: oid(35),
    slug: 'company-diagnosis',
    name: 'Diagnóstico Empresarial',
    description: 'Herramienta integral para diagnosticar la situación actual de una empresa. Evalúa áreas clave como estrategia, finanzas, operaciones, RRHH, marketing y tecnología.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor IT estratégico que elabora diagnósticos tecnológicos para directivos de pymes. Genera un diagnóstico empresarial IT con: situación actual de la empresa en términos tecnológicos, principales brechas detectadas entre la situación actual y la óptima para su sector y tamaño, oportunidades de mejora con mayor impacto en productividad o reducción de costes, riesgos tecnológicos que la empresa no está gestionando, y hoja de ruta de transformación IT recomendada a 12 meses con priorización. Tono ejecutivo, sin tecnicismos innecesarios.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empresa: { type: 'string', label: 'Empresa', required: true },
        consultor: { type: 'string', label: 'Consultor responsable', required: true },
        fecha: { type: 'date', label: 'Fecha de diagnóstico', required: true },
        area: { type: 'select', label: 'Área evaluada', required: true, options: ['Estrategia y dirección', 'Finanzas', 'Operaciones', 'Recursos humanos', 'Marketing y ventas', 'Tecnología', 'Calidad', 'Gestión general'] },
        situacion_actual: { type: 'textarea', label: 'Situación actual', required: true },
        puntuacion: { type: 'number', label: 'Puntuación del área (0-10)', required: true, min: 0, max: 10 },
        problemas: { type: 'textarea', label: 'Principales problemas identificados', required: false },
        recomendaciones: { type: 'textarea', label: 'Recomendaciones de mejora', required: false },
        prioridad: { type: 'select', label: 'Prioridad de actuación', required: false, options: ['Urgente', 'Alta', 'Media', 'Baja'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-area-diagnostico',
        label: 'Diagnosticar área',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Guardar diagnóstico' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-areas-diagnosticadas',
        label: 'Áreas diagnosticadas',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empresa', label: 'Empresa' },
            { fieldId: 'area', label: 'Área' },
            { fieldId: 'puntuacion', label: 'Punt.' },
            { fieldId: 'prioridad', label: 'Prioridad' },
            { fieldId: 'fecha', label: 'Fecha' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
