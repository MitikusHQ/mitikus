'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { updateWorkspaceBranding, removeWorkspaceLogo } from '@/app/actions/branding'

interface Props {
  workspaceId: string
  logoUrl: string | null
  brandColor: string | null
  workspaceName: string
}

const PRESET_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']

export function WorkspaceBrandingClient({ workspaceId, logoUrl, brandColor, workspaceName }: Props) {
  const [logo, setLogo]         = useState(logoUrl)
  const [color, setColor]       = useState(brandColor ?? '#3B82F6')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/workspace/${workspaceId}/logo`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
      setLogo(data.url)
      setMsg('Logo actualizado')
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al subir el logo')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveLogo() {
    await removeWorkspaceLogo(workspaceId)
    setLogo(null)
    setMsg('Logo eliminado')
  }

  async function handleSaveColor() {
    setSaving(true)
    await updateWorkspaceBranding(workspaceId, { brandColor: color })
    setSaving(false)
    setMsg('Color guardado')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-1">Identidad del workspace</h2>
        <p className="text-xs text-muted-foreground">
          Tu logo y color aparecerán en el formulario público de leads y en comunicaciones externas.
        </p>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <p className="text-xs font-medium">Logo</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <Image src={logo} alt={workspaceName} width={64} height={64} className="object-contain w-full h-full" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground/40">
                {workspaceName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Subir logo'}
            </button>
            {logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="block text-xs text-red-500 hover:underline"
              >
                Eliminar logo
              </button>
            )}
            <p className="text-[10px] text-muted-foreground">PNG, JPG o SVG · Máx. 2 MB</p>
          </div>
        </div>
      </div>

      {/* Color de marca */}
      <div className="space-y-3">
        <p className="text-xs font-medium">Color de marca</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: color === c ? c : 'transparent',
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border border-border"
            title="Color personalizado"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: color }} />
          <code className="text-xs text-muted-foreground">{color}</code>
          <button
            type="button"
            onClick={handleSaveColor}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar color'}
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}
    </div>
  )
}
