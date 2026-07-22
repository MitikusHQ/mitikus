'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePdf } from '@/app/actions/pdfs'

interface Props {
  pdfId:       string
  workspaceId: string
}

export function DeletePdfButton({ pdfId, workspaceId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm('¿Eliminar este PDF? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deletePdf(pdfId, workspaceId)
      router.push(`/workspace/${workspaceId}/pdfs`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Eliminando…' : 'Eliminar PDF'}
    </button>
  )
}
