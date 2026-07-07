import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const correctiveAction: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Calidad',
    icon: '🔧',
    color: '#F97316',
    tags: ['acción correctiva', 'calidad', 'ac', 'mejora', 'corrección'],
    keywords: ['acción correctiva', 'corrective action', 'plan de corrección', 'causa raíz', 'root cause', '5 por qués', 'mejora continua', 'ac', 'car'],
    synonyms: ['plan de acción correctiva', 'corrective action plan', 'CAR'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(14),
    slug: 'corrective-action',
    name: 'Acciones Correctivas',
    description: 'Herramienta para gestionar acciones correctivas ante no conformidades y problemas detectados. Analiza causa raíz y hace seguimiento hasta el cierre.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        referencia: { type: 'string', label: 'Referencia AC', required: true, placeholder: 'AC-2026-001' },
        origen: { type: 'string', label: 'NC / Problema de origen', required: true },
        descripcion_problema: { type: 'textarea', label: 'Descripción del problema', required: true },
        causa_raiz: { type: 'textarea', label: 'Causa raíz identificada', required: false },
        accion_propuesta: { type: 'textarea', label: 'Acción correctiva propuesta', required: true },
        responsable: { type: 'string', label: 'Responsable', required: true },
        fecha_inicio: { type: 'date', label: 'Fecha de inicio', required: true },
        fecha_objetivo: { type: 'date', label: 'Fecha objetivo de cierre', required: true },
        eficacia: { type: 'select', label: 'Verificación de eficacia', required: false, options: ['Pendiente', 'Eficaz', 'No eficaz', 'Parcialmente eficaz'] },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Abierta', 'En curso', 'Completada', 'Verificada', 'Cerrada'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-accion-correctiva',
        label: 'Registrar acción correctiva',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Abrir acción correctiva' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-acciones-correctivas',
        label: 'Registro de ACs',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'referencia', label: 'Referencia' },
            { fieldId: 'origen', label: 'Origen' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha_objetivo', label: 'Fecha objetivo' },
            { fieldId: 'eficacia', label: 'Eficacia' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
