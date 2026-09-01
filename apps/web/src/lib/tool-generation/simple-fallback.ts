import { validateToolSchema } from '@protools/schema'
import type { ValidatedToolSchema } from '@protools/schema'

export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'herramienta-simple'
  )
}

type RawField = {
  type: string
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]
  min?: number
  rows?: number
}

type RawColumn = { fieldId: string; sortable: boolean }
type RawSection = { id: string; title: string; fieldIds: string[] }

interface FallbackTemplate {
  name: string
  description: string
  category: string
  fields: Record<string, RawField>
  tableColumns: RawColumn[]
  formSections: RawSection[]
}

function detectPattern(prompt: string): 'clientDocs' | 'crm' | 'hr' | 'generic' {
  const lower = prompt.toLowerCase()
  if (lower.includes('cliente') && (lower.includes('documento') || lower.includes('fichero'))) {
    return 'clientDocs'
  }
  if (lower.includes('empleado') || lower.includes('empleados') || lower.includes('rrhh') || lower.includes('personal')) {
    return 'hr'
  }
  if (lower.includes('cliente') || lower.includes('contacto') || lower.includes('lead')) {
    return 'crm'
  }
  return 'generic'
}

function getTemplate(pattern: ReturnType<typeof detectPattern>): FallbackTemplate {
  switch (pattern) {
    case 'clientDocs':
      return {
        name: 'Gestor de documentos por cliente',
        description:
          'Organiza documentos por cliente, fecha y tamaño, con estado y recordatorios de llamada.',
        category: 'crm',
        fields: {
          cliente: { type: 'string', label: 'Cliente', required: true, placeholder: 'Nombre del cliente' },
          documento: { type: 'string', label: 'Documento', required: true, placeholder: 'Nombre del documento o fichero' },
          categoria: { type: 'select', label: 'Categoría', options: ['Contrato', 'Factura', 'Presupuesto', 'Informe', 'Otro'] },
          fecha_documento: { type: 'date', label: 'Fecha del documento', required: true },
          tamano_fichero: { type: 'number', label: 'Tamaño (MB)', min: 0 },
          estado: { type: 'select', label: 'Estado', options: ['Pendiente', 'En revisión', 'Aprobado', 'Archivado'], required: true },
          responsable: { type: 'string', label: 'Responsable', placeholder: 'Nombre del responsable' },
          recordatorio_llamada: { type: 'date', label: 'Recordatorio de llamada' },
          notas: { type: 'textarea', label: 'Notas', rows: 3 },
        },
        tableColumns: [
          { fieldId: 'cliente', sortable: true },
          { fieldId: 'documento', sortable: true },
          { fieldId: 'fecha_documento', sortable: true },
          { fieldId: 'tamano_fichero', sortable: true },
          { fieldId: 'estado', sortable: false },
        ],
        formSections: [
          { id: 'documento', title: 'Documento', fieldIds: ['cliente', 'documento', 'categoria', 'fecha_documento', 'tamano_fichero'] },
          { id: 'seguimiento', title: 'Seguimiento', fieldIds: ['estado', 'responsable', 'recordatorio_llamada', 'notas'] },
        ],
      }

    case 'crm':
      return {
        name: 'Seguimiento de clientes',
        description:
          'Registra y gestiona el estado de clientes o contactos comerciales con historial de interacciones.',
        category: 'crm',
        fields: {
          empresa: { type: 'string', label: 'Empresa', required: true, placeholder: 'Nombre de la empresa' },
          contacto: { type: 'string', label: 'Contacto', required: true, placeholder: 'Nombre del contacto' },
          email: { type: 'email', label: 'Email' },
          telefono: { type: 'phone', label: 'Teléfono' },
          estado: { type: 'select', label: 'Estado', options: ['Lead', 'Propuesta enviada', 'Negociación', 'Cliente activo', 'Inactivo'], required: true },
          fecha_contacto: { type: 'date', label: 'Último contacto' },
          responsable: { type: 'string', label: 'Responsable' },
          notas: { type: 'textarea', label: 'Notas', rows: 3 },
        },
        tableColumns: [
          { fieldId: 'empresa', sortable: true },
          { fieldId: 'contacto', sortable: true },
          { fieldId: 'estado', sortable: false },
          { fieldId: 'fecha_contacto', sortable: true },
          { fieldId: 'responsable', sortable: true },
        ],
        formSections: [
          { id: 'contacto', title: 'Datos de contacto', fieldIds: ['empresa', 'contacto', 'email', 'telefono'] },
          { id: 'seguimiento', title: 'Seguimiento', fieldIds: ['estado', 'fecha_contacto', 'responsable', 'notas'] },
        ],
      }

    case 'hr':
      return {
        name: 'Registro de empleados',
        description:
          'Gestiona la información básica de empleados, su departamento, estado y fecha de incorporación.',
        category: 'hr',
        fields: {
          nombre: { type: 'string', label: 'Nombre completo', required: true },
          departamento: { type: 'select', label: 'Departamento', options: ['Dirección', 'Comercial', 'Operaciones', 'RRHH', 'Tecnología', 'Otro'] },
          cargo: { type: 'string', label: 'Cargo' },
          email: { type: 'email', label: 'Email corporativo' },
          fecha_inicio: { type: 'date', label: 'Fecha de incorporación', required: true },
          estado: { type: 'select', label: 'Estado', options: ['Activo', 'Baja temporal', 'Baja definitiva'], required: true },
          notas: { type: 'textarea', label: 'Notas', rows: 3 },
        },
        tableColumns: [
          { fieldId: 'nombre', sortable: true },
          { fieldId: 'departamento', sortable: true },
          { fieldId: 'cargo', sortable: true },
          { fieldId: 'fecha_inicio', sortable: true },
          { fieldId: 'estado', sortable: false },
        ],
        formSections: [
          { id: 'datos', title: 'Datos personales', fieldIds: ['nombre', 'email', 'cargo', 'departamento'] },
          { id: 'situacion', title: 'Situación laboral', fieldIds: ['fecha_inicio', 'estado', 'notas'] },
        ],
      }

    case 'generic':
    default:
      return {
        name: 'Herramienta simple de seguimiento',
        description:
          'Registra, ordena y da seguimiento a la información principal solicitada por el usuario.',
        category: 'custom',
        fields: {
          titulo: { type: 'string', label: 'Título', required: true, placeholder: 'Nombre del registro' },
          descripcion: { type: 'textarea', label: 'Descripción', rows: 3 },
          estado: { type: 'select', label: 'Estado', options: ['Pendiente', 'En progreso', 'Completado', 'Cancelado'], required: true },
          fecha: { type: 'date', label: 'Fecha', required: true },
          responsable: { type: 'string', label: 'Responsable' },
          prioridad: { type: 'select', label: 'Prioridad', options: ['Alta', 'Media', 'Baja'] },
          notas: { type: 'textarea', label: 'Notas', rows: 2 },
        },
        tableColumns: [
          { fieldId: 'titulo', sortable: true },
          { fieldId: 'estado', sortable: false },
          { fieldId: 'fecha', sortable: true },
          { fieldId: 'responsable', sortable: true },
          { fieldId: 'prioridad', sortable: false },
        ],
        formSections: [
          { id: 'principal', title: 'Información principal', fieldIds: ['titulo', 'descripcion', 'prioridad'] },
          { id: 'seguimiento', title: 'Seguimiento', fieldIds: ['estado', 'fecha', 'responsable', 'notas'] },
        ],
      }
  }
}

