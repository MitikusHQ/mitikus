'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/app/_components/ImageUploader'
import { updateWorkspaceBranding } from '@/app/actions/branding'
import { updateEmailSettings } from '@/app/actions/fiscal'
import { updateWorkspacePermissionSettings } from '@/app/actions/workspace-settings'
import type { OrgRole } from '@prisma/client'
import { LOGO_CROP_REFERENCE_FRAME, clamp, getLogoImageStyle, getLogoTextStyle } from '@/lib/logo-crop'

interface Workspace {
  id: string
  name: string
  logoUrl: string | null
  brandColor: string | null
  logoShowName: boolean
  restrictCreationToAdmins: boolean
  logoCropX: number
  logoCropY: number
  logoCropZoom: number
  logoTextX: number
  logoTextY: number
  logoTextSize: number
  logoTextColor: string
  logoTextFont: string
  companyProfile: {
    fiscalName: string | null
    fiscalEmail: string | null
    emailSendMode: string
    emailSenderName: string | null
    emailReplyTo: string | null
    emailSignature: string | null
  } | null
}

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#0EA5E9', '#6366F1', '#1E293B', '#64748B',
]

const LOGO_TEXT_FONTS = [
  'Inter',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
]

export function WorkspaceSettingsClient({ workspace, userRole }: { workspace: Workspace; userRole: OrgRole }) {
  const router = useRouter()
  const [name, setName] = useState(workspace.name)
  const [logoUrl, setLogoUrl] = useState(workspace.logoUrl ?? '')
  const [logoPreviewSize, setLogoPreviewSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    if (!logoUrl) { setLogoPreviewSize(null); return }
    const img = new Image()
    img.onload = () => setLogoPreviewSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => setLogoPreviewSize(null)
    img.src = logoUrl
  }, [logoUrl])
  const [logoShowName, setLogoShowName] = useState(workspace.logoShowName)
  const [logoCrop, setLogoCrop] = useState({
    x: workspace.logoCropX,
    y: workspace.logoCropY,
    zoom: workspace.logoCropZoom,
  })
  const [logoText, setLogoText] = useState({
    x: workspace.logoTextX,
    y: workspace.logoTextY,
    size: workspace.logoTextSize,
    color: workspace.logoTextColor,
    font: workspace.logoTextFont,
  })
  const [brandColor, setBrandColor] = useState(workspace.brandColor ?? '#3B82F6')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [emailSettings, setEmailSettings] = useState({
    mode: workspace.companyProfile?.emailSendMode ?? 'mitikus',
    senderName: workspace.companyProfile?.emailSenderName ?? workspace.companyProfile?.fiscalName ?? workspace.name,
    replyTo: workspace.companyProfile?.emailReplyTo ?? workspace.companyProfile?.fiscalEmail ?? '',
    signature: workspace.companyProfile?.emailSignature ?? '',
  })
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [restrictCreation, setRestrictCreation] = useState(workspace.restrictCreationToAdmins)
  const [permSaving, setPermSaving] = useState(false)
  const [permSaved, setPermSaved] = useState(false)
  const isOwner = userRole === 'OWNER'
  const logoFrame = LOGO_CROP_REFERENCE_FRAME
  const logoSafeZoom = Math.max(1, logoCrop.zoom)
  const logoImageStyle = getLogoImageStyle(logoPreviewSize, { ...logoCrop, zoom: logoSafeZoom }, logoFrame)
  const logoTextStyle = getLogoTextStyle(logoText, logoFrame)

  async function handleSave() {
    setSaving(true)
    await updateWorkspaceBranding(workspace.id, {
      name: name.trim() || workspace.name,
      logoUrl: logoUrl || undefined,
      brandColor,
      logoShowName,
      logoCropX: logoCrop.x,
      logoCropY: logoCrop.y,
      logoCropZoom: logoSafeZoom,
      logoTextX: logoText.x,
      logoTextY: logoText.y,
      logoTextSize: logoText.size,
      logoTextColor: logoText.color,
      logoTextFont: logoText.font,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleLogoUploaded(url: string, crop?: { x: number; y: number; zoom: number }) {
    const nextCrop = crop ?? logoCrop
    const nextSafeZoom = Math.max(1, nextCrop.zoom)
    const normalizedCrop = { ...nextCrop, zoom: nextSafeZoom }

    setLogoUrl(url)
    setLogoCrop(normalizedCrop)
    setSaving(true)
    await updateWorkspaceBranding(workspace.id, {
      name: name.trim() || workspace.name,
      logoUrl: url || undefined,
      brandColor,
      logoShowName,
      logoCropX: normalizedCrop.x,
      logoCropY: normalizedCrop.y,
      logoCropZoom: normalizedCrop.zoom,
      logoTextX: logoText.x,
      logoTextY: logoText.y,
      logoTextSize: logoText.size,
      logoTextColor: logoText.color,
      logoTextFont: logoText.font,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handlePermSave(value: boolean) {
    setPermSaving(true)
    try {
      await updateWorkspacePermissionSettings(workspace.id, value)
      setRestrictCreation(value)
      setPermSaved(true)
      setTimeout(() => setPermSaved(false), 2000)
    } finally {
      setPermSaving(false)
    }
  }

  async function handleEmailSave() {
    if (emailSaving) return
    setEmailSaving(true)
    setEmailError(null)
    try {
      await updateEmailSettings(workspace.id, {
        emailSendMode: emailSettings.mode,
        emailSenderName: emailSettings.senderName,
        emailReplyTo: emailSettings.replyTo,
        emailSignature: emailSettings.signature,
      })
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 2000)
      router.refresh()
    } catch {
      setEmailError('No se han podido guardar los ajustes de correo. Revisa tu sesión y vuelve a intentarlo.')
    } finally {
      setEmailSaving(false)
    }
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
          cropMode="wide"
          currentCrop={logoCrop}
          size={320}
          placeholder="🏢"
          onUploaded={handleLogoUploaded}
        />
        <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={logoShowName}
            onChange={(e) => setLogoShowName(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span>Mostrar el nombre encima del logo en la barra lateral</span>
        </label>

        {logoShowName && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Ajuste del nombre sobre el logo</p>
            <div className="relative h-[62px] w-full max-w-[320px] overflow-hidden rounded-lg border border-border bg-muted">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="absolute max-w-none select-none"
                  onLoad={(e) => {
                    const img = e.currentTarget
                    setLogoPreviewSize({ width: img.naturalWidth, height: img.naturalHeight })
                  }}
                  style={{
                    ...logoImageStyle,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
              <span
                className="absolute max-w-[calc(100%-16px)] truncate font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]"
                style={{
                  ...logoTextStyle,
                }}
              >
                {name}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-muted-foreground">
                Horizontal
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="1"
                  value={logoText.x}
                  onChange={(e) => setLogoText((prev) => ({ ...prev, x: Number(e.target.value) }))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Vertical
                <input
                  type="range"
                  min="2"
                  max="48"
                  step="1"
                  value={logoText.y}
                  onChange={(e) => setLogoText((prev) => ({ ...prev, y: Number(e.target.value) }))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Tamaño
                <input
                  type="range"
                  min="10"
                  max="34"
                  step="1"
                  value={logoText.size}
                  onChange={(e) => setLogoText((prev) => ({ ...prev, size: Number(e.target.value) }))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">
                Color de letra
                <input
                  type="color"
                  value={logoText.color}
                  onChange={(e) => setLogoText((prev) => ({ ...prev, color: e.target.value }))}
                  className="mt-2 h-9 w-full rounded-md border border-border bg-background"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Fuente
                <select
                  value={logoText.font}
                  onChange={(e) => setLogoText((prev) => ({ ...prev, font: e.target.value }))}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {LOGO_TEXT_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Identidad de envío */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Identidad de envío</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define cómo te verán tus clientes cuando MITIKUS prepare emails por ti.
          </p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <div className="text-sm font-semibold text-foreground">Correo gestionado por MITIKUS</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            MITIKUS prepara el envío con tu nombre visible y tu email de respuesta. El motor propio de envío procesará la cola sin pedirle al cliente que configure otra plataforma.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Nombre visible del remitente
              <input
                type="text"
                value={emailSettings.senderName}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderName: e.target.value }))}
                placeholder="Borja-Prieto"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Email de respuesta
              <input
                type="email"
                value={emailSettings.replyTo}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, replyTo: e.target.value }))}
                placeholder="borja@mitikus.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <label className="space-y-1 text-xs font-medium text-muted-foreground block">
            Firma o cierre por defecto
            <textarea
              value={emailSettings.signature}
              onChange={(e) => setEmailSettings((prev) => ({ ...prev, signature: e.target.value }))}
              placeholder="Gracias,&#10;Borja"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Las respuestas llegarán al email indicado. La entrega real se gestionará desde la infraestructura de correo de MITIKUS.
          </div>

          {emailError && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {emailError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleEmailSave}
              disabled={emailSaving}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {emailSaving ? 'Guardando…' : emailSaved ? '✓ Guardado' : 'Guardar correo'}
            </button>
          </div>
        </div>
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

      {/* Permisos de creación */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Permisos de creación</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Controla quién puede instalar herramientas y crear misiones en este workspace.
          </p>
        </div>
        <label className={`flex items-start gap-3 rounded-lg border border-border px-4 py-3 ${isOwner ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'opacity-60 cursor-not-allowed'}`}>
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={restrictCreation}
              disabled={!isOwner || permSaving}
              onChange={(e) => handlePermSave(e.target.checked)}
              className="peer sr-only"
            />
            <div className={`h-5 w-9 rounded-full transition-colors ${restrictCreation ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${restrictCreation ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <div>
            <span className="text-sm font-medium">Solo Admins y Owners pueden crear</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {restrictCreation
                ? 'Activo — Editores y rangos inferiores no pueden instalar herramientas ni crear misiones.'
                : 'Desactivado — Todos los Editores pueden instalar herramientas y crear misiones.'}
            </p>
            {!isOwner && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Solo el Owner del workspace puede cambiar este ajuste.</p>
            )}
            {permSaved && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Guardado</p>}
          </div>
        </label>
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






