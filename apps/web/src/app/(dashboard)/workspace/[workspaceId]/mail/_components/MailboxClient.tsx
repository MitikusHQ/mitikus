'use client'

import { useMemo, useState, useTransition } from 'react'
import type { MailFolder, WorkspaceMailMessage } from '@/app/actions/mail'
import { deleteMailMessagePermanently, getMailboxMessages, markMailAsRead, moveMailMessageToTrash, saveWorkspaceMailDraft, sendWorkspaceMail, syncMailboxForWorkspace } from '@/app/actions/mail'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'
import { TAG_COLORS, TAG_LABELS, type MailTag } from '@/lib/mail/mail-tagger'

interface MailContact {
  id: string
  name: string
  email: string
  contactName: string | null
  sector: string | null
  clientType: string | null
}

interface Props {
  workspaceId: string
  initialMessages: WorkspaceMailMessage[]
  initialToEmail?: string
  contacts: MailContact[]
  defaultSignature?: string | null
  hasSmtpConfig?: boolean
  hasImapConfig?: boolean
  locale: Locale
}

function fmtDate(value: string | null, locale: string) {
  if (!value) return ''
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayPeer(message: WorkspaceMailMessage, noSender: string, noRecipient: string) {
  const context = clientContextLabel(message)
  if (context) return context
  if (message.direction === 'inbound') {
    return message.fromName || message.fromEmail || noSender
  }
  return message.toEmail || noRecipient
}

function peerEmail(message: WorkspaceMailMessage) {
  return message.direction === 'inbound' ? message.fromEmail : message.toEmail
}

function clientContextLabel(message: WorkspaceMailMessage) {
  if (!message.clientName) return null
  const parts = [message.clientContactName, message.clientName, message.clientSector].filter(Boolean)
  return Array.from(new Set(parts)).join(' · ')
}

function clientTypeLabel(value: string | null, fallback = 'Client') {
  const labels: Record<string, string> = {
    company: 'Company',
    freelancer: 'Freelancer',
    individual: 'Individual',
    patient: 'Patient',
    student: 'Student',
    athlete: 'Athlete',
    event: 'Event',
    client: 'Client',
  }
  return value ? labels[value] ?? fallback : fallback
}

function clientContextDetails(message: WorkspaceMailMessage) {
  const rows: Array<[string, string]> = []
  if (message.clientContactName) rows.push(['Contact', message.clientContactName])
  if (message.clientName) rows.push(['Client', message.clientName])
  if (message.clientSector) rows.push(['Sector', message.clientSector])
  if (message.clientType) rows.push(['Type', clientTypeLabel(message.clientType)])
  const email = peerEmail(message)
  if (email) rows.push(['Email', email])
  if (message.invoiceNumber) rows.push(['Invoice', message.invoiceNumber])
  return rows
}

function ClientContextPopover({ message, position = 'top' }: { message: WorkspaceMailMessage; position?: 'top' | 'bottom' }) {
  const details = clientContextDetails(message)
  if (details.length === 0) return null
  const text = details.map(([label, value]) => `${label}: ${value}`).join(' · ')

  return (
    <div className={`pointer-events-none absolute left-3 right-3 z-30 hidden rounded-sm border border-border bg-card px-2 py-1 text-[11px] leading-4 text-foreground shadow-md group-hover:block ${position === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'}`}>
      {text}
    </div>
  )
}

function contactSearchText(contact: MailContact) {
  return [contact.name, contact.contactName, contact.email, contact.sector, clientTypeLabel(contact.clientType)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function contactLabel(contact: MailContact) {
  const parts = [contact.contactName, contact.name, contact.sector].filter(Boolean)
  return Array.from(new Set(parts)).join(' · ')
}

function RecipientInput({
  label,
  value,
  onChange,
  contacts,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  contacts: MailContact[]
  placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  const query = value.trim().toLowerCase()
  const suggestions = query.length === 0
    ? []
    : contacts
        .filter((contact) => contactSearchText(contact).includes(query))
        .slice(0, 6)

  return (
    <label className="relative block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        className="w-full rounded-md border bg-background px-3 py-2"
        placeholder={placeholder}
        autoComplete="off"
      />
      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-border bg-card text-foreground shadow-xl">
          {suggestions.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(contact.email)
                setFocused(false)
              }}
              className="block w-full border-b border-border bg-card px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
            >
              <span className="block truncate text-sm font-medium">{contactLabel(contact)}</span>
              <span className="block truncate text-xs text-muted-foreground">{contact.email}</span>
            </button>
          ))}
        </div>
      )}
    </label>
  )
}

