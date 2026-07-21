'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createDocument } from '@/app/actions/documents'
import { TiptapEditor } from '../_components/TiptapEditor'

export default function NewDocPage() {
  const params      = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const router      = useRouter()
  const [title, setTitle]            = useState('')
  const [html, setHtml]              = useState('')
  const [rawText, setRawText]        = useState('')
  const [isPending, startTransition] = useTransition()

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml)
    setRawText(newText)
  }

  function handleCreate() {
    startTransition(async () => {
      const docId = await createDocument(workspaceId, {
        title,
        content: html,
        rawText,
      })
      router.push(`/workspace/${workspaceId}/docs/${docId}`)
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <Link
        href={`/workspace/${workspaceId}/docs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Documentación
      </Link>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del documento"
        className="w-full text-xl font-semibold bg-transparent border-0 border-b border-border focus:border-primary focus:outline-none transition-colors pb-1"
        aria-label="Título"
      />

      <TiptapEditor initialContent="" onChange={handleChange} />

      <div className="flex justify-end gap-2">
        <Link
          href={`/workspace/${workspaceId}/docs`}
          className="text-xs border border-border px-4 py-1.5 rounded-full hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creando…' : 'Crear documento'}
        </button>
      </div>
    </div>
  )
}
