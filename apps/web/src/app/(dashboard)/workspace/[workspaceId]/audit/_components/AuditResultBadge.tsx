import type { AuditResult } from '@/lib/audit'

interface Props {
  result: AuditResult
}

const CONFIG: Record<AuditResult, { label: string; className: string }> = {
  success: { label: 'Éxito',    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  failure: { label: 'Error',    className: 'bg-red-100 text-red-700 border-red-200' },
  denied:  { label: 'Denegado', className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export function AuditResultBadge({ result }: Props) {
  const cfg = CONFIG[result] ?? CONFIG.failure
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
