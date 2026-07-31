'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLegalForm } from '@/app/actions/fiscal'
import { LEGAL_FORM_LABELS, type LegalForm } from '@/lib/fiscal-calendar'

const OPTIONS: { value: LegalForm; emoji: string; description: string }[] = [
  { value: 'autonomo', emoji: '🧑‍💼', description: 'Trabajas por cuenta propia con NIF/NIE' },
  { value: 'sl',       emoji: '🏢', description: 'Sociedad de responsabilidad limitada' },
  { value: 'sa',       emoji: '🏦', description: 'Sociedad anónima con capital en acciones' },
  { value: 'otro',     emoji: '📋', description: 'Cooperativa, asociación u otra forma' },
]

export function LegalFormPicker({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSelect(value: LegalForm) {
    startTransition(async () => {
      await setLegalForm(workspaceId, value)
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-6 text-center space-y-8">
      <div className="space-y-2">
        <div className="text-4xl">🗓️</div>
        <h2 className="text-xl font-semibold">Calendario fiscal personalizado</h2>
        <p className="text-sm text-muted-foreground">
          Dime cuál es tu forma jurídica y te mostraré exactamente qué debes presentar y cuándo.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={isPending}
            className="rounded-xl border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-all text-left disabled:opacity-50"
          >
            <div className="text-2xl mb-2">{opt.emoji}</div>
            <div className="font-medium text-sm">{LEGAL_FORM_LABELS[opt.value]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
