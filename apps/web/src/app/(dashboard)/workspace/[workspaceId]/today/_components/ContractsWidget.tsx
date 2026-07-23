import Link from 'next/link'

interface Contract {
  id:          string
  title:       string
  status:      string
  clientName:  string | null
  clientEmail: string | null
  createdAt:   string
}

interface Props {
  workspaceId: string
  contracts:   Contract[]
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'text-muted-foreground bg-muted' },
  SENT:  { label: 'Enviado',  color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30' },
}

export function ContractsWidget({ workspaceId, contracts }: Props) {
  if (contracts.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Contratos pendientes</h2>
        <Link
          href={`/workspace/${workspaceId}/contracts`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Ver todos →
        </Link>
      </div>
      <div className="space-y-2">
        {contracts.map((c) => {
          const s = STATUS_LABEL[c.status] ?? { label: c.status, color: 'text-muted-foreground bg-muted' }
          return (
            <Link
              key={c.id}
              href={`/workspace/${workspaceId}/contracts/${c.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
            >
              <span className="text-base shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                {c.clientName && (
                  <p className="text-xs text-muted-foreground truncate">{c.clientName}</p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                {s.label}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
