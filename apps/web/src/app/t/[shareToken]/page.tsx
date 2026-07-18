import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ shareToken: string }>
}

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  DONE: 'Hecho',
  CANCELLED: 'Cancelado',
}

function initial(name: string | null, email: string): string {
  return ((name ?? email)[0] ?? '?').toUpperCase()
}

export default async function SharedTaskPage({ params }: Props) {
  const { shareToken } = await params

  const task = await db.task.findUnique({
    where: { shareToken },
    include: {
      tags: { include: { user: { select: { name: true, email: true } } } },
    },
  })

  if (!task) notFound()

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-label="MITIKUS">
            <defs>
              <linearGradient id="mg" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFD040"/><stop offset="50%" stopColor="#FF2878"/><stop offset="100%" stopColor="#1820B8"/>
              </linearGradient>
              <clipPath id="mc"><circle cx="100" cy="100" r="87"/></clipPath>
            </defs>
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#mg)" strokeWidth="5.5"/>
            <g clipPath="url(#mc)">
              <polygon points="-10,0 192,95 192,100 -10,98" fill="url(#mg)"/>
              <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#mg)"/>
            </g>
          </svg>
          <span className="text-sm text-muted-foreground">MITIKUS · Tarea compartida</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
              task.priority === 'CRITICAL' ? 'bg-red-500' :
              task.priority === 'HIGH' ? 'bg-amber-400' :
              task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-muted-foreground/40'
            }`} />
            <h1 className="text-lg font-semibold leading-snug">{task.title}</h1>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed pl-5">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-2 pl-5">
            <span className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
              {STATUS_LABEL[task.status] ?? task.status}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
              Prioridad: {PRIORITY_LABEL[task.priority] ?? task.priority}
            </span>
            {task.dueDate && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                Vence: {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          {task.tags.length > 0 && (
            <div className="pl-5">
              <p className="text-xs text-muted-foreground mb-2">Etiquetados</p>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <div key={tag.userId} className="flex items-center gap-1.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">
                      {initial(tag.user.name, tag.user.email)}
                    </div>
                    <span className="text-muted-foreground">{tag.user.name ?? tag.user.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Compartida desde <a href="https://mitikus.com" className="text-primary hover:underline">MITIKUS</a>
        </p>
      </div>
    </div>
  )
}
