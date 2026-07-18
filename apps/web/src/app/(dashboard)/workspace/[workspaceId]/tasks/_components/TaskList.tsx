'use client'

import { useState, useTransition } from 'react'
import type { TaskData } from '@/app/actions/tasks'
import { getTasks } from '@/app/actions/tasks'
import { TaskRow } from './TaskRow'
import { TaskModal } from './TaskModal'

interface Props {
  workspaceId: string
  userId: string
  initialTasks: TaskData[]
  initialFilters: { status: string; mine: boolean }
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'done', label: 'Completadas' },
]

export function TaskList({ workspaceId, userId, initialTasks, initialFilters }: Props) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks)
  const [status, setStatus] = useState(initialFilters.status)
  const [mine, setMine] = useState(initialFilters.mine)
  const [editingTask, setEditingTask] = useState<TaskData | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  function reload(newStatus: string, newMine: boolean) {
    startTransition(async () => {
      const result = await getTasks(workspaceId, userId, {
        status: newStatus === 'all' ? undefined : newStatus,
        mine: newMine,
      })
      setTasks(result)
    })
  }

  function setStatusFilter(s: string) {
    setStatus(s)
    reload(s, mine)
  }

  function toggleMine() {
    const next = !mine
    setMine(next)
    reload(status, next)
  }

  function handleSaved(saved: TaskData) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setEditingTask(undefined)
  }

  const pendingCount = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Tareas</h1>
        <button
          onClick={() => setEditingTask(null)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva tarea
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`h-7 px-3 rounded-full text-xs border transition-colors ${status === f.value ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-border-strong'}`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={toggleMine}
          className={`h-7 px-3 rounded-full text-xs border transition-colors ${mine ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-border-strong'}`}
        >
          Solo las mías
        </button>
      </div>

      <div className={`rounded-xl border border-border overflow-hidden ${isPending ? 'opacity-60' : ''}`}>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No hay tareas con estos filtros.
            <br />
            <button onClick={() => setEditingTask(null)} className="mt-2 text-primary hover:underline">Crear la primera →</button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskRow key={task.id} task={task} workspaceId={workspaceId} onEdit={setEditingTask} />
          ))
        )}
        {tasks.length > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/20">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} · {tasks.length} total
          </div>
        )}
      </div>

      {editingTask !== undefined && (
        <TaskModal
          workspaceId={workspaceId}
          task={editingTask}
          onClose={() => setEditingTask(undefined)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
