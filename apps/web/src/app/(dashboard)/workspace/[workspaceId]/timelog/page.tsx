import { requireUser } from '@/lib/auth'
import { getTodayEntry, getWeekEntries } from '@/app/actions/timelog'
import { ClockWidget } from '../today/_components/ClockWidget'
import { WeekTable } from './_components/WeekTable'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function TimelogPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const weekStart = getMonday(new Date())

  const [entries, todayEntry] = await Promise.all([
    getWeekEntries(workspaceId, weekStart),
    getTodayEntry(workspaceId, user.id),
  ])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Control horario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Registro de jornada e imputación de horas</p>
      </div>

      <ClockWidget workspaceId={workspaceId} initialEntry={todayEntry} />

      <WeekTable
        workspaceId={workspaceId}
        initialEntries={entries}
        weekStart={weekStart.toISOString()}
      />
    </div>
  )
}
