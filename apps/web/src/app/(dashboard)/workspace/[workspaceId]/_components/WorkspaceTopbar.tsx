'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserNav } from '@/app/(dashboard)/_components/UserNav'
import { Icons } from './WorkspaceIcons'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'

interface Props {
  workspaceId: string
  workspaceName: string
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  teamPanelOpen: boolean
  onToggleTeamPanel: () => void
  onOpenOnboarding: () => void
}

// Mapa ruta → label de sección. Orden: más específico primero.
const SECTION_LABELS: Array<{ segment: string; label: string }> = [
  { segment: '/tools',     label: 'Herramientas' },
  { segment: '/workflows', label: 'Flujos' },
  { segment: '/clients',   label: 'Clientes' },
  { segment: '/analytics', label: 'Analytics' },
  { segment: '/audit',     label: 'Auditoría' },
  { segment: '/usage',     label: 'Uso' },
  { segment: '/team',      label: 'Equipo' },
  { segment: '/settings',  label: 'Ajustes' },
  { segment: '/generate',  label: 'Generar herramienta' },
  { segment: '/import',    label: 'Importar' },
  { segment: '/copilot',   label: 'Arkos' },
  { segment: '/tasks',    label: 'Tareas' },
  { segment: '/today',    label: 'Mi día' },
  { segment: '/timelog',  label: 'Control horario' },
  { segment: '/missions', label: 'Misiones' },
  { segment: '/profile',  label: 'Mi perfil' },
  { segment: '/docs',     label: 'Documentos' },
  { segment: '/sheets',   label: 'Hojas de cálculo' },
  { segment: '/pdfs',     label: 'PDFs' },
  { segment: '/contracts',     label: 'Contratos' },
  { segment: '/presentations', label: 'Presentaciones' },
  { segment: '/notebooks',     label: 'Notebooks' },
  { segment: '/office',   label: 'Mi Office' },
  { segment: '/history',  label: 'Historial' },
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

export function WorkspaceTopbar({ workspaceId, workspaceName, onToggleSidebar, sidebarCollapsed, teamPanelOpen, onToggleTeamPanel, onOpenOnboarding }: Props) {
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
          <span>Nueva misión</span>
        </Link>
        <button
          type="button"
          onClick={onToggleTeamPanel}
          aria-label={teamPanelOpen ? 'Cerrar panel de equipo' : 'Abrir panel de equipo'}
          aria-pressed={teamPanelOpen}
          className={`p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            teamPanelOpen
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpenOnboarding}
          aria-label="Ver tour de bienvenida"
          title="Tour de bienvenida"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        </button>
        <NotificationBell workspaceId={workspaceId} />
        <UserNav />
      </div>
    </header>
  )
}
