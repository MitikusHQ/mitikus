'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRY_LABELS, LEGAL_FORM_LABELS, type Country, type LegalForm } from '@/lib/fiscal-calendar'
import { setFiscalConfig } from '@/app/actions/fiscal'

const COUNTRIES = Object.entries(COUNTRY_LABELS) as [Country, string][]

const LEGAL_FORMS: { value: LegalForm; description: string }[] = [
  { value: 'autonomo',  description: 'Trabajas por cuenta propia con NIF/NIE' },
  { value: 'sl',        description: 'Sociedad de responsabilidad limitada' },
  { value: 'sa',        description: 'Sociedad anónima con capital en acciones' },
  { value: 'comunidad', description: 'Comunidad de bienes' },
  { value: 'otro',      description: 'Cooperativa, asociación u otra forma' },
]

export function FiscalSetupPicker({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [country, setCountry] = useState<Country>('ES')

  async function handleConfirm(legalForm?: LegalForm) {
    setIsPending(true)
    try {
      await setFiscalConfig(workspaceId, country, legalForm)
      router.push(`/workspace/${workspaceId}/fiscal`)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="text-4xl">🗓️</div>
        <h2 className="text-xl font-semibold">Calendario fiscal personalizado</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona tu país para ver tus obligaciones fiscales exactas.
        </p>
      </div>

      {/* País */}
      <div className="space-y-2">
        <label className="text-sm font-medium">País fiscal</label>
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map(([code, label]) => (
            <button
              key={code}
              onClick={() => setCountry(code)}
              className={`rounded-lg border px-3 py-2 text-sm text-left transition-all ${
                country === code
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-input hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Forma jurídica — solo para ES */}
      {country === 'ES' ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Forma jurídica</label>
          <div className="grid grid-cols-2 gap-2">
            {LEGAL_FORMS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleConfirm(opt.value)}
                disabled={isPending}
                className="rounded-xl border bg-card p-3 hover:border-primary/50 hover:bg-muted/30 transition-all text-left disabled:opacity-50"
              >
                <div className="font-medium text-sm">{LEGAL_FORM_LABELS[opt.value]}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => handleConfirm()}
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Configurando…' : `Ver calendario ${COUNTRY_LABELS[country]} →`}
        </button>
      )}
    </div>
  )
}
