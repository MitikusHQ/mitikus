import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const assetInventory: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Administración',
    icon: '🏷️',
    color: '#92400E',
    tags: ['activos', 'inventario', 'bienes', 'administración', 'patrimonio'],
    keywords: ['inventario activos', 'asset inventory', 'bienes empresa', 'patrimonio empresa', 'inmovilizado', 'amortización', 'fixed assets'],
    synonyms: ['inventario de bienes', 'fixed asset register', 'registro de activos'],
    complexity: 'simple',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(49),
    slug: 'asset-inventory',
    name: 'Inventario de Activos',
    description: 'Herramienta para registrar y gestionar el inventario de activos de la empresa. Controla bienes, ubicaciones, responsables, valor y estado de todo el patrimonio.',
    category: 'finance',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        codigo_activo: { type: 'string', label: 'Código de activo', required: true, placeholder: 'ACT-001' },
        descripcion: { type: 'string', label: 'Descripción del activo', required: true },
        categoria: { type: 'select', label: 'Categoría', required: true, options: ['Maquinaria y equipo', 'Mobiliario', 'Vehículos', 'Informática', 'Instalaciones', 'Inmuebles', 'Otro'] },
        ubicacion: { type: 'string', label: 'Ubicación', required: false },
        responsable: { type: 'string', label: 'Responsable', required: false },
        fecha_adquisicion: { type: 'date', label: 'Fecha de adquisición', required: false },
        valor_adquisicion: { type: 'number', label: 'Valor de adquisición (€)', required: false, min: 0 },
        estado: { type: 'select', label: 'Estado', required: true, options: ['En uso', 'Almacenado', 'En reparación', 'Baja', 'Vendido'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-activo',
        label: 'Registrar activo',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir activo' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-activos',
        label: 'Inventario de activos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'codigo_activo', label: 'Código' },
            { fieldId: 'descripcion', label: 'Descripción' },
            { fieldId: 'categoria', label: 'Categoría' },
            { fieldId: 'ubicacion', label: 'Ubicación' },
            { fieldId: 'valor_adquisicion', label: 'Valor (€)' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
