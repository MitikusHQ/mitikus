'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { getComments, addComment, deleteComment } from '@/app/actions/comments'
import { getActivity } from '@/app/actions/activity'
import type { ActivityData } from '@/app/actions/activity'
import type { CommentData, ResourceType } from '@/app/actions/comments'

interface Props {
  open:          boolean
  onClose:       () => void
  workspaceId:   string
  resourceType:  ResourceType
  resourceId:    string
  resourceTitle: string
  currentUserId: string
}

type Tab = 'comments' | 'activity'

export function ResourceDrawer({
  open, onClose, workspaceId, resourceType, resourceId, resourceTitle, currentUserId,
}: Props) {
  const [tab,      setTab]      = useState<Tab>('comments')
  const [comments, setComments] = useState<CommentData[]>([])
  const [activity, setActivity] = useState<ActivityData[]>([])
  const [input,    setInput]    = useState('')
  const [replyTo,  setReplyTo]  = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      getComments(workspaceId, resourceType, resourceId),
      getActivity(workspaceId, resourceType, resourceId),
    ]).then(([c, a]) => {
      setComments(c)
      setActivity(a)
    }).finally(() => setLoading(false))
  }, [open, workspaceId, resourceType, resourceId])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments, open])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const c = await addComment(workspaceId, resourceType, resourceId, text, replyTo ?? undefined)
      if (replyTo) {
        setComments((prev) => prev.map((cm) =>
          cm.id === replyTo ? { ...cm, replies: [...cm.replies, c] } : cm
        ))
      } else {
        setComments((prev) => [...prev, c])
      }
      setInput('')
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: string, parentId: string | null) {
    await deleteComment(commentId)
    if (parentId) {
      setComments((prev) => prev.map((cm) =>
        cm.id === parentId ? { ...cm, replies: cm.replies.filter((r) => r.id !== commentId) } : cm
      ))
    } else {
      setComments((prev) => prev.filter((cm) => cm.id !== commentId))
    }
  }

  const ACTION_LABELS: Record<string, string> = {
    created:        'creó este recurso',
    edited:         'editó el contenido',
    title_changed:  'cambió el título',
    status_changed: 'cambió el estado',
    source_added:   'añadió una fuente',
    source_removed: 'eliminó una fuente',
    signed:         'firmó el documento',
    sent:           'envió el contrato al cliente',
    slide_added:    'añadió una diapositiva',
    uploaded:       'subió el archivo',
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={(e) => { e.stopPropagation(); onClose() }}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-80 bg-background border-l shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="text-xs text-muted-foreground">{resourceTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab('comments')}
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            💬 Comentarios
          </button>
          <button
            onClick={() => setTab('activity')}
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === 'activity' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            📋 Actividad
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-xs text-muted-foreground text-center py-8">Cargando...</p>
          )}

          {!loading && tab === 'comments' && (
            <div className="p-3 space-y-3">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Sin comentarios todavía.
                </p>
              )}
              {comments.map((cm) => (
                <div key={cm.id} className="space-y-2">
                  <CommentBubble
                    comment={cm}
                    currentUserId={currentUserId}
                    onReply={() => setReplyTo(cm.id)}
                    onDelete={() => handleDelete(cm.id, null)}
                  />
                  {cm.replies.map((rep) => (
                    <div key={rep.id} className="ml-6">
                      <CommentBubble
                        comment={rep}
                        currentUserId={currentUserId}
                        onDelete={() => handleDelete(rep.id, cm.id)}
                      />
                    </div>
                  ))}
                  {replyTo === cm.id && (
                    <div className="ml-6 flex gap-1">
                      <input
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleSend() }}
                        placeholder="Responder..."
                        className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={() => setReplyTo(null)}
                        className="text-xs text-muted-foreground px-1"
                      >✕</button>
                      <button
                        onClick={() => void handleSend()}
                        disabled={sending || !input.trim()}
                        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded disabled:opacity-50"
                      >↑</button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {!loading && tab === 'activity' && (
            <div className="p-3 space-y-2">
              {activity.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Sin actividad registrada.
                </p>
              )}
              {activity.map((a) => (
                <div key={a.id} className="flex gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium">{a.userName}</span>
                    {' '}
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[a.action] ?? a.action}
                    </span>
                    {a.metadata.title && (
                      <span className="text-muted-foreground"> — <em>{a.metadata.title}</em></span>
                    )}
                    <div className="text-muted-foreground/60 mt-0.5">
                      {formatRelative(a.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input — solo en tab comments y sin replyTo activo */}
        {tab === 'comments' && !replyTo && (
          <div className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSend() }}
              placeholder="Comentar... (@nombre para mencionar)"
              className="flex-1 text-xs rounded border border-input bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => void handleSend()}
              disabled={sending || !input.trim()}
              className="rounded bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? '...' : '↑'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function CommentBubble({
  comment, currentUserId, onReply, onDelete,
}: {
  comment:       CommentData
  currentUserId: string
  onReply?:      () => void
  onDelete:      () => void
}) {
  return (
    <div className="group text-xs">
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="font-medium">{comment.authorName}</span>
        <span className="text-muted-foreground/60 text-[10px]">{formatRelative(comment.createdAt)}</span>
      </div>
      <p className="text-foreground/80 leading-relaxed">{comment.content}</p>
      <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onReply && (
          <button onClick={onReply} className="text-[10px] text-muted-foreground hover:text-foreground">
            Responder
          </button>
        )}
        {comment.authorId === currentUserId && (
          <button onClick={onDelete} className="text-[10px] text-destructive/70 hover:text-destructive">
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'ahora'
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24)   return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)    return `hace ${d}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
