'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePresentation } from '@/app/actions/presentations'
import type { PresentationData } from '@/app/actions/presentations'

interface Props {
  presentation: PresentationData
  workspaceId:  string
}

export function PresentationCard({ presentation, workspaceId }: Props) {
  const router   = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('¿Eliminar esta presentación?')) return
    setDeleting(true)
    await deletePresentation(presentation.id)
    router.refresh()
  }

  function handleCopyLink(e: React.MouseEvent) {
    e.preventDefault()
    void navigator.clipboard.writeText(`https://www.mitikus.com/p/${presentation.shareToken}`)
  }

  return (
    <Link
      href={`/workspace/${workspaceId}/presentations/${presentation.id}`}
      className="group relative flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
    >
      <div
        className="h-1 w-8 rounded-full mb-1"
        style={{ backgroundColor: presentation.accentColor }}
      />
      <p className="font-medium text-sm truncate">{presentation.title}</p>
      <p className="text-xs text-muted-foreground">
        {presentation.slideCount} {presentation.slideCount === 1 ? 'slide' : 'slides'} ·{' '}
        {new Date(presentation.createdAt).toLocaleDateString('es-ES')}
      </p>
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopyLink}
          title="Copiar link público"
          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
        >
          🔗
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Eliminar"
          className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs"
        >
          ×
        </button>
      </div>
    </Link>
  )
}
