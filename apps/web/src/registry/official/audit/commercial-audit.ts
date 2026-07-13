import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const commercialAudit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '🏪',
    color: '#B45309',
    tags: ['comercial', 'ventas', 'auditoría', 'red comercial', 'distribución'],
    keywords: ['auditoría comercial', 'revisión ventas', 'auditoría red comercial', 'commercial audit', 'sales audit', 'puntos de venta', 'distribución'],
    synonyms: ['revisión comercial', 'auditoría de ventas', 'sales review'],
    complexity: 'intermediate',
    estimatedMinutes: 45,
  },
  schema: {
    id: oid(5),
    slug: 'commercial-audit',
    name: 'Auditoría Comercial',
    description: 'Herramienta para auditar la actividad y rendimiento de la red comercial. Evalúa puntos de venta, cumplimiento de procesos y estándares de calidad.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de negocio especializado en auditorias comerciales para empresas IT. Genera un informe de auditoria comercial con: analisis del area evaluada, KPIs comerciales clave y estado actual, brechas respecto a objetivos, causas raiz identificadas, y plan de accion con metricas de seguimiento. El informe debe servir al director comercial para tomar decisiones inmediatas.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        punto_venta: { type: 'string', label: 'Punto de venta / Sucursal', required: true },
        responsable: { type: 'string', label: 'Responsable comercial', required: true },
        auditor: { type: 'string', label: 'Auditor', required: true },
        fecha: { type: 'date', label: 'Fecha de visita', required: true },
        imagen_marca: { type: 'select', label: 'Imagen de marca', required: true, options: ['Excelente', 'Buena', 'Regular', 'Deficiente'] },
        stock: { type: 'select', label: 'Gestión de stock', required: true, options: ['Correcto', 'Con incidencias', 'Incorrecto'] },
        atencion_cliente: { type: 'select', label: 'Atención al cliente', required: true, options: ['Excelente', 'Buena', 'Regular', 'Deficiente'] },
        puntuacion: { type: 'number', label: 'Puntuación global (0-10)', required: false, min: 0, max: 10 },
        observaciones: { type: 'textarea', label: 'Observaciones y acciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-auditoria-comercial',
        label: 'Registrar visita',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar auditoría' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-auditorias-comerciales',
        label: 'Historial de auditorías',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'punto_venta', label: 'Punto de venta' },
            { fieldId: 'responsable', label: 'Responsable' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'imagen_marca', label: 'Imagen' },
            { fieldId: 'puntuacion', label: 'Punt.' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
