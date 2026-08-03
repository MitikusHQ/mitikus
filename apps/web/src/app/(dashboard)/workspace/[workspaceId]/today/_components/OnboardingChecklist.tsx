import Link from 'next/link'

interface Step {
  id: string
  label: string
  description: string
  href: string
  done: boolean
}

interface Props {
  workspaceId: string
  steps: Step[]
}

export function OnboardingChecklist({ workspaceId, steps }: Props) {
  void workspaceId
  const done = steps.filter((s) => s.done).length
  const total = steps.length

  if (done === total) return null

  const pct = Math.round((done / total) * 100)

  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Primeros pasos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {done} de {total} completados
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums text-primary">{pct}%</span>
      </div>

      {/* Barra de progreso */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pasos */}
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.done ? '#' : step.href}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                step.done
                  ? 'opacity-50 cursor-default'
                  : 'hover:bg-muted/60 group'
              }`}
              aria-disabled={step.done}
            >
              {/* Check / círculo vacío */}
              <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                step.done
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/40 group-hover:border-primary'
              }`}>
                {step.done && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 6 4.5 9.5 11 2"/>
                  </svg>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${step.done ? '' : 'group-hover:text-primary transition-colors'}`}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <svg className="shrink-0 mt-0.5 w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
