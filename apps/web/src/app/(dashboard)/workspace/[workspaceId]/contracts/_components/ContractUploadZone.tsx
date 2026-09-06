'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  workspaceId: string
  locale: Locale
}

export function ContractUploadZone({ workspaceId, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [isDragging, setIsDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError(t.contractsPdfOnlyError)
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
        setError(data.error ?? t.contractsUploadError)
        return
      }
      if (!data.id) {
        setError(t.contractsUnexpectedResponse)
        return
      }
      router.push(`/workspace/${workspaceId}/contracts/${data.id}`)
    } catch {
      setError(t.contractsConnectionError)
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
          aria-label={t.contractsSelectPdf}
        />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">{t.contractsUploading}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t.contractsUploadPromptPrefix} <span className="font-medium">.pdf</span> {' '}
            <span className="text-primary hover:underline">{t.contractsChooseFile}</span>
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
