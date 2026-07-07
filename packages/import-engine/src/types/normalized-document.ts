// NormalizedDocument — modelo universal intermedio.
// Todo importador produce este objeto. La IA lo consume. Nunca ToolSchema directamente.

export type ImportFormat =
  | 'excel'
  | 'csv'
  | 'json'
  | 'tool-schema'
  | 'docx'
  | 'pdf'
  | 'markdown'
  | 'plain-text'
  | 'html-form'
  | 'google-forms'
  | 'airtable'
  | 'notion'
  | 'typeform'
  | 'unknown'

export interface NormalizedField {
  id: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'textarea' | 'unknown'
  required?: boolean
  options?: string[]
  description?: string
}

export interface NormalizedColumn {
  id: string
  label: string
  sampleValues: string[]
}

export interface NormalizedTable {
  id: string
  title?: string
  columns: NormalizedColumn[]
  rows: Record<string, string>[]
}

export interface NormalizedChecklistItem {
  id: string
  label: string
  category?: string
  required?: boolean
  helpText?: string
}

export interface NormalizedChecklist {
  id: string
  title?: string
  items: NormalizedChecklistItem[]
}

export interface NormalizedScoreCriterion {
  id: string
  label: string
  weight?: number
  min?: number
  max?: number
  category?: string
}

export interface NormalizedSection {
  id: string
  title: string
  level: 1 | 2 | 3
  content: string
  fields: NormalizedField[]
  checklists: NormalizedChecklist[]
}

export interface NormalizedMetadata {
  title?: string
  description?: string
  author?: string
  createdAt?: Date
  source: string
  format: ImportFormat
  fileSizeBytes: number
  // Confianza global del parser: 0 = desconocida, 1 = certeza total
  confidence: number
  warnings: string[]
}

export interface NormalizedDocument {
  metadata: NormalizedMetadata
  sections: NormalizedSection[]
  tables: NormalizedTable[]
  fields: NormalizedField[]
  checklists: NormalizedChecklist[]
  scoreCriteria: NormalizedScoreCriterion[]
  rawText: string
}

export function emptyDocument(meta: Partial<NormalizedMetadata> & { source: string; format: ImportFormat }): NormalizedDocument {
  return {
    metadata: {
      fileSizeBytes: 0,
      confidence: 0,
      warnings: [],
      ...meta,
    },
    sections: [],
    tables: [],
    fields: [],
    checklists: [],
    scoreCriteria: [],
    rawText: '',
  }
}
