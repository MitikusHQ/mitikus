import Link from 'next/link'
import type { CapabilityType } from '@protools/schema'

interface Tab {
  type: CapabilityType
  label: string
  href: string
}

interface Props {
  tabs: Tab[]
  active: CapabilityType
}

export function CapabilityNav({ tabs, active }: Props) {
  if (tabs.length <= 1) return null

  return (
    <nav className="flex items-center gap-0 border-b mb-6">
      {tabs.map((tab) => (
        <Link
          key={`${tab.type}-${tab.href}`}
          href={tab.href}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
            tab.type === active
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
