import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  hint?: string
  nullLabel?: string
}

export function TemperatureSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  hint,
  nullLabel = 'Por defecto (automático)',
}: Props) {
  const isNull = value === null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-mono text-muted-foreground">
          {isNull ? nullLabel : value!.toFixed(2)}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isNull ? min : value!}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer',
          'bg-muted accent-primary',
          isNull && 'opacity-40',
        )}
      />

      <div className="flex items-center gap-2">
        <input
          id={`${label}-null`}
          type="checkbox"
          checked={isNull}
          onChange={(e) => onChange(e.target.checked ? null : (min + max) / 2)}
          className="h-3 w-3 rounded accent-primary cursor-pointer"
        />
        <label htmlFor={`${label}-null`} className="text-xs text-muted-foreground cursor-pointer">
          {nullLabel}
        </label>
      </div>

      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
