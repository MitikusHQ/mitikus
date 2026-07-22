'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSpreadsheet } from '@/app/actions/spreadsheets'

interface Props {
  sheetId:     string
  workspaceId: string
}

export function DeleteSheetButton({ sheetId, workspaceId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm('¿Eliminar esta hoja de cálculo? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteSpreadsheet(sheetId, workspaceId)
      router.push(`/workspace/${workspaceId}/sheets`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Eliminando…' : 'Eliminar hoja'}
    </button>
  )
}
