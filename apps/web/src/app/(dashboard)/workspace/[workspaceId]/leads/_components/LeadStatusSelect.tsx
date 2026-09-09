'use client'

import { useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'
import type { LeadStatus } from '@prisma/client'

const STATUS_LABELS: Record<LeadStatus, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  CUALIFICADO: 'Cualificado',
  PERDIDO: 'Perdido',
}

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
}

export function LeadStatusSelect({ leadId, workspaceId, status }: Props) {
  const [isPending, startTransition] = useTransition()

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
      {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  )
}
