'use client'

export interface ExportRow {
  fecha:       string
  herramienta: string
  estado:      string
  tokens:      number
  coste:       string
  duracion:    string
  usuario:     string
}

interface Props {
  rows:     ExportRow[]
  filename: string
}

export function HistoryExportButton({ rows, filename }: Props) {
  function exportCsv() {
    const headers = ['Fecha', 'Herramienta', 'Estado', 'Tokens', 'Coste (EUR)', 'Duración', 'Usuario']
    const lines   = [
      headers.join(';'),
      ...rows.map((r) =>
        [r.fecha, r.herramienta, r.estado, r.tokens, r.coste, r.duracion, r.usuario]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(';')
      ),
    ]
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportCsv}
      className="inline-flex items-center gap-1.5 text-xs font-medium border border-input rounded-md px-3 py-1.5 bg-background hover:bg-accent transition-colors"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exportar CSV
    </button>
  )
}
