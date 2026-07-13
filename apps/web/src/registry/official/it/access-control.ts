import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const accessControl: OfficialToolDefinition = {
  meta: {
    displayCategory: 'IT',
    icon: '🔑',
    color: '#7C3AED',
    tags: ['accesos', 'permisos', 'usuarios', 'seguridad', 'it'],
    keywords: ['control accesos', 'access control', 'gestión accesos', 'permisos usuarios', 'iam', 'identity management', 'alta baja usuarios', 'privilegios'],
    synonyms: ['gestión de accesos', 'user access management', 'identity and access management'],
    complexity: 'simple',
    estimatedMinutes: 10,
  },
  schema: {
    id: oid(47),
    slug: 'access-control',
    name: 'Control de Accesos IT',
    description: 'Herramienta para gestionar solicitudes de alta, baja y modificación de accesos a sistemas. Registra aprobaciones y mantiene un historial de cambios de permisos.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un especialista en seguridad IT de una consultora que gestiona el control de accesos de clientes empresariales. Genera un informe de control de accesos con: estado actual del acceso o usuario analizado, evaluación de riesgo (privilegios excesivos, cuentas huérfanas, cumplimiento de política), recomendación de acción inmediata (revocar, modificar, revisar), y justificación basada en principio de mínimo privilegio. Formato listo para incluir en un informe de auditoría de seguridad.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        usuario: { type: 'string', label: 'Usuario / Empleado', required: true },
        sistema: { type: 'string', label: 'Sistema / Aplicación', required: true },
        tipo_solicitud: { type: 'select', label: 'Tipo de solicitud', required: true, options: ['Alta de acceso', 'Baja de acceso', 'Modificación de permisos', 'Reset de contraseña', 'Revisión de accesos'] },
        nivel_acceso: { type: 'select', label: 'Nivel de acceso', required: false, options: ['Solo lectura', 'Edición', 'Administrador', 'Superusuario'] },
        solicitante: { type: 'string', label: 'Solicitante / Manager', required: true },
        fecha_solicitud: { type: 'date', label: 'Fecha de solicitud', required: true },
        aprobado: { type: 'boolean', label: '¿Solicitud aprobada?', required: false },
        tecnico: { type: 'string', label: 'Técnico responsable', required: false },
        estado: { type: 'select', label: 'Estado', required: true, options: ['Pendiente', 'Aprobado', 'En proceso', 'Completado', 'Rechazado'] },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-acceso',
        label: 'Solicitar acceso',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Enviar solicitud' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-accesos',
        label: 'Registro de accesos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'usuario', label: 'Usuario' },
            { fieldId: 'sistema', label: 'Sistema' },
            { fieldId: 'tipo_solicitud', label: 'Solicitud' },
            { fieldId: 'fecha_solicitud', label: 'Fecha' },
            { fieldId: 'aprobado', label: 'Aprobado' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
