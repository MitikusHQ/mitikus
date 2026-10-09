'use client'

import { useState } from 'react'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { ClientPicker } from './ClientPicker'
import type { ClientSummary } from '@/app/actions/clients'

interface Props {
  isOpen:      boolean
  isSending:   boolean
  workspaceId: string
  onClose:     () => void
  onSend:      (clientName: string, clientEmail: string, clientId?: string) => void
  locale:      Locale
}

export function SendToClientModal({ isOpen, isSending, workspaceId, onClose, onSend, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [client, setClient] = useState<ClientSummary | null>(null)

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!client?.email) return
    onSend(client.name, client.email, client.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">{t.contractsSendToClient}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Cliente
            </label>
            <ClientPicker
              workspaceId={workspaceId}
              value={client}
              onChange={setClient}
            />
          </div>

          {client && !client.email && (
            <p className="text-xs text-amber-600">
              Este cliente no tiene email. Añádelo en su ficha antes de enviar.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {t.brainMemoryCancel}
            </button>
            <button
              type="submit"
              disabled={isSending || !client?.email}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isSending ? t.contractsSending : t.contractsSend}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
