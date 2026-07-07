'use client'

import { useCallback, useState, useRef } from 'react'
import { importRecords } from '@/app/actions/record'
import type { ImportResult } from '@/app/actions/record'

interface Field {
  id: string
  label: string
  type: string
  required: boolean
}

interface ImportClientProps {
  instanceId: string
  workspaceId: string
  fields: Field[]
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  return { headers: parseRow(lines[0]!), rows: lines.slice(1).map(parseRow) }
}

function autoMap(headers: string[], fields: Field[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  for (const field of fields) {
    const normLabel = norm(field.label)
    const normId    = norm(field.id)
    for (let i = 0; i < headers.length; i++) {
      const h = norm(headers[i]!)
      if (h === normLabel || h === normId) {
        mapping[field.id] = i
        break
      }
    }
  }
  return mapping
}

function rowToRecord(
  row: string[],
  mapping: Record<string, number>,
  fields: Field[],
): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const field of fields) {
    const idx = mapping[field.id]
    if (idx === undefined) continue
    const raw = row[idx] ?? ''
    if (field.type === 'number') {
      const n = parseFloat(raw)
      record[field.id] = isNaN(n) ? null : n
    } else if (field.type === 'boolean') {
      record[field.id] = ['true', 'sí', 'si', '1', 'yes'].includes(norm(raw))
    } else {
      record[field.id] = raw || null
    }
  }
  return record
}

export function ImportClient({ instanceId, workspaceId, fields }: ImportClientProps) {
  const [step, setStep]     = useState<Step>('upload')
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const csv  = parseCSV(text)
      if (csv.headers.length === 0) {
        setError('El fichero está vacío o no tiene cabeceras.')
        return
      }
      setParsed(csv)
      setMapping(autoMap(csv.headers, fields))
      setStep('preview')
      setError(null)
    }
    reader.readAsText(file, 'UTF-8')
  }, [fields])

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { setError('Solo se admiten ficheros .csv'); return }
    processFile(file)
  }

  const downloadTemplate = () => {
    const header = fields.map((f) => f.label).join(',')
    const blob   = new Blob([header + '\n'], { type: 'text/csv;charset=utf-8' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href = url; a.download = 'plantilla.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!parsed) return
    setStep('importing')
    setError(null)
    const records = parsed.rows
      .filter((r) => r.some((c) => c.trim()))
      .map((r) => rowToRecord(r, mapping, fields))
    try {
      const res = await importRecords(instanceId, records)
      if (res.error) { setError(res.error); setStep('preview') }
      else { setResult(res); setStep('done') }
    } catch {
      setError('Error inesperado al importar.'); setStep('preview')
    }
  }

  const nonEmptyRows    = parsed?.rows.filter((r) => r.some((c) => c.trim())) ?? []
  const rowCount        = nonEmptyRows.length
  const requiredUnmapped = fields.filter((f) => f.required && mapping[f.id] === undefined)
  const mappedFields    = fields.filter((f) => mapping[f.id] !== undefined)

  // ── Upload ─────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-16 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <p className="text-3xl mb-3">📂</p>
          <p className="text-sm font-medium">Arrastra un CSV aquí o haz clic para seleccionar</p>
          <p className="text-xs text-muted-foreground mt-1">Solo ficheros .csv · UTF-8</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <div className="text-center">
          <button
            onClick={downloadTemplate}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            Descargar plantilla CSV →
          </button>
        </div>
      </div>
    )
  }

  // ── Preview ────────────────────────────────────────────────────
  if (step === 'preview' || step === 'importing') {
    const previewRows = nonEmptyRows.slice(0, 5)

    return (
      <div className="space-y-6">
        {/* Mapping */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Mapeo de columnas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {fields.map((f) => {
              const idx       = mapping[f.id]
              const csvHeader = idx !== undefined ? parsed!.headers[idx] : null
              return (
                <div key={f.id} className="flex items-center gap-2 text-xs">
                  <span className={idx !== undefined ? 'text-green-500' : 'text-muted-foreground/30'}>
                    {idx !== undefined ? '✓' : '—'}
                  </span>
                  <span className="text-foreground">{f.label}</span>
                  {f.required && idx === undefined && (
                    <span className="text-destructive font-medium ml-1">obligatorio</span>
                  )}
                  {csvHeader && norm(csvHeader) !== norm(f.label) && (
                    <span className="text-muted-foreground/50 truncate">← "{csvHeader}"</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {requiredUnmapped.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Faltan columnas obligatorias: <strong>{requiredUnmapped.map((f) => f.label).join(', ')}</strong>. No se podrán importar registros válidos.
          </div>
        )}

        {/* Preview table */}
        {mappedFields.length > 0 && previewRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Vista previa — {previewRows.length < rowCount ? `primeras ${previewRows.length} de ${rowCount} filas` : `${rowCount} fila${rowCount !== 1 ? 's' : ''}`}
            </p>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-muted/60">
                    <tr>
                      {mappedFields.map((f) => (
                        <th key={f.id} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap border-b">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        {mappedFields.map((f) => {
                          const val = row[mapping[f.id]!] ?? ''
                          return (
                            <td key={f.id} className="px-3 py-2 max-w-[180px] truncate">
                              {val || <span className="text-muted-foreground/30">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            disabled={step === 'importing' || requiredUnmapped.length > 0 || rowCount === 0}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'importing' ? 'Importando…' : `Importar ${rowCount} registro${rowCount !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={() => { setStep('upload'); setParsed(null); setError(null) }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cambiar fichero
          </button>
        </div>
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <p className="text-5xl">✓</p>
        <div>
          <p className="text-lg font-semibold">
            {result.imported} registro{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}
          </p>
          {result.skipped > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {result.skipped} fila{result.skipped !== 1 ? 's' : ''} omitida{result.skipped !== 1 ? 's' : ''} (campos obligatorios vacíos o límite de plan)
            </p>
          )}
        </div>
        <a
          href={`/workspace/${workspaceId}/tools/${instanceId}`}
          className="inline-flex items-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Ver registros →
        </a>
      </div>
    )
  }

  return null
}
