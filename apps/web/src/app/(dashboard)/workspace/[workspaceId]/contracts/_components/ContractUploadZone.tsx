'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  workspaceId: string
}

export function ContractUploadZone({ workspaceId }: Props) {
  const [isDragging, setIsDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

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
      const res  = await fetch('/api/contracts/upload', { method: 'POST', body: formData })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Error al subir el contrato')
        return
      }
      if (!data.id) {
        setError('Respuesta inesperada del servidor')
        return
      }
      router.push(`/workspace/${workspaceId}/contracts/${data.id}`)
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
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          aria-label="Seleccionar PDF de contrato"
        />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">Subiendo contrato...</p>
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
