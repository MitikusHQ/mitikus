'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBillingProfile } from '@/app/actions/fiscal'

interface BillingProfileForm {
  fiscalName: string
  nif: string
  fiscalAddress: string
  fiscalPostalCode: string
  fiscalCity: string
  fiscalProvince: string
  fiscalCountry: string
  fiscalEmail: string
  fiscalPhone: string
  tradeRegistry: string
  iban: string
  defaultPaymentNotes: string
}

export function NifForm({ workspaceId, profile }: { workspaceId: string; profile: BillingProfileForm }) {
  const router = useRouter()
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const compactIban = form.iban.replace(/\s+/g, '').toUpperCase()
  const spanishIban = compactIban.startsWith('ES') ? compactIban : ''
  const ibanParts = {
    countryControl: spanishIban.slice(0, 4),
    bank: spanishIban.slice(4, 8),
    branch: spanishIban.slice(8, 12),
    accountControl: spanishIban.slice(12, 14),
    account: spanishIban.slice(14, 24),
  }

  function updateField(field: keyof BillingProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setSaved(false)
    setError(null)
  }

  function updateSpanishIbanPart(part: keyof typeof ibanParts, value: string) {
    const clean = value.replace(/\D/g, '')
    const next = {
      ...ibanParts,
      [part]: part === 'countryControl'
        ? `ES${clean.slice(0, 2)}`
        : clean,
    }
    updateField('iban', `${next.countryControl}${next.bank}${next.branch}${next.accountControl}${next.account}`)
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await updateBillingProfile(workspaceId, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch {
      setError('No se han podido guardar los datos. Revisa tu sesión y vuelve a intentarlo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Datos de facturación</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Se mostrarán como datos del emisor en tus facturas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Nombre fiscal / razón social
          <input
            type="text"
            value={form.fiscalName}
            onChange={(e) => updateField('fiscalName', e.target.value)}
            placeholder="Borja Prieto Valera"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          NIF / CIF
          <input
            type="text"
            value={form.nif}
            onChange={(e) => updateField('nif', e.target.value.toUpperCase())}
            placeholder="12345678A"
            maxLength={9}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-2">
          Domicilio fiscal
          <input
            type="text"
            value={form.fiscalAddress}
            onChange={(e) => updateField('fiscalAddress', e.target.value)}
            placeholder="Calle, número, piso..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Código postal
          <input
            type="text"
            value={form.fiscalPostalCode}
            onChange={(e) => updateField('fiscalPostalCode', e.target.value)}
            placeholder="28001"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Ciudad
          <input
            type="text"
            value={form.fiscalCity}
            onChange={(e) => updateField('fiscalCity', e.target.value)}
            placeholder="Madrid"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Provincia / región
          <input
            type="text"
            value={form.fiscalProvince}
            onChange={(e) => updateField('fiscalProvince', e.target.value)}
            placeholder="Madrid"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          País
          <input
            type="text"
            value={form.fiscalCountry}
            onChange={(e) => updateField('fiscalCountry', e.target.value)}
            placeholder="España"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Email fiscal
          <input
            type="email"
            value={form.fiscalEmail}
            onChange={(e) => updateField('fiscalEmail', e.target.value)}
            placeholder="facturacion@empresa.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Teléfono
          <input
            type="text"
            value={form.fiscalPhone}
            onChange={(e) => updateField('fiscalPhone', e.target.value)}
            placeholder="+34 600 000 000"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-2">
          Registro / datos societarios
          <textarea
            value={form.tradeRegistry}
            onChange={(e) => updateField('tradeRegistry', e.target.value)}
            rows={2}
            placeholder="Registro mercantil, colegio profesional u otros datos legales opcionales."
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <div className="space-y-3 sm:col-span-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">IBAN español</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Rellena las casillas si la cuenta es española. Se guardará como IBAN completo.
            </p>
          </div>
          <div className="grid grid-cols-[80px_1fr_1fr_70px_2fr] gap-2">
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
              IBAN
              <input
                type="text"
                value={ibanParts.countryControl}
                onChange={(e) => updateSpanishIbanPart('countryControl', e.target.value)}
                placeholder="ES21"
                maxLength={4}
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
              Banco
              <input
                type="text"
                inputMode="numeric"
                value={ibanParts.bank}
                onChange={(e) => updateSpanishIbanPart('bank', e.target.value.slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
              Sucursal
              <input
                type="text"
                inputMode="numeric"
                value={ibanParts.branch}
                onChange={(e) => updateSpanishIbanPart('branch', e.target.value.slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
              Control
              <input
                type="text"
                inputMode="numeric"
                value={ibanParts.accountControl}
                onChange={(e) => updateSpanishIbanPart('accountControl', e.target.value.slice(0, 2))}
                placeholder="00"
                maxLength={2}
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
              Cuenta
              <input
                type="text"
                inputMode="numeric"
                value={ibanParts.account}
                onChange={(e) => updateSpanishIbanPart('account', e.target.value.slice(0, 10))}
                placeholder="0000000000"
                maxLength={10}
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          <label className="space-y-1 text-xs font-medium text-muted-foreground block">
            IBAN completo / internacional
            <input
              type="text"
              value={form.iban}
              onChange={(e) => updateField('iban', e.target.value.replace(/\s+/g, '').toUpperCase())}
              placeholder="ES21 0000 0000 00 0000000000 o IBAN internacional"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
        <label className="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-2">
          Notas de pago por defecto
          <textarea
            value={form.defaultPaymentNotes}
            onChange={(e) => updateField('defaultPaymentNotes', e.target.value)}
            rows={2}
            placeholder="Pago por transferencia. Indica el número de factura en el concepto."
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>
      <div className="flex flex-col items-end gap-2">
        {error && (
          <p className="max-w-md rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-right text-xs text-red-300">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
