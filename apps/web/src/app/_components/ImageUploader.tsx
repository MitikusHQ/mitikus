'use client'

import { useRef, useState } from 'react'

interface ImageUploaderProps {
  currentUrl?: string | null
  folder: string
  shape?: 'circle' | 'square'
  size?: number
  placeholder?: string
  onUploaded: (url: string) => void
}

export function ImageUploader({
  currentUrl,
  folder,
  shape = 'square',
  size = 80,
  placeholder = '?',
  onUploaded,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const borderRadius = shape === 'circle' ? '50%' : '10px'

  async function handleFile(file: File) {
    setError(null)
    setLoading(true)
    const local = URL.createObjectURL(file)
    setPreview(local)

    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al subir la imagen')
      setPreview(currentUrl ?? null)
    } else {
      onUploaded(data.url)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{ width: size, height: size, borderRadius }}
        className="relative overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-muted/40 group"
        aria-label="Cambiar imagen"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Imagen actual" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl text-muted-foreground">{placeholder}</span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
        </div>
      </button>

      <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 5 MB</p>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
