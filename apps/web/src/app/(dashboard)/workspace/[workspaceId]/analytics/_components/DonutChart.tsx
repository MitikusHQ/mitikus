export interface DonutDataPoint {
  label: string
  value: number
  color?: string
}

const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']

interface DonutChartProps {
  data: DonutDataPoint[]
  size?: number
}

export function DonutChart({ data, size = 96 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Sin datos</p>
  }

  const r           = 35
  const cx          = 50
  const cy          = 50
  const strokeW     = 14
  const circumference = 2 * Math.PI * r  // ≈ 219.9

  let cumulativeRatio = 0
  const segments = data.map((d, i) => {
    const ratio    = d.value / total
    const arcLen   = ratio * circumference
    const rotate   = cumulativeRatio * 360 - 90
    cumulativeRatio += ratio
    return {
      label:  d.label,
      value:  d.value,
      arcLen,
      rotate,
      color:  d.color ?? PALETTE[i % PALETTE.length] ?? PALETTE[0],
    }
  })

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
      >
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={`${s.arcLen} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(${s.rotate} ${cx} ${cy})`}
          />
        ))}
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-muted-foreground truncate">{s.label}</span>
            <span className="ml-auto font-mono font-medium">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
