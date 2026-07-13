import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const prlChecklist: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Seguridad',
    icon: '⛑️',
    color: '#DC2626',
    tags: ['prl', 'prevención', 'riesgos laborales', 'seguridad', 'salud laboral'],
    keywords: ['prl', 'prevención riesgos laborales', 'seguridad laboral', 'inspección seguridad', 'risk assessment', 'health safety', 'lprl', 'evaluación riesgos'],
    synonyms: ['seguridad y salud laboral', 'ohse', 'inspección prl'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(38),
    slug: 'prl-checklist',
    name: 'Checklist PRL — Prevención de Riesgos',
    description: 'Herramienta para verificar el cumplimiento de medidas de prevención de riesgos laborales. Incluye inspección de equipos, EPIs, señalización y condiciones del puesto.',
    category: 'checklist',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un tecnico de prevencion de riesgos laborales especializado en auditorias de seguridad para empresas de servicios IT y oficinas. Genera un informe del checklist PRL con: evaluacion de cada punto revisado con nivel de conformidad, riesgos laborales identificados con evaluacion (probabilidad x gravedad = nivel de riesgo), medidas preventivas o correctivas con referencia normativa (Ley 31/1995, RDs aplicables), priorizacion de actuaciones segun nivel de riesgo, y resumen ejecutivo para el Comite de Seguridad y Salud. El informe es documentacion valida para el sistema de gestion PRL.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        area: { type: 'string', label: 'Área / Centro de trabajo', required: true },
        inspector: { type: 'string', label: 'Inspector PRL', required: true },
        fecha: { type: 'date', label: 'Fecha de inspección', required: true },
        incidencias: { type: 'textarea', label: 'Incidencias detectadas', required: false },
        acciones_inmediatas: { type: 'textarea', label: 'Acciones inmediatas tomadas', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-prl',
        label: 'Inspección PRL',
        isDefault: true,
        config: {
          completionType: 'yes_no',
          showProgress: true,
          categories: ['Orden y limpieza', 'EPI', 'Señalización', 'Emergencias', 'Maquinaria', 'Ergonomía'],
          items: [
            { id: 'orden', label: 'Zona de trabajo ordenada y limpia', category: 'Orden y limpieza', required: true },
            { id: 'pasillos', label: 'Pasillos libres de obstáculos', category: 'Orden y limpieza', required: true },
            { id: 'residuos', label: 'Contenedores de residuos adecuados y vaciados', category: 'Orden y limpieza' },
            { id: 'epi_disponible', label: 'EPIs necesarios disponibles y en buen estado', category: 'EPI', required: true },
            { id: 'epi_uso', label: 'Trabajadores utilizan EPIs correctamente', category: 'EPI', required: true },
            { id: 'senalizacion', label: 'Señalización de seguridad visible y correcta', category: 'Señalización', required: true },
            { id: 'prohibicion', label: 'Señales de prohibición correctamente colocadas', category: 'Señalización' },
            { id: 'extintor', label: 'Extintores accesibles y con revisión vigente', category: 'Emergencias', required: true },
            { id: 'botiquin', label: 'Botiquín completo y accesible', category: 'Emergencias', required: true },
            { id: 'salida_emergencia', label: 'Salidas de emergencia libres y señalizadas', category: 'Emergencias', required: true },
            { id: 'maquinaria_estado', label: 'Maquinaria en correcto estado y con protecciones', category: 'Maquinaria' },
            { id: 'mantenimiento', label: 'Revisiones de mantenimiento al día', category: 'Maquinaria' },
            { id: 'pantallas', label: 'Pantallas de visualización a distancia adecuada', category: 'Ergonomía' },
            { id: 'sillas', label: 'Mobiliario ergonómico adecuado', category: 'Ergonomía' },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-inspecciones-prl',
        label: 'Historial de inspecciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'area', label: 'Área' },
            { fieldId: 'inspector', label: 'Inspector' },
            { fieldId: 'fecha', label: 'Fecha' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
