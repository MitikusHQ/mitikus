'use client'

import { useState } from 'react'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  isOpen:    boolean
  isSending: boolean
  onClose:   () => void
  onSend:    (clientName: string, clientEmail: string) => void
  locale:    Locale
}

export function SendToClientModal({ isOpen, isSending, onClose, onSend, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    onSend(name.trim(), email.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">{t.contractsSendToClient}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t.contractsClientName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.contractsClientNamePlaceholder}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t.contractsClientEmail}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@empresa.com"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
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
              disabled={isSending || !name.trim() || !email.trim()}
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
