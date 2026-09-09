'use client'

import { useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'
import type { LeadStatus } from '@prisma/client'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

const STATUS_COLORS: Record<LeadStatus, string> = {
  NUEVO: 'bg-blue-500/10 text-blue-600 border-blue-200',
  CONTACTADO: 'bg-amber-500/10 text-amber-600 border-amber-200',
  CUALIFICADO: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  PERDIDO: 'bg-muted text-muted-foreground border-border',
}

interface Props {
  leadId: string
  workspaceId: string
  status: LeadStatus
  locale: Locale
}

export function LeadStatusSelect({ leadId, workspaceId, status, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [isPending, startTransition] = useTransition()
  const statusLabels: Record<LeadStatus, string> = {
    NUEVO: t.leadsStatusNew,
    CONTACTADO: t.leadsStatusContacted,
    CUALIFICADO: t.leadsStatusQualified,
    PERDIDO: t.leadsStatusLost,
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LeadStatus
    startTransition(() => updateLeadStatus(leadId, workspaceId, next))
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer disabled:opacity-60 transition-opacity ${STATUS_COLORS[status]}`}
      style={{ appearance: 'none', paddingRight: '0.5rem' }}
    >
      {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
        <option key={s} value={s}>{statusLabels[s]}</option>
      ))}
    </select>
  )
}
