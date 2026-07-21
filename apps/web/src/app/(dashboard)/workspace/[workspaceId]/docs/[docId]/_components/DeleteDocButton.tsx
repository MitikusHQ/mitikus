'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteDocument } from '@/app/actions/documents'

interface Props {
  docId:       string
  workspaceId: string
}

export function DeleteDocButton({ docId, workspaceId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteDocument(docId, workspaceId)
      router.push(`/workspace/${workspaceId}/docs`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
      aria-label="Eliminar documento"
    >
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
