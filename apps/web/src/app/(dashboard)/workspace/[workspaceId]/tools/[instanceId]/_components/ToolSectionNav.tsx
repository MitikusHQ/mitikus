'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  workspaceId: string
  instanceId: string
  aiLabel?: string
}

export function ToolSectionNav({ workspaceId, instanceId, aiLabel = '✨ Ejecutar IA' }: Props) {
  const pathname = usePathname()
  const base = `/workspace/${workspaceId}/tools/${instanceId}`

  const tabs = [
    { href: base, label: 'Registros', exact: true },
    { href: `${base}/run`, label: aiLabel, exact: false },
    { href: `${base}/history`, label: 'Historial IA', exact: false },
    { href: `${base}/settings`, label: '⚙ Ajustes', exact: false },
  ]

  return (
    <nav className="flex items-center gap-0 border-b mb-6" aria-label="Secciones de herramienta">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}




