'use client'

import { useMemo, useState, useTransition } from 'react'
import type { MailFolder, WorkspaceMailMessage } from '@/app/actions/mail'
import { deleteMailMessagePermanently, getMailboxMessages, moveMailMessageToTrash, saveWorkspaceMailDraft, sendWorkspaceMail, syncMailboxForWorkspace } from '@/app/actions/mail'

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
}

const FOLDERS: Array<{ id: MailFolder; label: string }> = [
  { id: 'inbox', label: 'Recibidos' },
  { id: 'sent', label: 'Enviados' },
  { id: 'drafts', label: 'Borradores' },
  { id: 'spam', label: 'Spam' },
  { id: 'trash', label: 'Papelera' },
]

const STATUS_LABELS: Record<string, string> = {
  queued: 'En cola',
  sending: 'Enviando',
  sent: 'Enviado',
  failed: 'Fallido',
  canceled: 'Cancelado',
  received: 'Recibido',
  draft: 'Borrador',
  spam: 'Spam',
  trash: 'Papelera',
}

function fmtDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayPeer(message: WorkspaceMailMessage) {
  const context = clientContextLabel(message)
  if (context) return context
  if (message.direction === 'inbound') {
    return message.fromName || message.fromEmail || 'Remitente'
  }
  return message.toEmail || 'Sin destinatario'
}

function peerEmail(message: WorkspaceMailMessage) {
  return message.direction === 'inbound' ? message.fromEmail : message.toEmail
}

function clientContextLabel(message: WorkspaceMailMessage) {
  if (!message.clientName) return null
  const parts = [message.clientContactName, message.clientName, message.clientSector].filter(Boolean)
  return Array.from(new Set(parts)).join(' · ')
}

function clientTypeLabel(value: string | null) {
  const labels: Record<string, string> = {
    company: 'Empresa',
    freelancer: 'Autónomo',
    individual: 'Particular',
    patient: 'Paciente',
    student: 'Alumno',
    athlete: 'Deportista',
    event: 'Evento',
    client: 'Cliente',
  }
  return value ? labels[value] ?? 'Cliente' : 'Cliente'
}

function clientContextDetails(message: WorkspaceMailMessage) {
  const rows: Array<[string, string]> = []
  if (message.clientContactName) rows.push(['Contacto', message.clientContactName])
  if (message.clientName) rows.push(['Cliente / empresa', message.clientName])
  if (message.clientSector) rows.push(['Sector', message.clientSector])
  if (message.clientType) rows.push(['Tipo', clientTypeLabel(message.clientType)])
  const email = peerEmail(message)
  if (email) rows.push(['Email', email])
  if (message.invoiceNumber) rows.push(['Factura', message.invoiceNumber])
  return rows
}

