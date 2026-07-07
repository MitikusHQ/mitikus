import type { IImporter, ImportFile, ParseResult } from '../types/importer.types.js'
import type { NormalizedDocument, NormalizedField, NormalizedSection } from '../types/normalized-document.js'
import { emptyDocument } from '../types/normalized-document.js'
import { validateImportedSchema } from '../validators/schema.validator.js'

interface JsonData {
  raw: unknown
  isToolSchema: boolean
  isArray: boolean
  inferredTitle?: string
}

export class JsonParser implements IImporter {
  readonly format = 'json' as const
  readonly supportedMimeTypes = ['application/json', 'text/json']
  readonly supportedExtensions = ['json']

  canHandle(file: ImportFile): boolean {
    return file.name.split('.').pop()?.toLowerCase() === 'json'
  }

  async parse(file: ImportFile): Promise<ParseResult> {
    const text = file.buffer.toString('utf-8')
    const warnings: string[] = []
    let data: unknown

    try {
      data = JSON.parse(text)
    } catch (err) {
      throw new Error(`JSON inválido: ${(err as Error).message}`)
    }

    // Detectar si es un ToolSchema ProTools
    const validation = validateImportedSchema(data)
    const isToolSchema = validation.valid

    if (isToolSchema) {
      return { raw: { raw: data, isToolSchema: true, isArray: false, inferredTitle: (data as Record<string, unknown>)?.title as string }, format: 'tool-schema', warnings }
    }

    const isArray = Array.isArray(data)
    if (isArray && (data as unknown[]).length > 500) {
      warnings.push(`Array con ${(data as unknown[]).length} elementos — se usarán los primeros 100`)
    }

    const inferredTitle = typeof data === 'object' && data !== null && !isArray
      ? ((data as Record<string, unknown>)['title'] ?? (data as Record<string, unknown>)['name'] ?? (data as Record<string, unknown>)['nombre']) as string | undefined
      : undefined

    return {
      raw: { raw: isArray ? (data as unknown[]).slice(0, 100) : data, isToolSchema: false, isArray, inferredTitle },
      format: 'json',
      warnings,
    }
  }

  async normalize(parsed: ParseResult, file: ImportFile): Promise<NormalizedDocument> {
    const { raw: data, isToolSchema, isArray, inferredTitle } = parsed.raw as JsonData

    // ToolSchema directo — se devuelve marcado, el pipeline lo pasa al converter sin IA
    if (isToolSchema) {
      const doc = emptyDocument({
        source: file.name,
        format: 'tool-schema',
        fileSizeBytes: file.sizeBytes,
        confidence: 1.0,
        title: inferredTitle ?? file.name,
      })
      doc.rawText = JSON.stringify(data, null, 2).slice(0, 5000)
      return doc
    }

    const doc = emptyDocument({
      source: file.name,
      format: 'json',
      fileSizeBytes: file.sizeBytes,
      confidence: 0.75,
      title: inferredTitle ?? file.name.replace(/\.json$/i, ''),
    })

    if (isArray) {
      const arr = data as Record<string, unknown>[]
      const firstItem = arr[0] ?? {}
      const keys = Object.keys(firstItem)

      doc.fields = keys.map((k) => ({
        id: slugify(k),
        label: k,
        type: inferFieldType(arr.slice(0, 3).map((item) => String(item[k] ?? ''))),
      }))

      doc.rawText = `Array de ${arr.length} objetos. Campos: ${keys.join(', ')}\n` +
        arr.slice(0, 3).map((item) => JSON.stringify(item)).join('\n')
    } else {
      const obj = data as Record<string, unknown>
      const section: NormalizedSection = {
        id: 'root',
        title: inferredTitle ?? 'Root',
        level: 1,
        content: extractTextContent(obj),
        fields: extractFields(obj),
        checklists: [],
      }
      doc.sections = [section]
      doc.fields = section.fields
      doc.rawText = JSON.stringify(obj, null, 2).slice(0, 3000)
    }

    doc.metadata.warnings.push(...parsed.warnings)
    return doc
  }
}

function extractTextContent(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return ''
  return Object.entries(obj)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

function extractFields(obj: Record<string, unknown>): NormalizedField[] {
  return Object.entries(obj)
    .filter(([, v]) => typeof v !== 'object' || v === null)
    .map(([k, v]) => ({
      id: slugify(k),
      label: k,
      type: inferFieldType([String(v ?? '')]),
    }))
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)
}

function inferFieldType(samples: string[]): NormalizedField['type'] {
  const nonEmpty = samples.filter(Boolean)
  if (!nonEmpty.length) return 'text'
  if (nonEmpty.every((v) => /^-?\d+(\.\d+)?$/.test(v))) return 'number'
  if (nonEmpty.every((v) => /^(true|false)$/i.test(v))) return 'boolean'
  if (nonEmpty.some((v) => v.length > 100)) return 'textarea'
  return 'text'
}
