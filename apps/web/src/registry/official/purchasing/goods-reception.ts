import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const goodsReception: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Compras',
    icon: '📦',
    color: '#92400E',
    tags: ['recepción', 'mercancía', 'almacén', 'albarán', 'compras'],
    keywords: ['recepción mercancía', 'goods reception', 'albarán', 'entrega proveedor', 'control recepción', 'inspección entrada', 'warehouse'],
    synonyms: ['control de recepción', 'recepción de pedido', 'delivery inspection'],
    complexity: 'simple',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(20),
    slug: 'goods-reception',
    name: 'Recepción de Mercancía',
    description: 'Herramienta para registrar y verificar la recepción de mercancías y pedidos de proveedores. Controla albaranes, cantidades, calidad y estado del envío.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        numero_albaran: { type: 'string', label: 'Número de albarán', required: true },
        proveedor: { type: 'string', label: 'Proveedor', required: true },
        numero_pedido: { type: 'string', label: 'Número de pedido', required: false },
        fecha_recepcion: { type: 'date', label: 'Fecha de recepción', required: true },
        receptor: { type: 'string', label: 'Receptor responsable', required: true },
        cantidad_pedida: { type: 'number', label: 'Cantidad pedida', required: false, min: 0 },
        cantidad_recibida: { type: 'number', label: 'Cantidad recibida', required: true, min: 0 },
        estado_mercancia: { type: 'select', label: 'Estado de la mercancía', required: true, options: ['Conforme', 'Conforme con observaciones', 'Con daños', 'Rechazada'] },
        observaciones: { type: 'textarea', label: 'Observaciones / Incidencias', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-recepcion',
        label: 'Registrar recepción',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Confirmar recepción' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-recepciones',
        label: 'Historial de recepciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'numero_albaran', label: 'Albarán' },
            { fieldId: 'proveedor', label: 'Proveedor' },
            { fieldId: 'fecha_recepcion', label: 'Fecha' },
            { fieldId: 'cantidad_recibida', label: 'Cantidad' },
            { fieldId: 'estado_mercancia', label: 'Estado' },
          ],
          defaultSortField: 'fecha_recepcion',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
    ],
  },
}