function resolveDefaultSortField(columns: RawColumn[]): string {
  return (
    columns.find((c) => c.fieldId.startsWith('fecha'))?.fieldId ??
    columns[0]!.fieldId
  )
}

export function buildSimpleFallbackSchema(prompt: string): ValidatedToolSchema {
  const pattern = detectPattern(prompt)
  const tpl = getTemplate(pattern)

  const raw = {
    id: crypto.randomUUID(),
    slug: slugify(tpl.name),
    name: tpl.name,
    description: tpl.description,
    category: tpl.category,
    capabilities: [
      {
        type: 'TABLE',
        instanceId: 'tabla-principal',
        label: 'Listado',
        isDefault: true,
        config: {
          columns: tpl.tableColumns,
          defaultSortField: resolveDefaultSortField(tpl.tableColumns),
          defaultSortDirection: 'desc',
          pageSize: 25,
          showCreateButton: true,
        },
      },
      {
        type: 'FORM',
        instanceId: 'form-datos',
        label: 'Ficha',
        config: {
          layout: 'sections',
          submitLabel: 'Guardar',
          sections: tpl.formSections,
        },
      },
    ],
    dataSchema: { fields: tpl.fields },
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    isPublic: false,
    createdBy: 'ai',
    version: '1',
  }

  const result = validateToolSchema(raw)
  if (!result.success) {
    throw new Error(
      `buildSimpleFallbackSchema: schema inválido para patrón "${pattern}": ` +
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    )
  }
  return result.data
}

export { detectPattern, getTemplate }