function statusClass(status: string) {
  if (status === 'sent' || status === 'received') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  if (status === 'failed') return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
  if (status === 'draft') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
}

function replySubject(value: string, noSubject: string) {
  const subject = value.trim() || noSubject
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`
}

function quoteBody(message: WorkspaceMailMessage, locale: string, on: string, wrote: string, noSender: string, noRecipient: string) {
  const date = fmtDate(message.sentAt ?? message.createdAt, locale)
  const author = message.direction === 'inbound'
    ? message.fromName || message.fromEmail || noSender
    : message.toEmail || noRecipient
  const quoted = message.body
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
  return `\n\n${on} ${date}, ${author} ${wrote}:\n${quoted}`
}

export function MailboxClient({ workspaceId, initialMessages, initialToEmail = '', contacts, defaultSignature, hasSmtpConfig = true, hasImapConfig = true, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const FOLDERS: Array<{ id: MailFolder; label: string }> = [
    { id: 'inbox', label: t.mailFolderInbox },
    { id: 'sent', label: t.mailFolderSent },
    { id: 'drafts', label: t.mailFolderDrafts },
    { id: 'spam', label: t.mailFolderSpam },
    { id: 'trash', label: t.mailFolderTrash },
  ]
  const STATUS_LABELS: Record<string, string> = {
    queued: t.mailStatusQueued,
    sending: t.mailStatusSending,
    sent: t.mailStatusSent,
    failed: t.mailStatusFailed,
    canceled: t.mailStatusCanceled,
    received: t.mailStatusReceived,
    draft: t.mailStatusDraft,
    spam: t.mailStatusSpam,
    trash: t.mailStatusTrash,
  }
  const [folder, setFolder] = useState<MailFolder>('inbox')
  const [messages, setMessages] = useState(initialMessages)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelMinimized, setPanelMinimized] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyOpen, setReplyOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(Boolean(initialToEmail))
  const [toEmail, setToEmail] = useState(initialToEmail)
  const [ccEmail, setCcEmail] = useState('')
  const [bccEmail, setBccEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(defaultSignature ? `\n\n${defaultSignature}` : '')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages
    const q = search.toLowerCase()
    return messages.filter((m) =>
      m.subject?.toLowerCase().includes(q) ||
      m.fromEmail?.toLowerCase().includes(q) ||
      m.fromName?.toLowerCase().includes(q) ||
      m.toEmail?.toLowerCase().includes(q) ||
      m.body?.toLowerCase().includes(q)
    )
  }, [messages, search])

  const selected = useMemo(
    () => selectedId ? (messages.find((message) => message.id === selectedId) ?? null) : null,
    [messages, selectedId],
  )

  function loadFolder(nextFolder: MailFolder) {
    setFolder(nextFolder)
    setNotice(null)
    setError(null)
    setSelectedId(null)
    startTransition(async () => {
      try {
        const result = await getMailboxMessages(workspaceId, nextFolder)
        setMessages(result.messages)
        setSelectedId(result.messages[0]?.id ?? null)
      } catch {
        setMessages([])
        setSelectedId(null)
        setError(t.mailLoadError)
      }
    })
  }

  function resetCompose() {
    setToEmail('')
    setCcEmail('')
    setBccEmail('')
    setSubject('')
    setBody('')
    setComposeOpen(false)
  }

  function handleSend() {
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        const result = await sendWorkspaceMail(workspaceId, { toEmail, ccEmail, bccEmail, subject, body })
        if (!result.ok) {
          setError(result.error)
          return
        }
        resetCompose()
        setNotice(t.mailSentNotice)
        loadFolder('sent')
      } catch {
        setError(t.mailSendError)
      }
    })
  }

  function handleDraft() {
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        await saveWorkspaceMailDraft(workspaceId, { toEmail, ccEmail, bccEmail, subject, body })
        resetCompose()
        setNotice(t.mailDraftSaved)
        loadFolder('drafts')
      } catch {
        setError(t.mailDraftError)
      }
    })
  }

  function handleSync() {
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        const result = await syncMailboxForWorkspace(workspaceId)
        const inbox = await getMailboxMessages(workspaceId, 'inbox')
        setFolder('inbox')
        setMessages(inbox.messages)
        setSelectedId(inbox.messages[0]?.id ?? null)
        if (result.errors.length > 0) {
          const errMsg = result.errors[0]?.error ?? t.mailSyncError
          if (result.imported === 0) {
            setError(errMsg)
            return
          }
          setNotice(`${result.imported} ${t.mailImportPartialNotice}`)
        } else {
          setNotice(
            result.imported > 0
              ? `${result.imported} ${t.mailImportNotice}`
              : t.mailUpToDate,
          )
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : t.mailSyncError)
      }
    })
  }

  function handleSelect(message: WorkspaceMailMessage) {
    setSelectedId(message.id)
    setPanelMinimized(false)
    setReplyOpen(false)
    setReplyBody(defaultSignature ? `\n\n${defaultSignature}` : '')
    if (!message.isRead && message.direction === 'inbound') {
      setMessages((prev) => prev.map((m) => m.id === message.id ? { ...m, isRead: true } : m))
      void markMailAsRead(workspaceId, message.id, true)
    }
  }

  function closePanel() {
    setSelectedId(null)
    setReplyOpen(false)
    setReplyBody('')
  }

  function handleQuickReply() {
    if (!selected || !replyBody.trim()) return
    const recipient = selected.replyTo || selected.fromEmail || (selected.direction === 'outbound' ? selected.toEmail : '')
    if (!recipient) { setError(t.mailNoReplyError); return }
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        const result = await sendWorkspaceMail(workspaceId, {
          toEmail: recipient,
          ccEmail: '',
          bccEmail: '',
          subject: replySubject(selected.subject, t.mailNoSubject),
          body: replyBody,
        })
        if (!result.ok) { setError(result.error); return }
        setReplyBody('')
        setReplyOpen(false)
        setNotice(t.mailSentNotice)
        loadFolder('sent')
        closePanel()
      } catch {
        setError(t.mailSendError)
      }
    })
  }

  function handleReply(message: WorkspaceMailMessage) {
    const recipient = message.replyTo || message.fromEmail || (message.direction === 'outbound' ? message.toEmail : '')
    if (!recipient) {
      setError(t.mailNoReplyError)
      return
    }
    setNotice(null)
    setError(null)
    setSelectedId(null)
    setToEmail(recipient)
    setCcEmail('')
    setBccEmail('')
    setSubject(replySubject(message.subject, t.mailNoSubject))
    setBody(quoteBody(message, locale, t.mailQuotedOn, t.mailQuotedWrote, t.mailNoSender, t.mailNoRecipient))
    setComposeOpen(true)
  }

  function handleForward(message: WorkspaceMailMessage) {
    setNotice(null)
    setError(null)
    setSelectedId(null)
    setToEmail('')
    setCcEmail('')
    setBccEmail('')
    setSubject(`Fwd: ${message.subject || t.mailNoSubject}`)
    setBody(quoteBody(message, locale, t.mailQuotedOn, t.mailQuotedWrote, t.mailNoSender, t.mailNoRecipient))
    setComposeOpen(true)
  }

  function removeSelectedFromList(messageId: string) {
    setMessages((prev) => prev.filter((message) => message.id !== messageId))
    setSelectedId(null)
  }

  function handleDeleteMessage(message: WorkspaceMailMessage) {
    const permanent = folder === 'trash'
    const confirmed = window.confirm(permanent ? t.mailDeletePermanentConfirm : t.mailDeleteConfirm)
    if (!confirmed) return
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        if (permanent) {
          await deleteMailMessagePermanently(workspaceId, message.id)
          setNotice(t.mailDeletedPermanent)
        } else {
          await moveMailMessageToTrash(workspaceId, message.id)
          setNotice(t.mailMovedToTrash)
        }
        removeSelectedFromList(message.id)
      } catch {
        setError(t.mailDeleteError)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FOLDERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => loadFolder(item.id)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-md px-2.5 text-sm font-medium transition ${folder === item.id ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}
            >
              {item.label}
            </button>
          ))}
          <div className="flex-1" />
          <button type="button" onClick={handleSync} disabled={isPending} className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60">
            {isPending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
            {t.mailRefresh}
          </button>
          <button type="button" onClick={() => { resetCompose(); setComposeOpen(true) }} className="flex h-9 shrink-0 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {t.mailCompose}
          </button>
        </div>
      </div>

      {!hasImapConfig && !hasSmtpConfig && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          {t.mailNoSmtpNoImap}{' '}<a href={`/workspace/${workspaceId}/settings`} className="font-medium underline underline-offset-2">{t.mailConfigureLink}</a>
        </div>
      )}
      {hasSmtpConfig && !hasImapConfig && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          {t.mailSmtpOnlyWarning}{' '}<a href={`/workspace/${workspaceId}/settings`} className="font-medium underline underline-offset-2">{t.mailConfigureLink}</a>
        </div>
      )}
      {!hasSmtpConfig && hasImapConfig && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          {t.mailImapOnlyWarning}{' '}<a href={`/workspace/${workspaceId}/settings`} className="font-medium underline underline-offset-2">{t.mailConfigureLink}</a>
        </div>
      )}
      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      {composeOpen && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.mailNewMessage}</h2>
            <button type="button" onClick={() => setComposeOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">{t.mailClose}</button>
          </div>
          <div className="space-y-3">
            <RecipientInput label={t.mailToLabel} value={toEmail} onChange={setToEmail} contacts={contacts} placeholder={t.mailToPlaceholder} />
            <div className="grid gap-3 md:grid-cols-2">
              <RecipientInput label={t.mailCcLabel} value={ccEmail} onChange={setCcEmail} contacts={contacts} placeholder={t.mailCcPlaceholder} />
              <RecipientInput label={t.mailBccLabel} value={bccEmail} onChange={setBccEmail} contacts={contacts} placeholder={t.mailCcPlaceholder} />
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t.mailSubjectLabel}</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder={t.mailSubjectPlaceholder} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t.mailBodyLabel}</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-background px-3 py-2" placeholder={t.mailBodyPlaceholder} />
            </label>
          </div>
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {t.mailAttachmentsNote}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={handleDraft} disabled={isPending} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">{t.mailSaveDraft}</button>
            <button type="button" onClick={handleSend} disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{t.mailSend}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-3 py-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="max-h-[620px] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">{t.mailNoMessages}</div>
          ) : filteredMessages.map((message, index) => {
            const unread = !message.isRead && message.direction === 'inbound'
            return (
              <button
                key={message.id}
                type="button"
                onClick={() => handleSelect(message)}
                className="group relative block w-full overflow-visible border-b px-4 py-3 text-left hover:bg-muted/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {unread && <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />}
                    <span className={`truncate text-sm ${unread ? 'font-bold' : 'font-semibold'}`}>{displayPeer(message, t.mailNoSender, t.mailNoRecipient)}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(message.sentAt ?? message.createdAt, locale)}</span>
                </div>
                {peerEmail(message) && <div className="mt-1 truncate text-xs text-muted-foreground">{peerEmail(message)}</div>}
                <div className={`mt-1 truncate text-sm ${unread ? 'font-medium' : ''}`}>{message.subject || t.mailNoSubject}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded-full px-2 py-0.5 ${statusClass(message.status)}`}>{STATUS_LABELS[message.status] ?? message.status}</span>
                  {message.tag && message.direction === 'inbound' && (
                    <span className={`rounded-full px-2 py-0.5 ${TAG_COLORS[message.tag as MailTag] ?? TAG_COLORS.otro}`}>
                      {TAG_LABELS[message.tag as MailTag] ?? message.tag}
                    </span>
                  )}
                  {message.invoiceNumber && <span>{t.mailInvoiceBadge} {message.invoiceNumber}</span>}
                </div>
                <ClientContextPopover message={message} position={index === 0 ? 'bottom' : 'top'} />
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className={`fixed bottom-0 right-4 z-50 flex w-full max-w-lg flex-col rounded-t-xl border border-b-0 bg-card shadow-2xl transition-all duration-200 sm:right-6 sm:w-[480px] ${panelMinimized ? 'max-h-12' : 'max-h-[70vh]'}`}>
          {/* Header */}
          <div className="flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-t-xl bg-foreground px-4 py-3 text-background" onClick={() => setPanelMinimized((v) => !v)}>
            <span className="flex-1 truncate text-sm font-semibold">{selected.subject || t.mailNoSubject}</span>
            <span className="shrink-0 text-xs opacity-70">{fmtDate(selected.sentAt ?? selected.createdAt, locale)}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPanelMinimized((v) => !v) }}
              className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
              title={panelMinimized ? 'Expandir' : 'Minimizar'}
            >
              {panelMinimized
                ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              }
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closePanel() }}
              className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {!panelMinimized && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {/* Meta */}
              <div className="shrink-0 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{t.mailFromLabel}:</span>
                  <span>{selected.fromName || selected.fromEmail || t.mailNoSender}</span>
                  {selected.fromEmail && selected.fromName && <span className="opacity-60">&lt;{selected.fromEmail}&gt;</span>}
                  <span className={`ml-auto rounded-full px-2 py-0.5 ${statusClass(selected.status)}`}>{STATUS_LABELS[selected.status] ?? selected.status}</span>
                </div>
                <div><span className="font-medium text-foreground">{t.mailToDetailLabel}:</span> {selected.toEmail || t.mailNoRecipient}</div>
                {selected.ccEmail && <div><span className="font-medium text-foreground">{t.mailCopyLabel}:</span> {selected.ccEmail}</div>}
                {selected.invoiceNumber && <div><span className="font-medium text-foreground">{t.mailRelatedInvoice}</span> {selected.invoiceNumber}</div>}
                {clientContextLabel(selected) && (
                  <div className="group relative w-fit">
                    <span className="font-medium text-foreground">{t.mailClientLabel}:</span> {clientContextLabel(selected)}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {selected.lastError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{selected.lastError}</div>
                )}
                <div className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                  {selected.body || t.mailNoContent}
                </div>
              </div>

              {/* Actions + quick reply */}
              <div className="shrink-0 border-t bg-card">
                {replyOpen ? (
                  <div className="p-3 space-y-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={4}
                      placeholder={t.mailBodyPlaceholder}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setReplyOpen(false)} className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">{t.mailClose}</button>
                      <button type="button" onClick={handleQuickReply} disabled={isPending || !replyBody.trim()} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">{t.mailSend}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <button type="button" onClick={() => setReplyOpen(true)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                      {t.mailReply}
                    </button>
                    <button type="button" onClick={() => handleForward(selected)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
                      Reenviar
                    </button>
                    <button type="button" onClick={() => handleDeleteMessage(selected)} className="ml-auto rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                      {folder === 'trash' ? t.mailDeletePermanent : t.mailDelete}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}












