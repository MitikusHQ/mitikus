import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  icon?: string
  description?: string
  className?: string
}

export function OrgMetricCard({ label, value, icon, description, className }: Props) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {icon && <span className="text-lg leading-none">{icon}</span>}
      </div>
      <div className="font-mono text-2xl font-bold tracking-tight text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground leading-snug">{description}</p>}
    </div>
  )
}
