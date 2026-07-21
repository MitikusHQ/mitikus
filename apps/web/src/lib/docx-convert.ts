import mammoth from 'mammoth'

export interface DocxConvertResult {
  html:      string
  rawText:   string
  wordCount: number
}

export async function convertDocx(buffer: Buffer): Promise<DocxConvertResult> {
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ buffer }),
    mammoth.extractRawText({ buffer }),
  ])

  const rawText   = textResult.value.trim()
  const wordCount = rawText.split(/\s+/).filter(Boolean).length

  return {
    html: htmlResult.value,
    rawText,
    wordCount,
  }
}
