interface HorizontalBarItem {
  label: string
  value: number
  sublabel?: string
}

interface HorizontalBarListProps {
  items: HorizontalBarItem[]
  formatter?: (v: number) => string
  barColorClass?: string
  emptyText?: string
}

export function HorizontalBarList({
  items,
  formatter = (v) => String(v),
  barColorClass = 'bg-primary',
  emptyText = 'Sin datos',
}: HorizontalBarListProps) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">{emptyText}</p>
  }

  const maxVal = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium truncate">{item.label}</span>
            <span className="font-mono text-muted-foreground shrink-0">{formatter(item.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${barColorClass} opacity-80 transition-all`}
              style={{ width: `${Math.max(2, (item.value / maxVal) * 100)}%` }}
            />
          </div>
          {item.sublabel && (
            <p className="text-xs text-muted-foreground">{item.sublabel}</p>
          )}
        </div>
      ))}
    </div>
  )
}
