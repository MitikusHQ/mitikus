import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const expenseControl: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Administración',
    icon: '💳',
    color: '#15803D',
    tags: ['gastos', 'administración', 'notas de gasto', 'contabilidad', 'finanzas'],
    keywords: ['control gastos', 'notas de gasto', 'expense management', 'gastos empleados', 'reembolso gastos', 'viajes negocio', 'expense report'],
    synonyms: ['notas de gastos', 'expense report', 'control de gastos'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(48),
    slug: 'expense-control',
    name: 'Control de Gastos',
    description: 'Herramienta para registrar y gestionar gastos de empresa y notas de gasto de empleados. Categoriza gastos, controla presupuestos y gestiona el proceso de aprobación.',
    category: 'finance',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        solicitante: { type: 'string', label: 'Empleado / Solicitante', required: true },
        fecha: { type: 'date', label: 'Fecha del gasto', required: true },
        concepto: { type: 'string', label: 'Concepto', required: true, placeholder: 'Ej: Comida con cliente, Gasolina viaje Madrid' },
        categoria: { type: 'select', label: 'Categoría', required: true, options: ['Transporte', 'Alojamiento', 'Manutención', 'Representación', 'Material de oficina', 'Formación', 'Telefonía', 'Otro'] },
        importe: { type: 'number', label: 'Importe (€)', required: true, min: 0 },
        iva: { type: 'select', label: 'IVA', required: false, options: ['0%', '4%', '10%', '21%', 'Sin IVA'] },
        justificante: { type: 'boolean', label: '¿Justificante adjunto?', required: false },
        aprobador: { type: 'string', label: 'Aprobador', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Pendiente aprobación', 'Aprobado', 'Rechazado', 'Reembolsado'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-gasto',
        label: 'Registrar gasto',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir gasto' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-gastos',
        label: 'Registro de gastos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'solicitante', label: 'Empleado' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'concepto', label: 'Concepto' },
            { fieldId: 'categoria', label: 'Categoría' },
            { fieldId: 'importe', label: 'Importe (€)' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          defaultSortField: 'fecha',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
    ],
  },
}