function ClientContextPopover({ message, position = 'top' }: { message: WorkspaceMailMessage; position?: 'top' | 'bottom' }) {
  const details = clientContextDetails(message)
  if (details.length === 0) return null
  const text = details.map(([label, value]) => `${label}: ${value}`).join(' · ')

  return (
    <div className={`pointer-events-none absolute left-3 right-3 z-30 hidden rounded-sm border border-slate-400 bg-white px-2 py-1 text-[11px] leading-4 text-slate-950 shadow-sm group-hover:block ${position === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'}`}>
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
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-xl">
          {suggestions.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(contact.email)
                setFocused(false)
              }}
              className="block w-full border-b border-slate-100 bg-white px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
            >
              <span className="block truncate text-sm font-medium">{contactLabel(contact)}</span>
              <span className="block truncate text-xs text-slate-500">{contact.email}</span>
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

function replySubject(value: string) {
  const subject = value.trim() || 'Sin asunto'
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`
}

function quoteBody(message: WorkspaceMailMessage) {
  const date = fmtDate(message.sentAt ?? message.createdAt)
  const author = message.direction === 'inbound'
    ? message.fromName || message.fromEmail || 'Remitente'
    : message.toEmail || 'Destinatario'
  const quoted = message.body
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
  return `\n\nEl ${date}, ${author} escribió:\n${quoted}`
}

export function MailboxClient({ workspaceId, initialMessages, initialToEmail = '', contacts, defaultSignature }: Props) {
  const [folder, setFolder] = useState<MailFolder>('inbox')
  const [messages, setMessages] = useState(initialMessages)
  const [selectedId, setSelectedId] = useState(initialMessages[0]?.id ?? null)
  const [composeOpen, setComposeOpen] = useState(Boolean(initialToEmail))
  const [toEmail, setToEmail] = useState(initialToEmail)
  const [ccEmail, setCcEmail] = useState('')
  const [bccEmail, setBccEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(defaultSignature ? `\n\n${defaultSignature}` : '')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selected = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? messages[0] ?? null,
    [messages, selectedId],
  )

  function loadFolder(nextFolder: MailFolder) {
    setFolder(nextFolder)
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        const result = await getMailboxMessages(workspaceId, nextFolder)
        setMessages(result.messages)
        setSelectedId(result.messages[0]?.id ?? null)
      } catch {
        setMessages([])
        setSelectedId(null)
        setError('No se ha podido cargar esta bandeja.')
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
        setNotice('Correo enviado y registrado en Enviados.')
        loadFolder('sent')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se ha podido enviar el correo.')
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
        setNotice('Borrador guardado.')
        loadFolder('drafts')
      } catch {
        setError('No se ha podido guardar el borrador.')
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
        setNotice(result.imported > 0 ? `${result.imported} correo(s) nuevo(s) importado(s).` : 'Recibidos actualizado. Sin correos nuevos por ahora.')
      } catch {
        setError('No se ha podido actualizar Recibidos. Comprueba IMAP en Ajustes.')
      }
    })
  }

  function handleReply(message: WorkspaceMailMessage) {
    const recipient = message.replyTo || message.fromEmail || (message.direction === 'outbound' ? message.toEmail : '')
    if (!recipient) {
      setError('Este correo no tiene una dirección a la que responder.')
      return
    }
    setNotice(null)
    setError(null)
    setToEmail(recipient)
    setCcEmail('')
    setBccEmail('')
    setSubject(replySubject(message.subject))
    setBody(quoteBody(message))
    setComposeOpen(true)
  }

  function removeSelectedFromList(messageId: string) {
    setMessages((prev) => {
      const next = prev.filter((message) => message.id !== messageId)
      setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  function handleDeleteMessage(message: WorkspaceMailMessage) {
    const permanent = folder === 'trash'
    const confirmed = window.confirm(permanent ? '¿Eliminar este correo definitivamente?' : '¿Mover este correo a la Papelera?')
    if (!confirmed) return
    setNotice(null)
    setError(null)
    startTransition(async () => {
      try {
        if (permanent) {
          await deleteMailMessagePermanently(workspaceId, message.id)
          setNotice('Correo eliminado definitivamente.')
        } else {
          await moveMailMessageToTrash(workspaceId, message.id)
          setNotice('Correo movido a Papelera.')
        }
        removeSelectedFromList(message.id)
      } catch {
        setError('No se ha podido eliminar este correo.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto rounded-lg border bg-card p-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {FOLDERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => loadFolder(item.id)}
              className={`h-10 shrink-0 whitespace-nowrap rounded-md px-2.5 text-sm font-medium transition ${folder === item.id ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={handleSync} disabled={isPending} className="flex h-10 w-24 items-center justify-center rounded-md border px-2 text-xs font-medium leading-tight hover:bg-muted disabled:opacity-60">
            <span>Actualizar<br />recibidos</span>
          </button>
          <button type="button" onClick={() => { resetCompose(); setComposeOpen(true) }} className="flex h-10 w-24 items-center justify-center rounded-md bg-primary px-2 text-xs font-semibold leading-tight text-primary-foreground hover:opacity-90">
            <span>+<br />Redactar</span>
          </button>
        </div>
      </div>

      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      {composeOpen && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Nuevo correo</h2>
            <button type="button" onClick={() => setComposeOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Cerrar</button>
          </div>
          <div className="space-y-3">
            <RecipientInput label="Para" value={toEmail} onChange={setToEmail} contacts={contacts} placeholder="Busca por nombre, empresa o email" />
            <div className="grid gap-3 md:grid-cols-2">
              <RecipientInput label="Copia" value={ccEmail} onChange={setCcEmail} contacts={contacts} placeholder="opcional" />
              <RecipientInput label="Copia oculta" value={bccEmail} onChange={setBccEmail} contacts={contacts} placeholder="opcional" />
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Asunto</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Asunto del correo" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Mensaje</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Escribe el mensaje..." />
            </label>
          </div>
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Los adjuntos generales se añadirán en una siguiente mejora. Las facturas ya se envían con su PDF adjunto desde Facturas.
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={handleDraft} disabled={isPending} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">Guardar borrador</button>
            <button type="button" onClick={handleSend} disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">Enviar</button>
          </div>
        </div>
      )}

      <div className="grid min-h-[520px] gap-4 lg:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">{FOLDERS.find((item) => item.id === folder)?.label}</div>
          <div className="max-h-[620px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No hay mensajes en esta bandeja.</div>
            ) : messages.map((message, index) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setSelectedId(message.id)}
                className={`group relative block w-full overflow-visible border-b px-4 py-3 text-left hover:bg-muted/60 ${selected?.id === message.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{displayPeer(message)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(message.sentAt ?? message.createdAt)}</span>
                </div>
                {peerEmail(message) && <div className="mt-1 truncate text-xs text-muted-foreground">{peerEmail(message)}</div>}
                <div className="mt-1 truncate text-sm">{message.subject || 'Sin asunto'}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded-full px-2 py-0.5 ${statusClass(message.status)}`}>{STATUS_LABELS[message.status] ?? message.status}</span>
                  {message.invoiceNumber && <span>Factura {message.invoiceNumber}</span>}
                </div>
                <ClientContextPopover message={message} position={index === 0 ? 'bottom' : 'top'} />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          {!selected ? (
            <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-muted-foreground">Selecciona un correo para ver el detalle.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="break-words text-xl font-semibold">{selected.subject || 'Sin asunto'}</h2>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {clientContextLabel(selected) && (
                      <div className="group relative w-fit max-w-full">
                        <p className="max-w-full truncate">Cliente: {clientContextLabel(selected)}</p>
                        <ClientContextPopover message={selected} />
                      </div>
                    )}
                    <p>De: {selected.fromEmail || selected.fromName || 'Remitente'}</p>
                    <p>Para: {selected.toEmail || 'Sin destinatario'}</p>
                    {selected.ccEmail && <p>Copia: {selected.ccEmail}</p>}
                    {selected.bccEmail && selected.status === 'draft' && <p>Copia oculta: {selected.bccEmail}</p>}
                    {selected.invoiceNumber && <p>Relacionado con factura {selected.invoiceNumber}</p>}
                  </div>
                  {selected.clientName && (
                    <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente en MITIKUS</div>
                      <div className="mt-1 font-medium">{clientContextLabel(selected)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{selected.fromEmail || selected.toEmail}</div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClass(selected.status)}`}>{STATUS_LABELS[selected.status] ?? selected.status}</span>
                  <button type="button" onClick={() => handleReply(selected)} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                    Responder
                  </button>
                  <button type="button" onClick={() => handleDeleteMessage(selected)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                    {folder === 'trash' ? 'Eliminar definitivamente' : 'Eliminar'}
                  </button>
                </div>
              </div>
              {selected.lastError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{selected.lastError}</div>}
              <div className="whitespace-pre-wrap break-words rounded-md bg-muted/30 p-4 text-sm leading-6">
                {selected.body || 'Sin contenido.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}















