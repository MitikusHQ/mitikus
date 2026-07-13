import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const employeeOffboarding: OfficialToolDefinition = {
  meta: {
    displayCategory: 'RRHH',
    icon: '🚪',
    color: '#6B7280',
    tags: ['offboarding', 'baja', 'rrhh', 'desvinculación', 'salida'],
    keywords: ['offboarding', 'baja empleado', 'desvinculación', 'employee offboarding', 'salida empresa', 'cese laboral', 'finiquito'],
    synonyms: ['proceso de baja', 'salida laboral', 'employee exit process'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(8),
    slug: 'employee-offboarding',
    name: 'Offboarding de Empleado',
    description: 'Herramienta para gestionar la salida de empleados de forma ordenada. Controla devolución de materiales, revocación de accesos, entrega de documentación y liquidación.',
    category: 'hr',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de RRHH especializado en gestion de salidas en empresas IT. Genera un informe de offboarding con: checklist de tareas completadas y pendientes (accesos, equipos, documentacion, traspaso de conocimiento), analisis de motivos de salida de la entrevista de salida, conocimiento critico que debe transferirse urgentemente, impacto en proyectos activos y plan de cobertura, y recomendaciones para evitar que la situacion se repita.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre: { type: 'string', label: 'Nombre del empleado', required: true },
        puesto: { type: 'string', label: 'Puesto / Cargo', required: true },
        departamento: { type: 'string', label: 'Departamento', required: true },
        fecha_baja: { type: 'date', label: 'Fecha de baja', required: true },
        motivo: { type: 'select', label: 'Motivo de baja', required: true, options: ['Renuncia voluntaria', 'Despido', 'Fin de contrato', 'Jubilación', 'Mutuo acuerdo', 'ERE/ERTE'] },
        responsable_rrhh: { type: 'string', label: 'Responsable RRHH', required: true },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Iniciado', 'En proceso', 'Completado'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-offboarding',
        label: 'Checklist de salida',
        isDefault: true,
        config: {
          completionType: 'check',
          showProgress: true,
          categories: ['Documentación', 'Accesos', 'Equipamiento', 'Administrativo'],
          items: [
            { id: 'carta_baja', label: 'Carta de baja / preaviso recibida', category: 'Documentación', required: true },
            { id: 'entrevista', label: 'Entrevista de salida realizada', category: 'Documentación' },
            { id: 'email_revocado', label: 'Correo corporativo desactivado', category: 'Accesos', required: true },
            { id: 'sistemas_revocados', label: 'Accesos a sistemas revocados', category: 'Accesos', required: true },
            { id: 'vpn_revocada', label: 'Acceso VPN eliminado', category: 'Accesos', required: true },
            { id: 'portatil', label: 'Portátil devuelto', category: 'Equipamiento' },
            { id: 'movil', label: 'Teléfono móvil devuelto', category: 'Equipamiento' },
            { id: 'tarjeta', label: 'Tarjeta de acceso devuelta', category: 'Equipamiento' },
            { id: 'finiquito', label: 'Finiquito calculado y entregado', category: 'Administrativo', required: true },
            { id: 'ss_baja', label: 'Baja en Seguridad Social tramitada', category: 'Administrativo', required: true },
            { id: 'certificado', label: 'Certificado empresa emitido', category: 'Administrativo' },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-bajas',
        label: 'Registro de bajas',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre', label: 'Empleado' },
            { fieldId: 'puesto', label: 'Puesto' },
            { fieldId: 'fecha_baja', label: 'Fecha baja' },
            { fieldId: 'motivo', label: 'Motivo' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
