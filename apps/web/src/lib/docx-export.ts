import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  AlignmentType,
  BorderStyle,
  ShadingType,
  LevelFormat,
} from 'docx'

type InlineRun = TextRun | ExternalHyperlink

interface DocxBuildOptions {
  title:        string
  uploaderName: string | null
  wordCount:    number
  createdAt:    string
  elements:     Paragraph[]
}

function parseInlines(
  node: Node,
  opts: { bold?: boolean; italics?: boolean; code?: boolean } = {},
): InlineRun[] {
  const runs: InlineRun[] = []

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? ''
      if (!text) return
      runs.push(
        new TextRun({
          text,
          bold:    opts.bold,
          italics: opts.italics,
          font:    opts.code ? { name: 'Courier New' } : undefined,
          shading: opts.code
            ? { type: ShadingType.CLEAR, fill: 'F3F2EF', color: 'auto' }
            : undefined,
        }),
      )
      return
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'br') {
      runs.push(new TextRun({ text: '', break: 1 }))
      return
    }
    if (tag === 'strong' || tag === 'b') {
      runs.push(...parseInlines(el, { ...opts, bold: true }))
      return
    }
    if (tag === 'em' || tag === 'i') {
      runs.push(...parseInlines(el, { ...opts, italics: true }))
      return
    }
    if (tag === 'code') {
      runs.push(...parseInlines(el, { ...opts, code: true }))
      return
    }
    if (tag === 'a') {
      const href = el.getAttribute('href') ?? ''
      const linkRuns = parseInlines(el, { ...opts })
      if (href && linkRuns.length > 0) {
        runs.push(new ExternalHyperlink({ link: href, children: linkRuns as TextRun[] }))
      } else {
        runs.push(...linkRuns)
      }
      return
    }
    runs.push(...parseInlines(el, opts))
  })

  return runs
}

function parseBlock(el: HTMLElement): Paragraph[] {
  const tag = el.tagName.toLowerCase()

  if (tag === 'p') {
    return [new Paragraph({ children: parseInlines(el) })]
  }

  const headingMap: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
  }
  if (headingMap[tag]) {
    return [new Paragraph({ heading: headingMap[tag], children: parseInlines(el) })]
  }

  if (tag === 'ul') {
    const items: Paragraph[] = []
    el.querySelectorAll(':scope > li').forEach((li) => {
      items.push(
        new Paragraph({
          bullet:   { level: 0 },
          children: parseInlines(li as HTMLElement),
        }),
      )
    })
    return items
  }

  if (tag === 'ol') {
    const items: Paragraph[] = []
    el.querySelectorAll(':scope > li').forEach((li) => {
      items.push(
        new Paragraph({
          numbering: { reference: 'decimal-numbering', level: 0 },
          children:  parseInlines(li as HTMLElement),
        }),
      )
    })
    return items
  }

  if (tag === 'blockquote') {
    return [
      new Paragraph({
        children: parseInlines(el),
        indent:   { left: 720 },
        border: {
          left: {
            color: 'AAAAAA',
            space: 10,
            style: BorderStyle.SINGLE,
            size:  12,
          },
        },
      }),
    ]
  }

  return [new Paragraph({ children: parseInlines(el) })]
}

export function parseHtmlToDocx(html: string): Paragraph[] {
  const parser = new DOMParser()
  const parsed = parser.parseFromString(html, 'text/html')
  const result: Paragraph[] = []

  parsed.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    result.push(...parseBlock(node as HTMLElement))
  })

  return result
}

export function buildWordDocument(opts: DocxBuildOptions): Document {
  const { title, uploaderName, wordCount, createdAt, elements } = opts

  const metaText = `${wordCount.toLocaleString('es-ES')} palabras · ${new Date(createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}${uploaderName ? ` · ${uploaderName}` : ''}`

  return new Document({
    creator:     uploaderName ?? 'MITIKUS',
    title,
    description: `Exportado desde MITIKUS el ${new Date().toLocaleDateString('es-ES')}`,

    numbering: {
      config: [
        {
          reference: 'decimal-numbering',
          levels: [
            {
              level:     0,
              format:    LevelFormat.DECIMAL,
              text:      '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },

    sections: [
      {
        properties: {
          page: {
            size:   { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading:  HeadingLevel.TITLE,
            children: [new TextRun({ text: title, bold: true, size: 52 })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: metaText, color: '888888', size: 18 }),
            ],
            spacing: { after: 240 },
          }),
          ...elements,
        ],
      },
    ],
  })
}

export async function downloadAsDocx(
  html:         string,
  title:        string,
  uploaderName: string | null,
  wordCount:    number,
  createdAt:    string,
): Promise<void> {
  const elements = parseHtmlToDocx(html)
  const wordDoc  = buildWordDocument({ title, uploaderName, wordCount, createdAt, elements })
  const blob     = await Packer.toBlob(wordDoc)
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = `${title}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
