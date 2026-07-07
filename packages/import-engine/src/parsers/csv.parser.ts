import type { IImporter, ImportFile, ParseResult } from '../types/importer.types.js'
import type { NormalizedDocument, NormalizedField, NormalizedTable, NormalizedColumn } from '../types/normalized-document.js'
import { emptyDocument } from '../types/normalized-document.js'

interface CsvData {
  headers: string[]
  rows: Record<string, string>[]
}

export class CsvParser implements IImporter {
  readonly format = 'csv' as const
  readonly supportedMimeTypes = ['text/csv', 'application/csv', 'text/plain']
  readonly supportedExtensions = ['csv']

  canHandle(file: ImportFile): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return ext === 'csv'
  }

  async parse(file: ImportFile): Promise<ParseResult> {
    const text = file.buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = text.split('\n').filter((l) => l.trim())

    if (lines.length === 0) {
      return { raw: { headers: [], rows: [] }, format: 'csv', warnings: ['CSV vacío'] }
    }

    const delimiter = detectDelimiter(lines[0] ?? '')
    const headers = parseCsvLine(lines[0] ?? '', delimiter)
    const rows: Record<string, string>[] = []
    const warnings: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i] ?? '', delimiter)
      if (values.length !== headers.length) {
        warnings.push(`Fila ${i + 1}: columnas esperadas ${headers.length}, encontradas ${values.length}`)
      }
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx]?.trim() ?? ''
      })
      rows.push(row)
    }

    return { raw: { headers, rows }, format: 'csv', warnings }
  }

  async normalize(parsed: ParseResult, file: ImportFile): Promise<NormalizedDocument> {
    const { headers, rows } = parsed.raw as CsvData
    const doc = emptyDocument({
      source: file.name,
      format: 'csv',
      fileSizeBytes: file.sizeBytes,
      title: file.name.replace(/\.csv$/i, ''),
      confidence: 0.9,
    })

    const columns: NormalizedColumn[] = headers.map((h) => ({
      id: slugify(h),
      label: h,
      sampleValues: rows.slice(0, 3).map((r) => r[h] ?? ''),
    }))

    const table: NormalizedTable = {
      id: 'csv-main',
      title: file.name.replace(/\.csv$/i, ''),
      columns,
      rows: rows.slice(0, 100),
    }

    const fields: NormalizedField[] = columns.map((col) => ({
      id: col.id,
      label: col.label,
      type: inferFieldType(col.sampleValues),
    }))

    doc.tables = [table]
    doc.fields = fields
    doc.rawText = [headers.join(' | '), ...rows.slice(0, 5).map((r) => headers.map((h) => r[h]).join(' | '))].join('\n')
    doc.metadata.warnings.push(...parsed.warnings)

    return doc
  }
}

function detectDelimiter(firstLine: string): string {
  const candidates = [',', ';', '\t', '|']
  let best = ','
  let max = 0
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1
    if (count > max) { max = count; best = c }
  }
  return best
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)
}

function inferFieldType(samples: string[]): NormalizedField['type'] {
  const nonEmpty = samples.filter(Boolean)
  if (!nonEmpty.length) return 'text'
  if (nonEmpty.every((v) => /^-?\d+(\.\d+)?$/.test(v))) return 'number'
  if (nonEmpty.every((v) => /^(true|false|sí|si|no|yes)$/i.test(v))) return 'boolean'
  if (nonEmpty.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v))) return 'date'
  if (nonEmpty.some((v) => v.length > 100)) return 'textarea'
  return 'text'
}
