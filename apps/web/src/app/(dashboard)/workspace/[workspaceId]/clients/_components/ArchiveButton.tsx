'use client'

import { useActionState } from 'react'
import { archiveClient, type ClientActionState } from '@/app/actions/client'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  workspaceId: string
  clientId: string
  clientName: string
  locale: Locale
}

export function ArchiveButton({ workspaceId, clientId, clientName, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const confirmMessage = `${t.clientsArchiveConfirmPrefix}${clientName}${t.clientsArchiveConfirmSuffix}`
  const [state, action, isPending] = useActionState<ClientActionState, FormData>(
    archiveClient,
    null,
  )

  return (
    <form action={action}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="clientId" value={clientId} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm(confirmMessage)) {
            e.preventDefault()
          }
        }}
        className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
      >
        {isPending ? t.clientsArchiving : t.clientsArchive}
      </button>
      {state?.error && <p className="text-xs text-destructive mt-1">{state.error}</p>}
    </form>
  )
}
