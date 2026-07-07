'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { Range } from '@/app/actions/analytics'

const OPTIONS: Array<{ value: Range; label: string }> = [
  { value: '7d',  label: '7 días'  },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'all', label: 'Todo'    },
]

export function RangeSelector({ current }: { current: Range }) {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border bg-card p-1"
      role="group"
      aria-label="Seleccionar periodo"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => router.push(`${pathname}?range=${opt.value}`)}
          aria-pressed={current === opt.value}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            current === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
