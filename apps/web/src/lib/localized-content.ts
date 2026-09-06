import type {
  ChecklistConfig,
  DataSchema,
  FormConfig,
  ScoringConfig,
  TableConfig,
  ValidatedToolSchema,
} from '@protools/schema'
import type { Locale } from '@/i18n/config'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

const enDictionary: Record<string, string> = {
  cliente: 'Client',
  clientes: 'Clients',
  documentos: 'Documents',
  fichero: 'File',
  archivo: 'File',
  categoria: 'Category',
  fecha: 'Date',
  'fecha documento': 'Document date',
  'fecha del documento': 'Document date',
  'fecha contacto': 'Contact date',
  'fecha de contacto': 'Contact date',
  'fecha inicio': 'Start date',
  'fecha prevista': 'Planned date',
  'tamano fichero': 'File size',
  'tamano de fichero': 'File size',
  estado: 'Status',
  responsable: 'Owner',
  'recordatorio llamada': 'Call reminder',
  'recordatorio de llamada': 'Call reminder',
  notas: 'Notes',
  nota: 'Note',
  empresa: 'Company',
  contacto: 'Contact',
  telefono: 'Phone',
  tel: 'Phone',
  nombre: 'Name',
  departamento: 'Department',
  cargo: 'Role',
  titulo: 'Title',
  descripcion: 'Description',
  prioridad: 'Priority',
  'datos de contacto': 'Contact details',
  seguimiento: 'Follow-up',
  documento: 'Document',
  'situacion laboral': 'Employment status',
  'datos personales': 'Personal details',
  'informacion principal': 'Main information',
  'informacion': 'Information',
  guardar: 'Save',
  'guardar cambios': 'Save changes',
  crear: 'Create',
  enviar: 'Submit',
  pendiente: 'Pending',
  'en curso': 'In progress',
  completado: 'Completed',
  completada: 'Completed',
  archivado: 'Archived',
  archivada: 'Archived',
  borrador: 'Draft',
  enviado: 'Sent',
  enviada: 'Sent',
  firmado: 'Signed',
  firmada: 'Signed',
  aprobado: 'Approved',
  aprobada: 'Approved',
  rechazado: 'Rejected',
  rechazada: 'Rejected',
  'en espera': 'On hold',
  alta: 'High',
  media: 'Medium',
  baja: 'Low',
  critico: 'Critical',
  critica: 'Critical',
  bajo: 'Low',
  medio: 'Medium',
  alto: 'High',
  excelente: 'Excellent',
  correcto: 'Good',
  mejorable: 'Needs improvement',
  riesgo: 'Risk',
  'alto riesgo': 'High risk',
  'riesgo medio': 'Medium risk',
  'bajo riesgo': 'Low risk',
  'revision': 'Review',
  'aprobacion': 'Approval',
  'checklist': 'Checklist',
  'formulario': 'Form',
  'tabla': 'Table',
  'puntuacion': 'Score',
}

export function localizeText(value: string | undefined, locale: Locale): string | undefined {
  if (!value || locale === 'es') return value
  return enDictionary[normalize(value)] ?? value
}

function localizeField(field: DataSchema['fields'][string], locale: Locale): DataSchema['fields'][string] {
  return {
    ...field,
    label: localizeText(field.label, locale) ?? field.label,
    placeholder: localizeText(field.placeholder, locale),
    helpText: localizeText(field.helpText, locale),
    options: field.options,
  }
}

function localizeFormConfig(config: FormConfig, locale: Locale): FormConfig {
  return {
    ...config,
    submitLabel: localizeText(config.submitLabel, locale),
    sections: config.sections?.map((section) => ({
      ...section,
      title: localizeText(section.title, locale) ?? section.title,
    })),
  }
}

function localizeTableConfig(config: TableConfig, locale: Locale): TableConfig {
  return {
    ...config,
    columns: config.columns.map((column) => ({
      ...column,
      label: localizeText(column.label, locale),
    })),
  }
}

function localizeChecklistConfig(config: ChecklistConfig, locale: Locale): ChecklistConfig {
  return {
    ...config,
    categories: config.categories?.map((category) => localizeText(category, locale) ?? category),
    items: config.items.map((item) => ({
      ...item,
      label: localizeText(item.label, locale) ?? item.label,
      category: localizeText(item.category, locale),
      helpText: localizeText(item.helpText, locale),
    })),
  }
}

function localizeScoringConfig(config: ScoringConfig, locale: Locale): ScoringConfig {
  return {
    ...config,
    criteria: config.criteria.map((criterion) => ({
      ...criterion,
      label: localizeText(criterion.label, locale) ?? criterion.label,
      category: localizeText(criterion.category, locale),
      helpText: localizeText(criterion.helpText, locale),
    })),
    thresholds: config.thresholds?.map((threshold) => ({
      ...threshold,
      label: localizeText(threshold.label, locale) ?? threshold.label,
    })),
  }
}

export function localizeToolSchema(schema: ValidatedToolSchema, locale: Locale): ValidatedToolSchema {
  if (locale === 'es') return schema

  return {
    ...schema,
    name: localizeText(schema.name, locale) ?? schema.name,
    description: localizeText(schema.description, locale) ?? schema.description,
    capabilities: schema.capabilities.map((capability) => {
      let config = capability.config
      if (capability.type === 'FORM') config = localizeFormConfig(config as FormConfig, locale)
      if (capability.type === 'TABLE') config = localizeTableConfig(config as TableConfig, locale)
      if (capability.type === 'CHECKLIST') config = localizeChecklistConfig(config as ChecklistConfig, locale)
      if (capability.type === 'SCORING') config = localizeScoringConfig(config as ScoringConfig, locale)

      return {
        ...capability,
        label: localizeText(capability.label, locale) ?? capability.label,
        config,
      }
    }),
    dataSchema: {
      fields: Object.fromEntries(
        Object.entries(schema.dataSchema.fields).map(([fieldId, field]) => [
          fieldId,
          localizeField(field, locale),
        ]),
      ),
    },
  }
}
