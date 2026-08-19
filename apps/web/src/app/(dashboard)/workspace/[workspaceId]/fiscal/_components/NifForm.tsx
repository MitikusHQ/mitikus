'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateNif } from '@/app/actions/fiscal'

export function NifForm({ workspaceId, currentNif }: { workspaceId: string; currentNif: string | null }) {
  const router = useRouter()
  const [nif, setNif] = useState(currentNif ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateNif(workspaceId, nif)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">NIF / CIF del emisor</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Requerido para generar facturas con QR Verifactu (RD 1007/2023).
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={nif}
          onChange={(e) => { setNif(e.target.value.toUpperCase()); setSaved(false) }}
          placeholder="12345678A"
          maxLength={9}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !nif.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
