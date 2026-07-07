'use client'

import { useState } from 'react'

interface Props {
  metadata: Record<string, unknown> | null
}

export function AuditMetadataPreview({ metadata }: Props) {
  const [open, setOpen] = useState(false)

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const preview = Object.entries(metadata)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(' · ')

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        {open ? 'Ocultar' : preview}
      </button>
      {open && (
        <pre className="mt-1 p-2 rounded bg-muted text-foreground font-mono text-[11px] overflow-auto max-h-32 whitespace-pre-wrap">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  )
}
