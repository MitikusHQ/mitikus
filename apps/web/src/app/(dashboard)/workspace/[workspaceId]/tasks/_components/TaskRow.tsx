'use client'

import { useState, useTransition } from 'react'
import { createCalendarEventFromTask } from '@/app/actions/integrations'
import type { TaskData } from '@/app/actions/tasks'
import { updateTask, deleteTask } from '@/app/actions/tasks'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  task: TaskData
  workspaceId: string
  onEdit: (task: TaskData) => void
  locale: Locale
}

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-amber-400',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-muted-foreground/30',
}

function initial(name: string | null, email: string): string {
  return (name ?? email)[0]?.toUpperCase() ?? '?'
}

function formatDue(iso: string | null, locale: Locale, todayLabel: string, tomorrowLabel: string): { label: string; className: string } {
  if (!iso) return { label: '', className: '' }
  const due = new Date(iso)
  const now = new Date()
  const diff = (due.getTime() - now.setHours(0, 0, 0, 0)) / 86400000
  if (diff < 0) return { label: due.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), className: 'text-red-500' }
  if (diff < 1) return { label: todayLabel, className: 'text-amber-500' }
  if (diff < 2) return { label: tomorrowLabel, className: 'text-amber-500' }
  return { label: due.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), className: 'text-muted-foreground' }
}

export function TaskRow({ task, workspaceId, onEdit, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [isPending, startTransition] = useTransition()
  const [calendarState, setCalendarState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const isDone = task.status === 'DONE'
  const due = formatDue(task.dueDate, locale, t.tasksDueToday, t.tasksDueTomorrow)
  const PRIORITY_LABEL: Record<string, string> = {
    CRITICAL: t.tasksPriorityCritical,
    HIGH: t.tasksPriorityHigh,
    MEDIUM: t.tasksPriorityMedium,
    LOW: t.tasksPriorityLow,
  }

  function toggleDone() {
    startTransition(async () => {
      await updateTask(task.id, workspaceId, {
        status: isDone ? 'PENDING' : 'DONE',
      })
    })
  }

  function handleDelete() {
    if (!confirm(t.tasksDeleteConfirm)) return
    startTransition(async () => {
      await deleteTask(task.id, workspaceId)
    })
  }

  function handleCalendar() {
    if (!task.dueDate || calendarState === 'saving') return
    setCalendarState('saving')
    setCalendarError(null)
    setCalendarUrl(null)
    startTransition(async () => {
      const result = await createCalendarEventFromTask(workspaceId, task.id)
      if (!result.ok) {
        setCalendarState('error')
        setCalendarError(result.error)
        return
      }
      setCalendarState('saved')
      setCalendarUrl(result.url)
    })
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-muted/40 transition-colors group ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        onClick={toggleDone}
        aria-label={isDone ? t.tasksMarkPending : t.tasksMarkDone}
        className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-border hover:border-primary'}`}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </button>

      <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-muted-foreground/30'}`}
        title={PRIORITY_LABEL[task.priority]} />

      <span className={`flex-1 text-sm truncate ${isDone ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </span>

      {task.tags.length > 0 && (
        <div className="flex -space-x-1.5">
          {task.tags.slice(0, 3).map((tag) => (
            <div
              key={tag.userId}
              title={tag.userName ?? tag.userEmail}
              className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-medium border border-background"
            >
              {initial(tag.userName, tag.userEmail)}
            </div>
          ))}
          {task.tags.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] border border-background">
              +{task.tags.length - 3}
            </div>
          )}
        </div>
      )}

      {(task.objectiveLabel || task.clientName) && (
        <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 whitespace-nowrap hidden sm:block">
          {task.objectiveLabel ?? task.clientName}
        </span>
      )}

      {due.label && (
        <span className={`text-[11px] whitespace-nowrap ${due.className}`}>{due.label}</span>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.dueDate && (
          <button
            onClick={handleCalendar}
            aria-label={t.tasksAddToCalendar}
            title={calendarState === 'saved' ? t.tasksCalendarSaved : calendarError ?? t.tasksAddToCalendar}
            className={`p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground ${calendarState === 'saved' ? 'text-green-500' : calendarState === 'error' ? 'text-red-500' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 14v4" />
              <path d="M10 16h4" />
            </svg>
          </button>
        )}
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t.tasksOpenCalendarEvent}
            className="p-1 rounded hover:bg-muted text-green-500 hover:text-green-600"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
        <button
          onClick={() => onEdit(task)}
          aria-label={t.tasksEdit}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={handleDelete}
          aria-label={t.tasksDelete}
          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 dark:hover:bg-red-950"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
