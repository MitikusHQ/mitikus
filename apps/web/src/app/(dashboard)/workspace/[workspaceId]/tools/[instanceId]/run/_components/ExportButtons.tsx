'use client'

import { useState } from 'react'

interface Props {
  result:   string
  toolName: string
}

export function ExportButtons({ result, toolName }: Props) {
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [loadingXls, setLoadingXls] = useState(false)
  const [copied, setCopied]         = useState(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: textarea trick
      const el = document.createElement('textarea')
      el.value = result
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const safeFileName = toolName.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  async function exportWord() {
    setLoadingDoc(true)
    try {
      const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import('docx')

      const lines = result.split('\n')
      const children = lines.map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          return new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1 })
        }
        if (trimmed.startsWith('## ')) {
          return new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 })
        }
        if (trimmed.startsWith('### ')) {
          return new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 })
        }
        const boldPattern = /\*\*(.+?)\*\*/g
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const runs: any[] = []
        let last = 0
        let match
        while ((match = boldPattern.exec(trimmed)) !== null) {
          if (match.index > last) runs.push(new TextRun(trimmed.slice(last, match.index)))
          runs.push(new TextRun({ text: match[1], bold: true }))
          last = match.index + match[0].length
        }
        if (last < trimmed.length) runs.push(new TextRun(trimmed.slice(last)))
        return runs.length > 0
          ? new Paragraph({ children: runs })
          : new Paragraph({ text: trimmed })
      })

      const doc = new Document({
        sections: [{ children }],
        creator: 'MITIKUS',
        title: toolName,
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeFileName}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoadingDoc(false)
    }
  }

  async function exportExcel() {
    setLoadingXls(true)
    try {
      const XLSX = await import('xlsx')

      const lines = result.split('\n').filter((l) => l.trim())
      const rows = lines.map((line) => [line.replace(/^#+\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1')])

      const ws = XLSX.utils.aoa_to_sheet([['Contenido'], ...rows])
      ws['!cols'] = [{ wch: 100 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, toolName.slice(0, 31))
      XLSX.writeFile(wb, `${safeFileName}.xlsx`)
    } finally {
      setLoadingXls(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => void copyToClipboard()}
        className="inline-flex items-center gap-1.5 text-xs font-medium border border-input rounded-md px-3 py-1.5 bg-background hover:bg-accent transition-colors"
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copiado
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copiar
          </>
        )}
      </button>
      <button
        onClick={exportWord}
        disabled={loadingDoc}
        className="inline-flex items-center gap-1.5 text-xs font-medium border border-input rounded-md px-3 py-1.5 bg-background hover:bg-accent transition-colors disabled:opacity-50"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        {loadingDoc ? 'Generando…' : 'Exportar Word'}
      </button>
      <button
        onClick={exportExcel}
        disabled={loadingXls}
        className="inline-flex items-center gap-1.5 text-xs font-medium border border-input rounded-md px-3 py-1.5 bg-background hover:bg-accent transition-colors disabled:opacity-50"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M3 15h18M9 3v18"/>
        </svg>
        {loadingXls ? 'Generando…' : 'Exportar Excel'}
      </button>
    </div>
  )
}
