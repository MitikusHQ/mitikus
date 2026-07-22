'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSpreadsheet } from '@/app/actions/spreadsheets'
import { FortuneSheetEditor } from '../[sheetId]/_components/FortuneSheetEditor'

const EMPTY_SHEET = [{ name: 'Hoja1', celldata: [], config: {} }]

export default function NewSheetPage() {
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const router = useRouter()

  const [title, setTitle]            = useState('')
  const [data, setData]              = useState<object[]>(EMPTY_SHEET)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const id = await createSpreadsheet(workspaceId, {
        title: title || 'Sin título',
        data,
        rawText: '',
      })
      router.push(`/workspace/${workspaceId}/sheets/${id}`)
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la hoja"
          className="text-base font-semibold bg-transparent border-none outline-none flex-1"
          autoFocus
        />
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="text-sm px-4 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Creando…' : 'Crear hoja'}
        </button>
        <button
          onClick={() => router.push(`/workspace/${workspaceId}/sheets`)}
          className="text-sm px-3 py-1.5 rounded border hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <FortuneSheetEditor data={data} onChange={setData} />
      </div>
    </div>
  )
}
