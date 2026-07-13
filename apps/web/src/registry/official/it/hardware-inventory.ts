import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const hardwareInventory: OfficialToolDefinition = {
  meta: {
    displayCategory: 'IT',
    icon: '💻',
    color: '#475569',
    tags: ['hardware', 'inventario', 'activos ti', 'equipos', 'it'],
    keywords: ['inventario hardware', 'hardware inventory', 'activos ti', 'gestión equipos', 'asset management', 'portátiles', 'servidores', 'dispositivos'],
    synonyms: ['inventario de equipos', 'it asset management', 'hardware asset tracking'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(42),
    slug: 'hardware-inventory',
    name: 'Inventario de Hardware',
    description: 'Herramienta para gestionar el inventario de activos hardware de la organización. Registra equipos, asignaciones, garantías y estado de todos los dispositivos IT.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor IT especializado en gestión de activos tecnológicos para pymes. Genera un análisis del inventario de hardware con: estado del activo analizado, evaluación de obsolescencia y riesgo (end-of-life, sin soporte, vulnerabilidades conocidas), impacto en la continuidad del negocio si falla, recomendación de acción (sustituir, renovar contrato de soporte, monitorizar), y estimación de coste aproximado si procede. Útil para el presupuesto anual IT del cliente.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre_equipo: { type: 'string', label: 'Nombre / Identificador del equipo', required: true },
        tipo: { type: 'select', label: 'Tipo de equipo', required: true, options: ['Portátil', 'Ordenador de sobremesa', 'Servidor', 'Monitor', 'Impresora', 'Switch/Router', 'Teléfono IP', 'Tablet', 'Smartphone', 'Otro'] },
        marca: { type: 'string', label: 'Marca', required: false },
        modelo: { type: 'string', label: 'Modelo', required: false },
        numero_serie: { type: 'string', label: 'Número de serie', required: false },
        usuario_asignado: { type: 'string', label: 'Usuario asignado', required: false },
        departamento: { type: 'string', label: 'Departamento', required: false },
        fecha_compra: { type: 'date', label: 'Fecha de compra', required: false },
        fin_garantia: { type: 'date', label: 'Fin de garantía', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Activo', 'Almacenado', 'En reparación', 'Baja', 'Robado/Perdido'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-equipo-hardware',
        label: 'Registrar equipo',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Añadir equipo' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-hardware',
        label: 'Inventario de hardware',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre_equipo', label: 'Equipo' },
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'marca', label: 'Marca' },
            { fieldId: 'numero_serie', label: 'S/N' },
            { fieldId: 'usuario_asignado', label: 'Asignado a' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
