import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  icon?: string
  children: ReactNode
  className?: string
}

export function ConfigSection({ title, description, icon, children, className }: Props) {
  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

export function ConfigField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
