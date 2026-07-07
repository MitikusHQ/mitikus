interface MetricCardProps {
  title: string
  value: string
  microcopy?: string
  icon?: string
}

export function MetricCard({ title, value, microcopy, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        {icon && <span className="text-base" aria-hidden>{icon}</span>}
      </div>
      <p className="text-xl font-bold font-mono leading-none">{value}</p>
      {microcopy && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{microcopy}</p>
      )}
    </div>
  )
}
