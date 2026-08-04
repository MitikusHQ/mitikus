'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRY_LABELS, LEGAL_FORM_LABELS, type Country, type LegalForm } from '@/lib/fiscal-calendar'
import { setFiscalConfig } from '@/app/actions/fiscal'
import { classifyLegalForm } from '@/app/actions/classify-legal-form'

const COUNTRIES = Object.entries(COUNTRY_LABELS) as [Country, string][]

const LEGAL_FORMS: { value: LegalForm; description: string }[] = [
  { value: 'autonomo',    description: 'Trabajas por cuenta propia con NIF/NIE' },
  { value: 'sl',          description: 'Sociedad de responsabilidad limitada' },
  { value: 'sa',          description: 'Sociedad anónima con capital en acciones' },
  { value: 'comunidad',   description: 'Comunidad de bienes' },
  { value: 'cooperativa', description: 'Cooperativa de trabajo, consumidores, etc.' },
  { value: 'asociacion',  description: 'Asociación sin ánimo de lucro' },
  { value: 'fundacion',   description: 'Fundación' },
  { value: 'otro',        description: 'No sé / otro tipo — la IA lo identifica' },
]

export function FiscalSetupPicker({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [country, setCountry] = useState<Country>('ES')

  // flujo IA para "otro"
  const [showAI, setShowAI] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiResult, setAiResult] = useState<{ form: LegalForm; explanation: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

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

  function handleSelect(value: LegalForm) {
    if (value === 'otro') {
      setShowAI(true)
      setAiResult(null)
      setAiInput('')
    } else {
      handleConfirm(value)
    }
  }

  async function handleClassify() {
    if (!aiInput.trim()) return
    setAiLoading(true)
    try {
      const result = await classifyLegalForm(aiInput)
      setAiResult(result)
    } finally {
      setAiLoading(false)
    }
  }

  if (showAI) {
    return (
      <div className="max-w-lg mx-auto py-12 px-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl">🤖</div>
          <h2 className="text-lg font-semibold">Identificar forma jurídica con IA</h2>
          <p className="text-sm text-muted-foreground">
            Describe tu entidad y Claude te dirá qué forma jurídica es.
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            value={aiInput}
            onChange={(e) => { setAiInput(e.target.value); setAiResult(null) }}
            placeholder="Ej: somos tres socios que montamos un negocio de reparto sin constitución formal…"
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <button
            onClick={handleClassify}
            disabled={aiLoading || !aiInput.trim()}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {aiLoading ? 'Identificando…' : 'Identificar con IA →'}
          </button>
        </div>

        {aiResult && (
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Forma identificada</p>
              <p className="font-semibold">{LEGAL_FORM_LABELS[aiResult.form]}</p>
              <p className="text-sm text-muted-foreground">{aiResult.explanation}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirm(aiResult.form)}
                disabled={isPending}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Guardando…' : 'Confirmar →'}
              </button>
              <button
                onClick={() => setAiResult(null)}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted/40 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAI(false)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </button>
      </div>
    )
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
                onClick={() => handleSelect(opt.value)}
                disabled={isPending}
                className={`rounded-xl border bg-card p-3 hover:border-primary/50 hover:bg-muted/30 transition-all text-left disabled:opacity-50 ${
                  opt.value === 'otro' ? 'border-dashed' : ''
                }`}
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
