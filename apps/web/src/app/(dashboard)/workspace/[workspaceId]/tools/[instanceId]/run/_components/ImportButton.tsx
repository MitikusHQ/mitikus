'use client'

import { useRef } from 'react'

interface Props {
  onImport: (text: string) => void
}

async function extractDocx(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)
  const xml = await zip.file('word/document.xml')?.async('string')
  if (!xml) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const texts: string[] = []
  doc.querySelectorAll('w\\:p').forEach((p) => {
    const line = Array.from(p.querySelectorAll('w\\:t'))
      .map((t) => t.textContent ?? '')
      .join('')
    if (line.trim()) texts.push(line)
  })
  return texts.join('\n')
}

async function extractXlsx(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const lines: string[] = []
  wb.SheetNames.forEach((name) => {
    const ws = wb.Sheets[name]
    if (!ws) return
    const csv = XLSX.utils.sheet_to_csv(ws)
    if (csv.trim()) lines.push(csv)
  })
  return lines.join('\n\n')
}

export function ImportButton({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const ext = file.name.split('.').pop()?.toLowerCase()
    let text = ''
    if (ext === 'docx') text = await extractDocx(file)
    else if (ext === 'xlsx' || ext === 'xls') text = await extractXlsx(file)

    if (text) onImport(text)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Importar desde Word o Excel"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-input rounded px-2 py-0.5 bg-background hover:bg-accent transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Importar
      </button>
    </>
  )
}
