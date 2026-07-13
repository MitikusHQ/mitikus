import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const discoverySession: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Ventas',
    icon: '🔎',
    color: '#6D28D9',
    tags: ['discovery', 'cualificación', 'necesidades', 'cliente', 'ventas'],
    keywords: ['discovery', 'sesión discovery', 'cualificación lead', 'necesidades cliente', 'bant', 'meddic', 'sales discovery', 'customer needs analysis'],
    synonyms: ['reunión de discovery', 'cualificación comercial', 'needs analysis'],
    complexity: 'intermediate',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(25),
    slug: 'discovery-session',
    name: 'Sesión de Discovery / Cualificación',
    description: 'Herramienta para estructurar sesiones de discovery con prospectos. Recoge necesidades, presupuesto, plazo de decisión y criterios de compra para cualificar la oportunidad.',
    category: 'crm',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de preventa especializado en consultoria IT para pymes y empresas medianas. Genera un informe de sesion de discovery con: resumen de problemas y necesidades identificados por el cliente (en sus propias palabras), analisis de la situacion actual y el dolor principal del cliente, hipotesis de solucion y servicios IT que mejor encajan, informacion adicional necesaria para elaborar propuesta, proximos pasos acordados con fechas, y puntuacion interna de oportunidad (1-10) con justificacion. El informe fundamenta la propuesta comercial.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        empresa: { type: 'string', label: 'Empresa / Prospecto', required: true },
        decisor: { type: 'string', label: 'Decisor / Contacto principal', required: true },
        comercial: { type: 'string', label: 'Comercial', required: true },
        fecha: { type: 'date', label: 'Fecha de sesión', required: true },
        problema_principal: { type: 'textarea', label: 'Problema / Dolor principal', required: true },
        presupuesto: { type: 'select', label: 'Presupuesto disponible', required: false, options: ['Confirmado', 'Estimado', 'Por definir', 'Sin presupuesto'] },
        plazo_decision: { type: 'select', label: 'Plazo de decisión', required: false, options: ['Inmediato (<1 mes)', 'Corto (1-3 meses)', 'Medio (3-6 meses)', 'Largo (>6 meses)', 'Sin plazo definido'] },
        nivel_cualificacion: { type: 'select', label: 'Nivel de cualificación', required: true, options: ['Alta prioridad', 'Media prioridad', 'Baja prioridad', 'Descartado'] },
        proximos_pasos: { type: 'textarea', label: 'Próximos pasos acordados', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-discovery',
        label: 'Registrar discovery',
        isDefault: true,
        config: { layout: 'single-column', submitLabel: 'Guardar sesión' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-discovery',
        label: 'Sesiones de discovery',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'empresa', label: 'Empresa' },
            { fieldId: 'decisor', label: 'Decisor' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'presupuesto', label: 'Presupuesto' },
            { fieldId: 'plazo_decision', label: 'Plazo' },
            { fieldId: 'nivel_cualificacion', label: 'Cualificación' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
