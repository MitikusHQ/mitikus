import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const productionChecklist: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Calidad',
    icon: '🏭',
    color: '#0284C7',
    tags: ['producción', 'checklist', 'operaciones', 'fábrica', 'control'],
    keywords: ['checklist producción', 'control producción', 'production checklist', 'línea producción', 'arranque producción', 'turno producción'],
    synonyms: ['lista verificación producción', 'control de turno', 'shift checklist'],
    complexity: 'simple',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(16),
    slug: 'production-checklist',
    name: 'Checklist de Producción',
    description: 'Herramienta para verificar condiciones de producción al inicio y final de turno. Garantiza el cumplimiento de estándares operativos y de seguridad.',
    category: 'checklist',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        linea: { type: 'string', label: 'Línea / Área de producción', required: true },
        operario: { type: 'string', label: 'Operario responsable', required: true },
        turno: { type: 'select', label: 'Turno', required: true, options: ['Mañana', 'Tarde', 'Noche'] },
        fecha: { type: 'date', label: 'Fecha', required: true },
        observaciones: { type: 'textarea', label: 'Observaciones / Incidencias', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-produccion',
        label: 'Verificación de turno',
        isDefault: true,
        config: {
          completionType: 'yes_no',
          showProgress: true,
          categories: ['Equipamiento', 'Seguridad', 'Calidad', 'Limpieza', 'Documentación'],
          items: [
            { id: 'maquinaria_ok', label: 'Maquinaria en correcto estado', category: 'Equipamiento', required: true },
            { id: 'utillaje', label: 'Utillaje y herramientas disponibles', category: 'Equipamiento' },
            { id: 'materia_prima', label: 'Materia prima verificada y conforme', category: 'Equipamiento', required: true },
            { id: 'epi', label: 'EPIs utilizados correctamente', category: 'Seguridad', required: true },
            { id: 'vias_evacuacion', label: 'Vías de evacuación libres', category: 'Seguridad', required: true },
            { id: 'extintores', label: 'Extintores accesibles', category: 'Seguridad' },
            { id: 'muestra', label: 'Muestra inicial conforme', category: 'Calidad', required: true },
            { id: 'parametros', label: 'Parámetros de proceso dentro de rango', category: 'Calidad', required: true },
            { id: 'zona_limpia', label: 'Zona de trabajo limpia y ordenada', category: 'Limpieza', required: true },
            { id: 'residuos', label: 'Gestión de residuos correcta', category: 'Limpieza' },
            { id: 'parte_trabajo', label: 'Parte de trabajo completado', category: 'Documentación' },
            { id: 'incidencias', label: 'Incidencias registradas (si las hay)', category: 'Documentación' },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-verificaciones-turno',
        label: 'Historial de turnos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'linea', label: 'Línea' },
            { fieldId: 'operario', label: 'Operario' },
            { fieldId: 'turno', label: 'Turno' },
            { fieldId: 'fecha', label: 'Fecha' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
