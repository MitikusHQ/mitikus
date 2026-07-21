'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocumentContent } from '@/app/actions/documents'
import { TiptapEditor } from '../../_components/TiptapEditor'

interface Props {
  doc:         DocumentDetail
  workspaceId: string
}

export function DocViewerClient({ doc, workspaceId }: Props) {
  const [isEditing, setIsEditing]     = useState(false)
  const [html, setHtml]               = useState(doc.content)
  const [rawText, setRawText]         = useState('')
  const [isDirty, setIsDirty]         = useState(false)
  const [isPending, startTransition]  = useTransition()
  const router = useRouter()

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  }, [isDirty])

  useEffect(() => {
    if (isEditing) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEditing, handleBeforeUnload])

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml)
    setRawText(newText)
    setIsDirty(true)
  }

  function handleCancel() {
    setHtml(doc.content)
    setIsDirty(false)
    setIsEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateDocumentContent(doc.id, workspaceId, { content: html, rawText })
      setIsDirty(false)
      setIsEditing(false)
      router.refresh()
    })
  }

  return (
    <>
      {/* Botón Editar — visible solo en modo lectura */}
      {!isEditing && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
          >
            Editar contenido
          </button>
        </div>
      )}

      {/* Contenido */}
      {isEditing ? (
        <>
          <TiptapEditor initialContent={doc.content} onChange={handleChange} />

          {/* Barra de acciones */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-xs border border-border px-4 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg bg-card px-6 py-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </>
  )
}
