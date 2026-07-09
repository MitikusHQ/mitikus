import { getSinceLastVisit } from '@/lib/missions/second-day'
import type { SinceLastVisitItem } from '@/lib/missions/second-day'

interface Props {
  workspaceId: string
  userName: string
  since: Date
}

export async function IntelligenceBand({ workspaceId, userName, since }: Props) {
  const data = await getSinceLastVisit(workspaceId, since)

  if (!data.hasChanges) return null

  return (
    <section
      aria-label="Cambios desde tu última visita"
      className="rounded-lg bg-card border border-primary/10 p-4 space-y-2 animate-in fade-in duration-300"
    >
      <p className="text-xs font-semibold text-primary">
        Desde tu última visita, {userName}:
      </p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {data.items.map((item: SinceLastVisitItem) => (
          <li
            key={item.text}
            className="text-xs flex items-center gap-1.5 text-muted-foreground"
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
