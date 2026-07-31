'use client'

import { useState, useTransition } from 'react'
import { saveFiscalDeclaration, markDeclarationPresented } from '@/app/actions/fiscal-declarations'

interface Props {
  workspaceId: string
  modelo: string
  periodo: string
  year: number
  resultado: number
  getData: () => Record<string, string>
  initialStatus?: string
  initialId?: string
}

export function DeclarationSaveBar({
  workspaceId, modelo, periodo, year, resultado, getData, initialStatus, initialId,
}: Props) {
  const [status,  setStatus ] = useState<string>(initialStatus ?? '')
  const [savedId, setSavedId] = useState<string | undefined>(initialId)
  const [msg,     setMsg    ] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const dec = await saveFiscalDeclaration({
          workspaceId, modelo, periodo, year,
          data: getData(),
          resultado,
        })
        setSavedId(dec.id)
        setStatus('borrador')
        flash('Guardado ✓')
      } catch {
        flash('Error al guardar')
      }
    })
  }

  function handlePresented() {
    if (!savedId) return
    startTransition(async () => {
      try {
        await markDeclarationPresented(workspaceId, savedId)
        setStatus('presentada')
        flash('Marcada como presentada ✓')
      } catch {
        flash('Error al actualizar')
      }
    })
  }

  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-4 py-2 text-sm rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando…' : 'Guardar borrador'}
      </button>

      {savedId && status === 'borrador' && (
        <button
          onClick={handlePresented}
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Marcar como presentada
        </button>
      )}

      {status === 'presentada' && (
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
          ✓ Presentada
        </span>
      )}

      {msg && (
        <span className="text-xs text-muted-foreground">{msg}</span>
      )}
    </div>
  )
}
