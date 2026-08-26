import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const purchaseRequest: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Compras',
    icon: '🛒',
    color: '#7C3AED',
    tags: ['compras', 'solicitud', 'aprobación', 'presupuesto', 'petición de compra'],
    keywords: ['solicitud de compra', 'petición de compra', 'purchase request', 'aprobación de compras', 'presupuesto compras', 'orden de compra', 'validación compras'],
    synonyms: ['petición de compra', 'purchase order request', 'orden de compra interna'],
    complexity: 'simple',
    estimatedMinutes: 5,
  },
  schema: {
    id: oid(53),
    slug: 'purchase-request',
    name: 'Solicitud de Compra',
    description: 'Gestiona las solicitudes de compra de tu equipo con flujo de aprobación configurable. Los empleados envían peticiones y los responsables aprueban, rechazan o ponen en espera.',
    category: 'operations',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un asistente de gestión de compras. Cuando el usuario describa lo que necesita comprar, ayúdale a completar una solicitud de compra clara y justificada: que incluya descripción precisa del artículo o servicio, su propósito y beneficio para la empresa, el importe estimado con comparativa de precios si es posible, el proveedor sugerido y alternativas, y la urgencia con impacto si no se aprueba.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        solicitante:    { type: 'string',   label: 'Solicitante',              required: true,  placeholder: 'Nombre del empleado que solicita' },
        departamento:   { type: 'string',   label: 'Departamento / Área',      required: false, placeholder: 'Ej: Marketing, IT, Operaciones' },
        descripcion:    { type: 'textarea', label: 'Descripción del artículo o servicio', required: true, rows: 3, placeholder: 'Describe qué necesitas y para qué' },
        justificacion:  { type: 'textarea', label: 'Justificación del gasto',  required: true,  rows: 2, placeholder: '¿Por qué es necesaria esta compra?' },
        importe:        { type: 'number',   label: 'Importe estimado (€)',     required: true,  min: 0 },
        proveedor:      { type: 'string',   label: 'Proveedor sugerido',       required: false, placeholder: 'Nombre del proveedor o URL' },
        urgencia:       { type: 'select',   label: 'Urgencia',                 required: true,  options: ['Baja — puede esperar', 'Media — esta semana', 'Alta — urgente'] },
        fecha_necesaria:{ type: 'date',     label: 'Fecha en que se necesita', required: false },
        centro_coste:   { type: 'string',   label: 'Centro de coste / Proyecto', required: false, placeholder: 'Código o nombre del proyecto' },
        notas:          { type: 'textarea', label: 'Notas adicionales',        required: false, rows: 2 },
      },
    },
    capabilities: [
      {
        type: 'APPROVAL_FLOW',
        instanceId: 'approval-solicitud-compra',
        label: 'Nueva solicitud',
        isDefault: true,
        config: {
          submitterRoles:            ['OWNER', 'ADMIN', 'EDITOR', 'MEMBER', 'OPERATOR'],
          approverRoles:             ['OWNER', 'ADMIN'],
          requireCommentOnRejection: true,
          autoApproveAmountField:    'importe',
          autoApproveBelow:          100,
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-solicitudes-compra',
        label: 'Todas las solicitudes',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'solicitante',  label: 'Solicitante' },
            { fieldId: 'descripcion',  label: 'Descripción' },
            { fieldId: 'importe',      label: 'Importe (€)' },
            { fieldId: 'urgencia',     label: 'Urgencia' },
            { fieldId: 'proveedor',    label: 'Proveedor' },
          ],
          showCreateButton: false,
        },
      },
    ],
  },
}
