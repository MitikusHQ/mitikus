'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/app/_components/ImageUploader'
import { updateWorkspaceBranding } from '@/app/actions/branding'
import { testEmailSettings, updateEmailSettings } from '@/app/actions/fiscal'
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
    smtpHost: string | null
    smtpPort: number | null
    smtpSecure: boolean
    smtpUser: string | null
    imapHost: string | null
    imapPort: number | null
    imapSecure: boolean
    imapUser: string | null
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

const EMAIL_PROVIDER_OPTIONS = [
  { id: 'mitikus', label: 'MITIKUS', desc: 'MITIKUS envía por ti. Las respuestas llegan al email que indiques.' },
  { id: 'custom_smtp', label: 'SMTP propio', desc: 'Hosting, webmail o correo corporativo.' },
  { id: 'gmail', label: 'Gmail', desc: 'Usa smtp.gmail.com con contraseña de aplicación.' },
  { id: 'outlook', label: 'Outlook / Microsoft 365', desc: 'Usa Microsoft 365 con SMTP AUTH activo.' },
] as const

function emailProviderHelp(mode: string) {
  if (mode === 'gmail') {
    return 'Gmail necesita una contraseña de aplicación de Google. No uses tu contraseña normal si tienes doble factor.'
  }
  if (mode === 'outlook') {
    return 'Outlook y Microsoft 365 pueden requerir activar SMTP AUTH o usar una contraseña de aplicación.'
  }
  if (mode === 'custom_smtp') {
    return 'Usa los datos de configuración manual de tu hosting: servidor SMTP, puerto, usuario y contraseña.'
  }
  return 'Las respuestas llegarán al email indicado. La entrega real se gestiona desde la infraestructura de MITIKUS.'
}

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
    smtpHost: workspace.companyProfile?.smtpHost ?? '',
    smtpPort: workspace.companyProfile?.smtpPort ?? 587,
    smtpSecure: workspace.companyProfile?.smtpSecure ?? false,
    smtpUser: workspace.companyProfile?.smtpUser ?? '',
    smtpPassword: '',
    imapHost: workspace.companyProfile?.imapHost ?? '',
    imapPort: workspace.companyProfile?.imapPort ?? 993,
    imapSecure: workspace.companyProfile?.imapSecure ?? true,
    imapUser: workspace.companyProfile?.imapUser ?? '',
    imapPassword: '',
  })
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailTesting, setEmailTesting] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailTestOk, setEmailTestOk] = useState(false)
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
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpSecure: emailSettings.smtpSecure,
        smtpUser: emailSettings.smtpUser,
        smtpPassword: emailSettings.smtpPassword || undefined,
        imapHost: emailSettings.imapHost,
        imapPort: emailSettings.imapPort,
        imapSecure: emailSettings.imapSecure,
        imapUser: emailSettings.imapUser,
        imapPassword: emailSettings.imapPassword || undefined,
      })
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 2000)
      router.refresh()
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'No se han podido guardar los ajustes de correo. Revisa tu sesión y vuelve a intentarlo.')
    } finally {
      setEmailSaving(false)
    }
  }

  function applyEmailProvider(mode: string) {
    setEmailSaved(false)
    setEmailTestOk(false)
    setEmailError(null)
    setEmailSettings((prev) => {
      const preferredUser = prev.smtpUser || prev.replyTo || prev.imapUser
      if (mode === 'gmail') {
        return {
          ...prev,
          mode,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          smtpSecure: true,
          smtpUser: preferredUser,
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          imapSecure: true,
          imapUser: prev.imapUser || preferredUser,
        }
      }
      if (mode === 'outlook') {
        return {
          ...prev,
          mode,
          smtpHost: 'smtp.office365.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: preferredUser,
          imapHost: 'outlook.office365.com',
          imapPort: 993,
          imapSecure: true,
          imapUser: prev.imapUser || preferredUser,
        }
      }
      return { ...prev, mode }
    })
  }

  async function handleEmailTest() {
    if (emailTesting) return
    setEmailTesting(true)
    setEmailSaved(false)
    setEmailTestOk(false)
    setEmailError(null)
    try {
      await testEmailSettings(workspace.id, {
        emailSendMode: emailSettings.mode,
        emailSenderName: emailSettings.senderName,
        emailReplyTo: emailSettings.replyTo,
        emailSignature: emailSettings.signature,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpSecure: emailSettings.smtpSecure,
        smtpUser: emailSettings.smtpUser,
        smtpPassword: emailSettings.smtpPassword || undefined,
        imapHost: emailSettings.imapHost,
        imapPort: emailSettings.imapPort,
        imapSecure: emailSettings.imapSecure,
        imapUser: emailSettings.imapUser,
        imapPassword: emailSettings.imapPassword || undefined,
      })
      setEmailTestOk(true)
      setTimeout(() => setEmailTestOk(false), 3000)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'No se ha podido probar la conexión SMTP.')
    } finally {
      setEmailTesting(false)
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

      {/* Correo y envíos */}
      <section className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-sm">Correo y envíos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Elige cómo salen los correos desde este workspace.
          </p>
        </div>

        {/* Selector de proveedor */}
        <div className="grid gap-2 sm:grid-cols-2">
          {EMAIL_PROVIDER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => applyEmailProvider(opt.id)}
              className={`text-left rounded-lg border p-3 transition-colors hover:border-primary/60 ${emailSettings.mode === opt.id ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{opt.label}</span>
                {emailSettings.mode === opt.id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-4">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Campos comunes */}
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Nombre visible del remitente
              <input
                type="text"
                value={emailSettings.senderName}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderName: e.target.value }))}
                placeholder="Tu empresa"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Email de respuesta
              <input
                type="email"
                value={emailSettings.replyTo}
                onChange={(e) => setEmailSettings((prev) => ({ ...prev, replyTo: e.target.value }))}
                placeholder="tu@empresa.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <label className="space-y-1 text-xs font-medium text-muted-foreground block">
            Firma o cierre por defecto
            <textarea
              value={emailSettings.signature}
              onChange={(e) => setEmailSettings((prev) => ({ ...prev, signature: e.target.value }))}
              placeholder={`Gracias,\n${workspace.name}`}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          {emailSettings.mode === 'mitikus' && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              {emailProviderHelp(emailSettings.mode)}
            </p>
          )}

          {/* Campos SMTP propio */}
          {emailSettings.mode !== 'mitikus' && (
            <div className="space-y-3 pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {emailProviderHelp(emailSettings.mode)}
              </p>
              <p className="text-xs font-semibold text-foreground pt-2">Configuración SMTP (salida)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="sm:col-span-2 space-y-1 text-xs font-medium text-muted-foreground">
                  Servidor SMTP
                  <input type="text" value={emailSettings.smtpHost} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpHost: e.target.value }))} placeholder="smtp.tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Puerto
                  <input type="number" value={emailSettings.smtpPort} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPort: Number(e.target.value) }))} placeholder="587" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Usuario / email
                  <input type="email" value={emailSettings.smtpUser} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpUser: e.target.value }))} placeholder="correo@tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Contraseña
                  <input type="password" value={emailSettings.smtpPassword} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPassword: e.target.value }))} placeholder="Déjalo vacío para no cambiarla" autoComplete="new-password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={emailSettings.smtpSecure} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpSecure: e.target.checked }))} className="h-4 w-4 rounded border-border" />
                Usar TLS directo (puerto 465)
              </label>

              <p className="text-xs font-semibold text-foreground pt-2 border-t border-border">Configuración IMAP (bandeja de entrada)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="sm:col-span-2 space-y-1 text-xs font-medium text-muted-foreground">
                  Servidor IMAP
                  <input type="text" value={emailSettings.imapHost} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapHost: e.target.value }))} placeholder="imap.tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Puerto IMAP
                  <input type="number" value={emailSettings.imapPort} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapPort: Number(e.target.value) }))} placeholder="993" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Usuario IMAP
                  <input type="email" value={emailSettings.imapUser} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapUser: e.target.value }))} placeholder="correo@tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Contraseña IMAP
                  <input type="password" value={emailSettings.imapPassword} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapPassword: e.target.value }))} placeholder="Vacío si es la misma que SMTP" autoComplete="new-password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={emailSettings.imapSecure} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapSecure: e.target.checked }))} className="h-4 w-4 rounded border-border" />
                Usar TLS (IMAPS, recomendado)
              </label>
              <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                Las contraseñas se cifran antes de guardarse. Si salida y entrada usan el mismo email, puedes dejar la contraseña IMAP vacía.
              </p>
            </div>
          )}

          {emailError && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {emailError}
            </p>
          )}
          {emailTestOk && (
            <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-300">
              Conexión de correo correcta. Ya puedes guardar esta configuración.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {emailSettings.mode !== 'mitikus' && (
              <button
                type="button"
                onClick={handleEmailTest}
                disabled={emailTesting || emailSaving}
                className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              >
                {emailTesting ? 'Probando…' : emailTestOk ? '✓ Conexión correcta' : 'Probar conexión'}
              </button>
            )}
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


