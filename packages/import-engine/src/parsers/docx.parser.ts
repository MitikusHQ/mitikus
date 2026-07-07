import type { IImporter, ImportFile, ParseResult } from '../types/importer.types.js'
import type { NormalizedDocument, NormalizedSection, NormalizedField, NormalizedChecklist, NormalizedChecklistItem } from '../types/normalized-document.js'
import { emptyDocument } from '../types/normalized-document.js'

interface DocxData {
  fullText: string
  headings: Array<{ level: number; text: string }>
  paragraphs: string[]
  listItems: string[]
}

export class DocxParser implements IImporter {
  readonly format = 'docx' as const
  readonly supportedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ]
  readonly supportedExtensions = ['docx', 'doc']

  canHandle(file: ImportFile): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return ext === 'docx' || ext === 'doc'
  }

  async parse(file: ImportFile): Promise<ParseResult> {
    const mammoth = await import('mammoth')
    const warnings: string[] = []

    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer: file.buffer }),
      mammoth.convertToHtml({ buffer: file.buffer }),
    ])

    textResult.messages.forEach((m) => {
      if (m.type === 'warning') warnings.push(m.message)
    })

    const fullText = textResult.value
    const html = htmlResult.value

    const headings = extractHeadings(html)
    const listItems = extractListItems(html)
    const paragraphs = fullText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !headings.find((h) => h.text === l))

    return {
      raw: { fullText, headings, paragraphs, listItems },
      format: 'docx',
      warnings,
    }
  }

  async normalize(parsed: ParseResult, file: ImportFile): Promise<NormalizedDocument> {
    const { fullText, headings, paragraphs, listItems } = parsed.raw as DocxData

    const doc = emptyDocument({
      source: file.name,
      format: 'docx',
      fileSizeBytes: file.sizeBytes,
      title: headings[0]?.text ?? file.name.replace(/\.docx?$/i, ''),
      confidence: 0.8,
    })

    // Construir secciones a partir de encabezados
    const sections: NormalizedSection[] = []
    let currentSection: NormalizedSection | null = null

    for (const heading of headings) {
      if (heading.level <= 2) {
        currentSection = {
          id: `section-${sections.length}`,
          title: heading.text,
          level: heading.level as 1 | 2 | 3,
          content: '',
          fields: [],
          checklists: [],
        }
        sections.push(currentSection)
      }
    }

    // Si no hay secciones, crear una raíz
    if (sections.length === 0) {
      sections.push({
        id: 'root',
        title: doc.metadata.title ?? 'Documento',
        level: 1,
        content: paragraphs.slice(0, 10).join('\n'),
        fields: [],
        checklists: [],
      })
    }

    // Lista de ítems → checklist si parece una lista de verificación
    if (listItems.length > 3) {
      const checklistItems: NormalizedChecklistItem[] = listItems.map((item, i) => ({
        id: `item-${i}`,
        label: item,
        required: false,
      }))
      const checklist: NormalizedChecklist = {
        id: 'list-main',
        title: sections[0]?.title ?? 'Lista',
        items: checklistItems,
      }
      doc.checklists = [checklist]
      sections[0] && (sections[0].checklists = [checklist])
    }

    // Detectar campos tipo "Nombre: valor" en el texto
    const fieldPattern = /^([A-ZÁÉÍÓÚÑa-záéíóúñ][^\n:]{2,40}):\s*(.*)$/gm
    const detectedFields: NormalizedField[] = []
    let match: RegExpExecArray | null
    while ((match = fieldPattern.exec(fullText)) !== null) {
      const label = match[1]?.trim()
      const value = match[2]?.trim()
      if (label && label.split(' ').length <= 5) {
        detectedFields.push({
          id: slugify(label),
          label,
          type: value && value.length > 80 ? 'textarea' : 'text',
        })
      }
    }

    doc.sections = sections
    doc.fields = detectedFields.slice(0, 30)
    doc.rawText = fullText.slice(0, 4000)
    doc.metadata.warnings.push(...parsed.warnings)

    return doc
  }
}

function extractHeadings(html: string): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = []
  const re = /<h([1-3])[^>]*>(.*?)<\/h[1-3]>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    headings.push({ level: Number(m[1]), text: stripHtml(m[2] ?? '') })
  }
  return headings
}

function extractListItems(html: string): string[] {
  const items: string[] = []
  const re = /<li[^>]*>(.*?)<\/li>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1] ?? '').trim()
    if (text) items.push(text)
  }
  return items
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim()
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)
}
