import { cn } from '@/lib/utils'
import type { ProviderInfo } from '@/lib/providers'

interface Props {
  provider: ProviderInfo
  isSelected: boolean
  isAvailable: boolean
  onSelect: (id: string) => void
}

export function ProviderCard({ provider, isSelected, isAvailable, onSelect }: Props) {
  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={() => onSelect(provider.id)}
      className={cn(
        'relative w-full text-left rounded-xl border p-4 transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && isAvailable
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-muted-foreground/40',
        !isAvailable && 'opacity-50 cursor-not-allowed',
      )}
    >
      {/* Status badge */}
      <span
        className={cn(
          'absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none',
          isAvailable
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {isAvailable ? 'Disponible' : 'Próximamente'}
      </span>

      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{provider.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{provider.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{provider.description}</p>
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            {provider.models.length} {provider.models.length === 1 ? 'modelo' : 'modelos'}
          </p>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && isAvailable && (
        <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-primary" />
      )}
    </button>
  )
}
