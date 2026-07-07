import Link from 'next/link'
import type { OrgWorkspaceSummary } from '@/app/actions/org'

interface Props {
  workspaces: OrgWorkspaceSummary[]
}

export function OrgWorkspaceList({ workspaces }: Props) {
  if (workspaces.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No hay workspaces creados todavía
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card divide-y">
      {workspaces.map((ws) => (
        <Link
          key={ws.id}
          href={`/workspace/${ws.id}`}
          className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0">
              📁
            </div>
            <div>
              <div className="font-medium text-sm group-hover:text-primary transition-colors">{ws.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{ws.slug}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{ws.toolCount} herramientas</span>
            <span>{ws.workflowCount} workflows</span>
            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  )
}
