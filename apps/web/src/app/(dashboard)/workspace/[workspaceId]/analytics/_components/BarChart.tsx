interface BarChartProps {
  data: Array<{ label: string; value: number }>
  height?: number
  className?: string
  colorClass?: string
}

export function BarChart({
  data,
  height = 80,
  className = '',
  colorClass = 'fill-primary',
}: BarChartProps) {
  const hasData = data.some((d) => d.value > 0)

  if (data.length === 0 || !hasData) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-muted/30 ${className}`}
        style={{ height }}
      >
        <p className="text-xs text-muted-foreground">Sin datos en este periodo</p>
      </div>
    )
  }

  const maxVal   = Math.max(...data.map((d) => d.value))
  const barW     = Math.max(2, Math.min(18, Math.floor(320 / data.length) - 2))
  const gap      = Math.max(1, Math.round(barW * 0.25))
  const totalW   = data.length * (barW + gap) - gap

  return (
    <svg
      viewBox={`0 0 ${totalW} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden
    >
      {data.map((d, i) => {
        const barH = Math.max(1, (d.value / maxVal) * (height - 2))
        const x    = i * (barW + gap)
        const y    = height - barH
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={1}
            className={`${colorClass} opacity-75`}
          />
        )
      })}
    </svg>
  )
}
