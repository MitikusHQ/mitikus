import type { PlanUsageItem } from '@/app/actions/org'

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  return n.toLocaleString('es-ES')
}

function UsageBar({ item }: { item: PlanUsageItem }) {
  const isUnlimited = !Number.isFinite(item.limit)
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100))
  const isWarning = pct >= 80 && pct < 100
  const isOver    = pct >= 100

  const barColor = isOver
    ? 'bg-destructive'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-primary'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{item.label}</span>
        <span className={`font-medium tabular-nums ${isOver ? 'text-destructive' : isWarning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
          {formatNumber(item.used)}
          {!isUnlimited && ` / ${formatNumber(item.limit)}`}
          {isUnlimited && ' / ∞'}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface Props {
  items: PlanUsageItem[]
}

export function PlanUsageSection({ items }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Uso actual del plan</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <UsageBar key={item.key} item={item} />
        ))}
      </div>
    </div>
  )
}
