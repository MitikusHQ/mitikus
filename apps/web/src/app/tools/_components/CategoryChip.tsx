import { cn } from '@/lib/utils'
import type { CategoryFilterItem } from '../_lib/types'

interface Props {
  item: CategoryFilterItem
  isActive: boolean
  onClick: () => void
}

export function CategoryChip({ item, isActive, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-input hover:border-foreground/40 hover:text-foreground',
      )}
    >
      <span className="text-[13px] leading-none">{item.icon}</span>
      <span>{item.label}</span>
      <span
        className={cn(
          'text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
          isActive
            ? 'bg-white/20 text-white'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {item.count}
      </span>
    </button>
  )
}
