'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { testEmailSettings, updateEmailSettings } from '@/app/actions/fiscal'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface WorkspaceEmailSettings {
  id: string
  name: string
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

export function EmailIntegrationClient({ workspace, locale }: { workspace: WorkspaceEmailSettings; locale: Locale }) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
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

  const providerOptions = [
    { id: 'mitikus', label: t.wsEmailMitikusLabel, desc: t.wsEmailMitikusDesc },
    { id: 'custom_smtp', label: t.wsEmailSmtpLabel, desc: t.wsEmailSmtpDesc },
    { id: 'gmail', label: t.wsEmailGmailLabel, desc: t.wsEmailGmailDesc },
    { id: 'outlook', label: t.wsEmailOutlookLabel, desc: t.wsEmailOutlookDesc },
  ] as const

  function providerHelp(mode: string) {
    if (mode === 'gmail') return t.wsEmailGmailHelp
    if (mode === 'outlook') return t.wsEmailOutlookHelp
    if (mode === 'custom_smtp') return t.wsEmailCustomHelp
    return t.wsEmailMitikusHelp
  }

  function applyProvider(mode: string) {
    setEmailSaved(false)
    setEmailTestOk(false)
    setEmailError(null)
    setEmailSettings((prev) => {
      const preferredUser = prev.smtpUser || prev.replyTo || prev.imapUser
      if (mode === 'gmail') {
        return { ...prev, mode, smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpSecure: true, smtpUser: preferredUser, imapHost: 'imap.gmail.com', imapPort: 993, imapSecure: true, imapUser: prev.imapUser || preferredUser }
      }
      if (mode === 'outlook') {
        return { ...prev, mode, smtpHost: 'smtp.office365.com', smtpPort: 587, smtpSecure: false, smtpUser: preferredUser, imapHost: 'outlook.office365.com', imapPort: 993, imapSecure: true, imapUser: prev.imapUser || preferredUser }
      }
      return { ...prev, mode }
    })
  }

  async function handleSave() {
    if (emailSaving) return
    setEmailSaving(true)
    setEmailError(null)
    try {
      const result = await updateEmailSettings(workspace.id, {
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
      if (!result.ok) {
        setEmailError(result.error)
        return
      }
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 2000)
      router.refresh()
    } catch {
      setEmailError(t.wsEmailSaveError)
    } finally {
      setEmailSaving(false)
    }
  }

  async function handleTest() {
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
    } catch {
      setEmailError(t.wsEmailTestError)
    } finally {
      setEmailTesting(false)
    }
  }

  const isConfigured = Boolean(emailSettings.replyTo || emailSettings.mode !== 'mitikus')

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t.integrationsEmailTitle}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.integrationsEmailDescription}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isConfigured ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
          {isConfigured ? t.integrationsConfigured : t.integrationsNotConfigured}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {providerOptions.map((opt) => (
          <button key={opt.id} type="button" onClick={() => applyProvider(opt.id)} className={`text-left rounded-lg border p-3 transition-colors hover:border-primary/60 ${emailSettings.mode === opt.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{opt.label}</span>
              {emailSettings.mode === opt.id && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            {t.wsSenderName}
            <input type="text" value={emailSettings.senderName} onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderName: e.target.value }))} placeholder={t.wsSenderNamePlaceholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            {t.wsReplyTo}
            <input type="email" value={emailSettings.replyTo} onChange={(e) => setEmailSettings((prev) => ({ ...prev, replyTo: e.target.value }))} placeholder={t.wsReplyToPlaceholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
        </div>

        <label className="space-y-1 text-xs font-medium text-muted-foreground block">
          {t.wsSignature}
          <textarea value={emailSettings.signature} onChange={(e) => setEmailSettings((prev) => ({ ...prev, signature: e.target.value }))} placeholder={t.wsSignaturePlaceholder.replace('{name}', workspace.name)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </label>

        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{providerHelp(emailSettings.mode)}</p>

        {emailSettings.mode !== 'mitikus' && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground">{t.wsSmtpTitle}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="sm:col-span-2 space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsSmtpServer}
                <input type="text" value={emailSettings.smtpHost} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpHost: e.target.value }))} placeholder="smtp.tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsSmtpPort}
                <input type="number" value={emailSettings.smtpPort} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPort: Number(e.target.value) }))} placeholder="587" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsSmtpUser}
                <input type="email" value={emailSettings.smtpUser} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpUser: e.target.value }))} placeholder="correo@tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsSmtpPassword}
                <input type="password" value={emailSettings.smtpPassword} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPassword: e.target.value }))} placeholder={t.wsSmtpPasswordPlaceholder} autoComplete="new-password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={emailSettings.smtpSecure} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpSecure: e.target.checked }))} className="h-4 w-4 rounded border-border" />
              {t.wsSmtpTls}
            </label>

            <p className="border-t border-border pt-3 text-xs font-semibold text-foreground">{t.wsImapTitle}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="sm:col-span-2 space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsImapServer}
                <input type="text" value={emailSettings.imapHost} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapHost: e.target.value }))} placeholder="imap.tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsImapPort}
                <input type="number" value={emailSettings.imapPort} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapPort: Number(e.target.value) }))} placeholder="993" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsImapUser}
                <input type="email" value={emailSettings.imapUser} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapUser: e.target.value }))} placeholder="correo@tuempresa.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                {t.wsImapPassword}
                <input type="password" value={emailSettings.imapPassword} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapPassword: e.target.value }))} placeholder={t.wsImapPasswordPlaceholder} autoComplete="new-password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={emailSettings.imapSecure} onChange={(e) => setEmailSettings((prev) => ({ ...prev, imapSecure: e.target.checked }))} className="h-4 w-4 rounded border-border" />
              {t.wsImapTls}
            </label>
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-muted-foreground dark:border-amber-800 dark:bg-amber-950/30">{t.wsImapNote}</p>
          </div>
        )}

        {emailError && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{emailError}</p>}
        {emailTestOk && <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-300">{t.wsEmailConnectionOk}</p>}

        <div className="flex flex-wrap justify-end gap-2">
          {emailSettings.mode !== 'mitikus' && (
            <button type="button" onClick={handleTest} disabled={emailTesting || emailSaving} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60">
              {emailTesting ? t.wsEmailTesting : emailTestOk ? t.wsEmailTestOk : t.wsEmailTest}
            </button>
          )}
          <button type="button" onClick={handleSave} disabled={emailSaving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {emailSaving ? t.wsEmailSaving : emailSaved ? t.wsEmailSaved : t.wsEmailSave}
          </button>
        </div>
      </div>
    </section>
  )
}
