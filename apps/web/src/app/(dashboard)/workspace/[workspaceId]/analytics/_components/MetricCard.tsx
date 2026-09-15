interface MetricCardProps {
  title: string
  value: string
  microcopy?: string
  icon?: string
}

export function MetricCard({ title, value, microcopy, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {icon && <span className="text-sm text-muted-foreground/60" aria-hidden>{icon}</span>}
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      {microcopy && (
        <p className="text-[11px] text-muted-foreground/70 mt-2 leading-snug">{microcopy}</p>
      )}
    </div>
  )
}
