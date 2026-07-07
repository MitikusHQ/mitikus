import { cn } from '@/lib/utils'
import type { ProviderModel } from '@/lib/providers'
import { SPEED_LABELS, QUALITY_LABELS } from '@/lib/providers'

interface Props {
  model: ProviderModel
  isSelected: boolean
  onSelect: (id: string) => void
}

function formatContext(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`
  if (n >= 1_000) return `${n / 1_000}K`
  return String(n)
}

function formatCost(n: number): string {
  if (n < 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(0)}`
}

const QUALITY_COLORS: Record<string, string> = {
  flagship: 'text-purple-600 dark:text-purple-400',
  high: 'text-blue-600 dark:text-blue-400',
  standard: 'text-muted-foreground',
}

export function ModelCard({ model, isSelected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(model.id)}
      className={cn(
        'w-full text-left rounded-lg border p-3.5 transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-muted-foreground/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{model.name}</p>
          <p className={cn('text-xs font-medium mt-0.5', QUALITY_COLORS[model.quality])}>
            {QUALITY_LABELS[model.quality]}
          </p>
        </div>
        {isSelected && (
          <span className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
          </span>
        )}
      </div>

      <dl className="mt-2.5 grid grid-cols-3 gap-1 text-[10px]">
        <div>
          <dt className="text-muted-foreground/60">Contexto</dt>
          <dd className="font-mono font-medium">{formatContext(model.contextWindow)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground/60">Velocidad</dt>
          <dd className="font-medium">{SPEED_LABELS[model.speed] ?? model.speed}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground/60">Entrada</dt>
          <dd className="font-mono font-medium">{formatCost(model.inputCostPer1M)}/1M</dd>
        </div>
      </dl>
    </button>
  )
}
