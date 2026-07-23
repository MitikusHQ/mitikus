import * as cheerio from 'cheerio'

const CHAR_LIMIT = 400_000

export interface ExtractResult {
  title:     string
  content:   string
  charCount: number
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }> // eslint-disable-line
  const data = await pdfParse(buffer)
  return data.text.trim()
}

export function extractDocHtml(html: string): string {
  return stripHtml(html)
}

export async function extractUrl(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 MITIKUS-Notebooks/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  $('script, style, nav, header, footer, aside').remove()

  const title = $('title').text().trim() || url
  const content = $('body').text().replace(/\s+/g, ' ').trim()
  return { title, content }
}

export function checkLimit(currentTotal: number, incoming: number): boolean {
  return currentTotal + incoming <= CHAR_LIMIT
}

export { CHAR_LIMIT }
