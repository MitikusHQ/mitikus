'use client'

import { useRef, useState, useCallback } from 'react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface FileRecord {
  id: string
  name: string
  size: number
  mimeType: string | null
  url: string
  createdAt: string
}

interface StorageStatus {
  usedBytes: number
  limitBytes: number
  percentUsed: number
  hasCapacity: boolean
}

interface Props {
  workspaceId: string
  initialFiles: FileRecord[]
  initialStorage: StorageStatus
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function fileIcon(mime: string | null) {
  if (!mime) return '📄'
  if (mime === 'application/pdf') return '📕'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return '📊'
  if (mime.includes('document') || mime.includes('word')) return '📝'
  if (mime.includes('zip') || mime.includes('compressed')) return '🗜️'
  return '📄'
}

// ── Componente ────────────────────────────────────────────────────────────────

export function FilesClient({ workspaceId, initialFiles, initialStorage }: Props) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles)
  const [storage, setStorage] = useState<StorageStatus>(initialStorage)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Upload ─────────────────────────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/files`, { method: 'POST', body: form })
      const data = await res.json() as { file?: FileRecord; storage?: StorageStatus; error?: string }
      if (!res.ok) {
        setError(
          res.status === 507
            ? 'Has alcanzado el límite de almacenamiento de tu plan.'
            : res.status === 413
            ? 'El archivo supera el límite de 50 MB.'
            : data.error ?? 'Error al subir el archivo.',
        )
        return
      }
      if (data.file) setFiles((prev) => [data.file!, ...prev])
      if (data.storage) setStorage(data.storage)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }, [workspaceId])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ''
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function deleteFile(fileId: string) {
    setDeletingId(fileId)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/files?fileId=${fileId}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
        // Refresca storage status
        const statusRes = await fetch(`/api/workspaces/${workspaceId}/files`)
        const statusData = await statusRes.json() as { storage?: StorageStatus }
        if (statusData.storage) setStorage(statusData.storage)
      }
    } finally {
      setDeletingId(null)
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  async function downloadExport() {
    setExporting(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/export`)
      if (!res.ok) { setError('No tienes permisos para exportar este workspace.'); return }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const filename = disposition.match(/filename="(.+)"/)?.[1] ?? 'export.zip'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error al generar el ZIP.')
    } finally {
      setExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const pct = Math.min(storage.percentUsed, 100)
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'

  return (
    <div className="space-y-6">
      {/* Barra de almacenamiento + export */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Almacenamiento</span>
          <span className="text-muted-foreground">
            {fmtBytes(storage.usedBytes)} / {fmtBytes(storage.limitBytes)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{pct}% usado</span>
          <button
            onClick={downloadExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Generando…' : 'Exportar ZIP'}
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
        } ${uploading ? 'cursor-default opacity-60' : ''}`}
      >
        <input ref={inputRef} type="file" onChange={handleChange} className="hidden" />
        <div className="flex flex-col items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="text-sm text-muted-foreground">
            {uploading
              ? 'Subiendo…'
              : <>Arrastra un archivo aquí o <span className="text-primary font-medium">elige uno</span></>}
          </p>
          <p className="text-xs text-muted-foreground">Máximo 50 MB por archivo</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Lista de archivos */}
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aún no hay archivos en este workspace.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-xl shrink-0">{fileIcon(f.mimeType)}</span>
              <div className="min-w-0 flex-1">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {f.name}
                </a>
                <p className="text-xs text-muted-foreground">
                  {fmtBytes(f.size)} · {new Date(f.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
              <button
                onClick={() => void deleteFile(f.id)}
                disabled={deletingId === f.id}
                aria-label="Eliminar archivo"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
