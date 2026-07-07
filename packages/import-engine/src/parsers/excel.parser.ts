import type { IImporter, ImportFile, ParseResult } from '../types/importer.types.js'
import type { NormalizedDocument, NormalizedTable, NormalizedColumn, NormalizedField } from '../types/normalized-document.js'
import { emptyDocument } from '../types/normalized-document.js'

interface ExcelSheet {
  name: string
  headers: string[]
  rows: Record<string, string>[]
}

export class ExcelParser implements IImporter {
  readonly format = 'excel' as const
  readonly supportedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  readonly supportedExtensions = ['xlsx', 'xls']

  canHandle(file: ImportFile): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return this.supportedExtensions.includes(ext ?? '')
  }

  async parse(file: ImportFile): Promise<ParseResult> {
    const xlsx = await import('xlsx')
    const workbook = xlsx.read(file.buffer, { type: 'buffer', cellDates: true })
    const sheets: ExcelSheet[] = []
    const warnings: string[] = []

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName]
      if (!ws) continue

      const json = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: '',
        raw: false,
      })

      if (json.length === 0) {
        warnings.push(`Hoja "${sheetName}" está vacía`)
        continue
      }

      const headers = Object.keys(json[0] ?? {})
      const rows = json.map((row) =>
        Object.fromEntries(headers.map((h) => [h, String(row[h] ?? '')])),
      )

      sheets.push({ name: sheetName, headers, rows })
    }

    return { raw: sheets, format: 'excel', warnings }
  }

  async normalize(parsed: ParseResult, file: ImportFile): Promise<NormalizedDocument> {
    const sheets = parsed.raw as ExcelSheet[]
    const doc = emptyDocument({
      source: file.name,
      format: 'excel',
      fileSizeBytes: file.sizeBytes,
      confidence: 0.85,
    })

    const tables: NormalizedTable[] = []
    const fields: NormalizedField[] = []

    for (const sheet of sheets) {
      const columns: NormalizedColumn[] = sheet.headers.map((h) => ({
        id: slugify(h),
        label: h,
        sampleValues: sheet.rows.slice(0, 3).map((r) => r[h] ?? ''),
      }))

      tables.push({
        id: `sheet-${slugify(sheet.name)}`,
        title: sheet.name,
        columns,
        rows: sheet.rows.slice(0, 100), // cap para no saturar memoria
      })

      // Primera hoja → también genera campos del formulario
      if (tables.length === 1) {
        for (const col of columns) {
          fields.push({
            id: col.id,
            label: col.label,
            type: inferFieldType(col.sampleValues),
          })
        }
      }
    }

    doc.tables = tables
    doc.fields = fields
    doc.metadata.title = sheets[0]?.name
    doc.rawText = tables
      .map((t) => `${t.title ?? ''}\n${t.columns.map((c) => c.label).join(' | ')}`)
      .join('\n\n')

    return doc
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60)
}

function inferFieldType(samples: string[]): NormalizedField['type'] {
  const nonEmpty = samples.filter(Boolean)
  if (nonEmpty.length === 0) return 'text'
  if (nonEmpty.every((v) => /^-?\d+(\.\d+)?$/.test(v))) return 'number'
  if (nonEmpty.every((v) => /^(true|false|sí|si|no|yes)$/i.test(v))) return 'boolean'
  if (nonEmpty.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v))) return 'date'
  if (nonEmpty.some((v) => v.length > 100)) return 'textarea'
  return 'text'
}
