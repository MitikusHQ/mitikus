'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserNav } from '@/app/(dashboard)/_components/UserNav'
import { Icons } from './WorkspaceIcons'
import { GlobalSearch } from './GlobalSearch'

interface Props {
  workspaceId: string
  workspaceName: string
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

// Mapa ruta → label de sección. Orden: más específico primero.
const SECTION_LABELS: Array<{ segment: string; label: string }> = [
  { segment: '/tools',     label: 'Herramientas' },
  { segment: '/workflows', label: 'Flows' },
  { segment: '/clients',   label: 'Clientes' },
  { segment: '/analytics', label: 'Analytics' },
  { segment: '/audit',     label: 'Auditoría' },
  { segment: '/usage',     label: 'Uso' },
  { segment: '/team',      label: 'Equipo' },
  { segment: '/settings',  label: 'Ajustes' },
  { segment: '/generate',  label: 'Generar herramienta' },
  { segment: '/import',    label: 'Importar' },
  { segment: '/copilot',   label: 'Copilot' },
]

function useBreadcrumb(workspaceId: string, workspaceName: string) {
  const pathname = usePathname()
  const base = `/workspace/${workspaceId}`

  if (pathname === base || pathname === `${base}/`) {
    return [{ label: workspaceName, href: base }]
  }

  const match = SECTION_LABELS.find((s) => pathname.startsWith(`${base}${s.segment}`))
  const sectionLabel = match?.label

  if (!sectionLabel) {
    return [{ label: workspaceName, href: base }]
  }

  const sectionHref = `${base}${match!.segment}`
  const crumbs = [
    { label: workspaceName, href: base },
    { label: sectionLabel, href: sectionHref },
  ]

  // Sub-level (e.g. tools/[id], workflows/[id]/history)
  const subPath = pathname.slice(sectionHref.length)
  if (subPath && subPath !== '/') {
    const subSegments = subPath.split('/').filter(Boolean)
    if (subSegments.length >= 2) {
      // Has a child sub-page (e.g. /history, /run, /settings)
      const subLabel = resolveSubLabel(subSegments)
      if (subLabel) {
        crumbs.push({ label: subLabel, href: pathname })
      }
    }
  }

  return crumbs
}

function resolveSubLabel(segments: string[]): string | null {
  const last = segments[segments.length - 1] ?? ''
  const labels: Record<string, string> = {
    history:  'Historial',
    run:      'Ejecutar',
    settings: 'Ajustes',
    records:  'Registros',
    checklist: 'Checklist',
    scoring:  'Scoring',
    edit:     'Editar',
    new:      'Nuevo',
  }
  return labels[last] ?? null
}

export function WorkspaceTopbar({ workspaceId, workspaceName, onToggleSidebar, sidebarCollapsed }: Props) {
  const breadcrumbs = useBreadcrumb(workspaceId, workspaceName)

  return (
    <header
      className="h-14 shrink-0 border-b border-border bg-card flex items-center justify-between px-4 gap-4"
      role="banner"
    >
      {/* Left: sidebar toggle + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Icons.menu}
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Miga de pan" className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <span className="text-muted-foreground/40 shrink-0">{Icons.chevronRight}</span>
              )}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search + quick actions + user */}
      <div className="flex items-center gap-2 shrink-0">
        <GlobalSearch workspaceId={workspaceId} />
        <Link
          href={`/workspace/${workspaceId}/generate`}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Icons.plus}
          <span>Nueva herramienta</span>
        </Link>
        <UserNav />
      </div>
    </header>
  )
}
