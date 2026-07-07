import type { AnalyticsInsight } from '@/app/actions/analytics'

const ICON: Record<AnalyticsInsight['type'], string> = {
  info:    '✦',
  warning: '⚠',
  success: '✓',
}

const COLOR: Record<AnalyticsInsight['type'], string> = {
  info:    'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
}

interface Props {
  insights: AnalyticsInsight[]
}

export function AnalyticsInsights({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <div className="space-y-2">
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs ${COLOR[insight.type]}`}
        >
          <span className="shrink-0 mt-px font-bold" aria-hidden>
            {ICON[insight.type]}
          </span>
          <p>{insight.text}</p>
        </div>
      ))}
    </div>
  )
}
