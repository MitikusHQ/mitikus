'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/app/_components/ImageUploader'
import { updateWorkspaceBranding } from '@/app/actions/branding'

interface Workspace {
  id: string
  name: string
  logoUrl: string | null
  brandColor: string | null
}

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#0EA5E9', '#6366F1', '#1E293B', '#64748B',
]

export function WorkspaceSettingsClient({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [name, setName] = useState(workspace.name)
  const [logoUrl, setLogoUrl] = useState(workspace.logoUrl ?? '')
  const [brandColor, setBrandColor] = useState(workspace.brandColor ?? '#3B82F6')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateWorkspaceBranding(workspace.id, {
      name: name.trim() || workspace.name,
      logoUrl: logoUrl || undefined,
      brandColor,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Logo de la empresa</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aparece en la barra lateral del workspace.
          </p>
        </div>
        <ImageUploader
          currentUrl={logoUrl || null}
          folder="mitikus/logos"
          shape="square"
          size={88}
          placeholder="🏢"
          onUploaded={(url) => setLogoUrl(url)}
        />
      </section>

      {/* Nombre */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Nombre del workspace</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visible en la barra lateral y en los correos de invitación.
          </p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </section>

      {/* Color de marca */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Color de marca</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se usa en la inicial del logo cuando no hay imagen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBrandColor(c)}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                brandColor === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
              }`}
              aria-label={`Color ${c}`}
            />
          ))}
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-8 h-8 rounded-full border border-border cursor-pointer"
            title="Color personalizado"
          />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: brandColor }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground">Vista previa de la inicial</span>
        </div>
      </section>

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
