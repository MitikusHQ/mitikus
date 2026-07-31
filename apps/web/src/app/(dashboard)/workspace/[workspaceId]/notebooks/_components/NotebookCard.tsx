'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNotebook } from '@/app/actions/notebooks'
import type { NotebookData } from '@/app/actions/notebooks'
import { CommentBadge } from '@/components/resource-drawer'

interface Props {
  notebook:      NotebookData
  workspaceId:   string
  currentUserId: string
}

export function NotebookCard({ notebook, workspaceId, currentUserId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('¿Eliminar este notebook?')) return
    setDeleting(true)
    await deleteNotebook(notebook.id, workspaceId)
    router.refresh()
  }

  return (
    <Link
      href={`/workspace/${workspaceId}/notebooks/${notebook.id}`}
      className="group relative flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
    >
      <p className="font-medium text-sm truncate pr-6">{notebook.title}</p>
      <p className="text-xs text-muted-foreground">
        {notebook.sourceCount} {notebook.sourceCount === 1 ? 'fuente' : 'fuentes'} ·{' '}
        {new Date(notebook.createdAt).toLocaleDateString('es-ES')}
      </p>
      <div className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1">
        <CommentBadge
          workspaceId={workspaceId}
          resourceType="notebook"
          resourceId={notebook.id}
          resourceTitle={notebook.title}
          currentUserId={currentUserId}
        />
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-destructive text-sm"
        >
          ×
        </button>
      </div>
    </Link>
  )
}
