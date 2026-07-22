'use client'

import { useRef, useState } from 'react'
import type { PdfData } from '@/app/actions/pdfs'

interface Props {
  workspaceId: string
  onUploaded:  (pdf: PdfData) => void
}

export function PdfUploadZone({ workspaceId, onUploaded }: Props) {
  const [isDragging, setIsDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se admiten archivos PDF (.pdf)')
      return
    }
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceId', workspaceId)

    try {
      const res  = await fetch('/api/pdfs/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al subir el PDF')
        return
      }
      onUploaded({
        id:           data.id,
        title:        data.title,
        category:     data.category ?? null,
        pageCount:    data.pageCount ?? 0,
        fileSize:     data.fileSize ?? 0,
        createdAt:    new Date().toISOString(),
        uploaderName: null,
      })
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

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

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          aria-label="Seleccionar archivo PDF"
        />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">Procesando...</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrastra un <span className="font-medium">.pdf</span> aquí o{' '}
            <span className="text-primary hover:underline">elige archivo</span>
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
