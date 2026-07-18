'use client'

import { useState, useTransition, useEffect } from 'react'
import type { TaskData, TaskFormOptions } from '@/app/actions/tasks'
import { createTask, updateTask, tagUser, untagUser, getTaskFormOptions, generateShareToken } from '@/app/actions/tasks'

interface Props {
  workspaceId: string
  task?: TaskData | null
  onClose: () => void
  onSaved: (task: TaskData) => void
}

function initial(name: string | null, email: string): string {
  return ((name ?? email)[0] ?? '?').toUpperCase()
}

export function TaskModal({ workspaceId, task, onClose, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const [options, setOptions] = useState<TaskFormOptions | null>(null)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState(task?.status ?? 'PENDING')
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM')
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '')
  const [objectiveId, setObjectiveId] = useState(task?.objectiveId ?? '')
  const [clientId, setClientId] = useState(task?.clientId ?? '')
  const [taggedIds, setTaggedIds] = useState<string[]>(task?.tags.map((t) => t.userId) ?? [])
  const [error, setError] = useState('')
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    getTaskFormOptions(workspaceId).then(setOptions).catch(console.error)
  }, [workspaceId])

  function toggleTag(userId: string) {
    setTaggedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  function handleSubmit() {
    if (!title.trim()) { setError('El título es obligatorio'); return }
    setError('')

    startTransition(async () => {
      try {
        let saved: TaskData
        if (task) {
          saved = await updateTask(task.id, workspaceId, {
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            dueDate: dueDate || null,
            objectiveId: objectiveId || null,
            clientId: clientId || null,
          })
          const currentIds = task.tags.map((t) => t.userId)
          const toAdd = taggedIds.filter((id) => !currentIds.includes(id))
          const toRemove = currentIds.filter((id) => !taggedIds.includes(id))
          await Promise.all([
            ...toAdd.map((id) => tagUser(task.id, workspaceId, id)),
            ...toRemove.map((id) => untagUser(task.id, workspaceId, id)),
          ])
        } else {
          saved = await createTask(workspaceId, {
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            priority,
            dueDate: dueDate || null,
            objectiveId: objectiveId || null,
            clientId: clientId || null,
            tagUserIds: taggedIds,
          })
        }
        onSaved(saved)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  async function handleShare() {
    if (!task) return
    const token = await generateShareToken(task.id, workspaceId)
    const url = `${window.location.origin}/t/${token}`
    await navigator.clipboard.writeText(url)
    setShareMsg('Enlace copiado')
    setTimeout(() => setShareMsg(''), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden>
            <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <h2 className="text-sm font-medium flex-1">{task ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 rounded hover:bg-muted text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Título <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="PENDING">Pendiente</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="DONE">Hecho</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fecha límite</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Misión</label>
              <select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— ninguna —</option>
                {options?.objectives.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— ninguno —</option>
                {options?.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Etiquetar personas</label>
            <div className="flex flex-wrap gap-2">
              {options?.members.map((m) => {
                const tagged = taggedIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleTag(m.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${tagged ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-border-strong'}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium">
                      {initial(m.name, m.email)}
                    </span>
                    {m.name ?? m.email}
                    {tagged && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            {task && (
              <button onClick={handleShare} disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {shareMsg || 'Compartir'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={isPending}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={isPending || !title.trim()}
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isPending ? 'Guardando…' : task ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
