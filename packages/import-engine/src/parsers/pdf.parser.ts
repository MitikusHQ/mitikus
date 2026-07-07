import type { IImporter, ImportFile, ParseResult } from '../types/importer.types.js'
import type { NormalizedDocument, NormalizedSection, NormalizedField, NormalizedChecklist, NormalizedChecklistItem } from '../types/normalized-document.js'
import { emptyDocument } from '../types/normalized-document.js'

interface PdfData {
  text: string
  numPages: number
  info: Record<string, unknown>
}

export class PdfParser implements IImporter {
  readonly format = 'pdf' as const
  readonly supportedMimeTypes = ['application/pdf']
  readonly supportedExtensions = ['pdf']

  canHandle(file: ImportFile): boolean {
    return file.name.split('.').pop()?.toLowerCase() === 'pdf'
  }

  async parse(file: ImportFile): Promise<ParseResult> {
    const pdfParse = await import('pdf-parse')
    const warnings: string[] = []

    let data: { text: string; numpages: number; info: Record<string, unknown> }
    try {
      data = await pdfParse.default(file.buffer)
    } catch (err) {
      throw new Error(`Error al procesar PDF: ${(err as Error).message}`)
    }

    if (!data.text?.trim()) {
      warnings.push('El PDF no contiene texto extraíble — puede ser un PDF escaneado')
    }

    return {
      raw: { text: data.text ?? '', numPages: data.numpages, info: data.info ?? {} },
      format: 'pdf',
      warnings,
    }
  }

  async normalize(parsed: ParseResult, file: ImportFile): Promise<NormalizedDocument> {
    const { text, numPages, info } = parsed.raw as PdfData

    const title = (info['Title'] as string) ?? file.name.replace(/\.pdf$/i, '')

    const doc = emptyDocument({
      source: file.name,
      format: 'pdf',
      fileSizeBytes: file.sizeBytes,
      title,
      confidence: text.trim() ? 0.75 : 0.2,
    })

    if (!text.trim()) {
      doc.metadata.warnings.push('PDF sin texto — la conversión a herramienta requerirá descripción manual')
      doc.rawText = ''
      return doc
    }

    // Dividir en secciones por saltos de línea múltiples o patrones de título
    const rawSections = splitIntoSections(text)
    const sections: NormalizedSection[] = rawSections.map((s, i) => ({
      id: `section-${i}`,
      title: s.title ?? `Sección ${i + 1}`,
      level: i === 0 ? 1 : 2,
      content: s.content.slice(0, 500),
      fields: [],
      checklists: [],
    }))

    // Detectar listas tipo checklist
    const checklistItems = extractChecklistItems(text)
    if (checklistItems.length > 3) {
      const items: NormalizedChecklistItem[] = checklistItems.map((item, i) => ({
        id: `pdf-item-${i}`,
        label: item,
      }))
      doc.checklists = [{ id: 'pdf-checklist', title: title, items }]
    }

    // Detectar campos tipo "Etiqueta: valor"
    const fields = extractFields(text)
    doc.fields = fields

    doc.sections = sections.slice(0, 10)
    doc.rawText = text.slice(0, 4000)
    doc.metadata.title = title
    doc.metadata.warnings.push(...(parsed.warnings ?? []))

    if (numPages > 20) {
      doc.metadata.warnings.push(`PDF largo (${numPages} páginas) — solo se procesaron las primeras ~4000 caracteres`)
    }

    return doc
  }
}

function splitIntoSections(text: string): Array<{ title?: string; content: string }> {
  const lines = text.split('\n')
  const sections: Array<{ title?: string; content: string }> = []
  let current: { title?: string; content: string } = { content: '' }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // Detectar encabezado: línea corta en mayúsculas o que termine en ':'
    const isHeading = (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
      (trimmed.endsWith(':') && trimmed.split(' ').length <= 6)

    if (isHeading && current.content.length > 30) {
      sections.push(current)
      current = { title: trimmed.replace(/:$/, ''), content: '' }
    } else if (isHeading && !current.title) {
      current.title = trimmed.replace(/:$/, '')
    } else {
      current.content += (current.content ? '\n' : '') + trimmed
    }
  }
  if (current.content || current.title) sections.push(current)
  return sections.length ? sections : [{ title: undefined, content: text.slice(0, 2000) }]
}

function extractChecklistItems(text: string): string[] {
  const items: string[] = []
  // Detectar ítems con ☐ □ ▪ • - * o numerados
  const re = /^[\s]*(?:☐|□|▪|•|-|\*|\d+[.)]\s)\s*(.{5,100})$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const item = m[1]?.trim()
    if (item) items.push(item)
  }
  return items
}

function extractFields(text: string): NormalizedField[] {
  const fields: NormalizedField[] = []
  const re = /^([A-ZÁÉÍÓÚÑa-záéíóúñ][^\n:]{2,40}):\s*(.{0,100})$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null && fields.length < 20) {
    const label = m[1]?.trim()
    const value = m[2]?.trim()
    if (label && label.split(' ').length <= 5) {
      fields.push({
        id: slugify(label),
        label,
        type: value && value.length > 80 ? 'textarea' : 'text',
      })
    }
  }
  return fields
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)
}
