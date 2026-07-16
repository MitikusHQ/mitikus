'use client'

import type { TimeEntryData } from '@/app/actions/timelog'

interface Props {
  workspaceId: string
  entry: TimeEntryData
  onUpdated: (updated: TimeEntryData) => void
}

export function ImputationPanel({ entry }: Props) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-muted-foreground">Panel de imputaciones — {entry.imputations.length} imputación(es)</p>
    </div>
  )
}
