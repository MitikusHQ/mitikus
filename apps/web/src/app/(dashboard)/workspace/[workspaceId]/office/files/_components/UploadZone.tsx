'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  workspaceId: string
  folderId: string | null
  onUploaded: () => void
}

const ACCEPTED = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt,.md,.json,.zip'

export function UploadZone({ workspaceId, folderId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  async function uploadFiles(files: FileList) {
    setUploading(true)
    const arr = Array.from(files)
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]!
      setProgress(`Subiendo ${i + 1}/${arr.length}: ${file.name}`)
      const fd = new FormData()
      fd.append('file', file)
      if (folderId) fd.append('folderId', folderId)
      await fetch(`/api/workspace/${workspaceId}/files/upload`, { method: 'POST', body: fd })
    }
    setUploading(false)
    setProgress(null)
    onUploaded()
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files) }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
        uploading && 'pointer-events-none',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => { if (e.target.files) uploadFiles(e.target.files) }}
      />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-muted-foreground" aria-hidden>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      {uploading ? (
        <p className="text-sm text-muted-foreground">{progress}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Arrastra archivos o haz clic para seleccionar</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">PDF, DOCX, XLSX, imágenes, TXT, MD, JSON, ZIP — máx. 50 MB</p>
        </>
      )}
    </div>
  )
}
