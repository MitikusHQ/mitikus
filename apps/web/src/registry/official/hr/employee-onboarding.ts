import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const employeeOnboarding: OfficialToolDefinition = {
  meta: {
    displayCategory: 'RRHH',
    icon: '👋',
    color: '#EC4899',
    tags: ['onboarding', 'incorporación', 'rrhh', 'nuevos empleados', 'bienvenida'],
    keywords: ['onboarding', 'incorporación empleado', 'acogida nuevos empleados', 'employee onboarding', 'proceso bienvenida', 'alta empleado', 'integración laboral'],
    synonyms: ['proceso de acogida', 'incorporación laboral', 'new employee onboarding'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(7),
    slug: 'employee-onboarding',
    name: 'Onboarding de Empleado',
    description: 'Herramienta para gestionar la incorporación de nuevos empleados. Registra tareas de bienvenida, entrega de materiales, accesos y formaciones iniciales.',
    category: 'hr',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        nombre: { type: 'string', label: 'Nombre del empleado', required: true },
        puesto: { type: 'string', label: 'Puesto / Cargo', required: true },
        departamento: { type: 'string', label: 'Departamento', required: true },
        fecha_incorporacion: { type: 'date', label: 'Fecha de incorporación', required: true },
        responsable_rrhh: { type: 'string', label: 'Responsable RRHH', required: true },
        tutor: { type: 'string', label: 'Tutor / Mentor asignado', required: false },
        estado: { type: 'select', label: 'Estado del proceso', required: true, options: ['Pendiente', 'En progreso', 'Completado'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-datos-empleado',
        label: 'Registrar empleado',
        isDefault: false,
        config: { layout: 'two-column', submitLabel: 'Iniciar onboarding' },
      },
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-onboarding',
        label: 'Checklist de incorporación',
        isDefault: true,
        config: {
          completionType: 'check',
          showProgress: true,
          categories: ['Documentación', 'Equipamiento', 'Accesos', 'Formación', 'Presentaciones'],
          items: [
            { id: 'contrato', label: 'Contrato laboral firmado', category: 'Documentación', required: true },
            { id: 'dni', label: 'Copia DNI/NIE entregada', category: 'Documentación' },
            { id: 'ss', label: 'Alta en Seguridad Social', category: 'Documentación', required: true },
            { id: 'portatil', label: 'Equipo informático entregado', category: 'Equipamiento', required: true },
            { id: 'movil', label: 'Teléfono móvil corporativo (si aplica)', category: 'Equipamiento' },
            { id: 'email', label: 'Correo corporativo creado', category: 'Accesos', required: true },
            { id: 'vpn', label: 'Acceso VPN configurado', category: 'Accesos' },
            { id: 'sistemas', label: 'Acceso a sistemas internos', category: 'Accesos', required: true },
            { id: 'politicas', label: 'Políticas internas revisadas', category: 'Formación', required: true },
            { id: 'prevencion', label: 'Formación PRL completada', category: 'Formación', required: true },
            { id: 'equipo', label: 'Presentación al equipo realizada', category: 'Presentaciones' },
            { id: 'direccion', label: 'Reunión con dirección', category: 'Presentaciones' },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-incorporaciones',
        label: 'Registro de incorporaciones',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'nombre', label: 'Empleado' },
            { fieldId: 'puesto', label: 'Puesto' },
            { fieldId: 'departamento', label: 'Departamento' },
            { fieldId: 'fecha_incorporacion', label: 'Incorporación' },
            { fieldId: 'estado', label: 'Estado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
