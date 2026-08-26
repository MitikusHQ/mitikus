'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { transitionApprovalRecord } from '@/app/actions/record'
import type { ApprovalRecordStatus } from '@/app/actions/record'

interface Props {
  instanceId: string
  recordId: string
  workspaceId: string
  requireCommentOnRejection: boolean
  statusLabels?: Partial<Record<string, string>>
}

export function ApprovalActions({
  instanceId,
  recordId,
  workspaceId,
  requireCommentOnRejection,
  statusLabels,
}: Props) {
  const router = useRouter()
  const [comment, setComment]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showComment, setShowComment] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<ApprovalRecordStatus | null>(null)

  function labelFor(s: string) {
    return statusLabels?.[s] ?? { approved: 'Aprobar', rejected: 'Rechazar', on_hold: 'Poner en espera' }[s] ?? s
  }

  async function handleTransition(status: ApprovalRecordStatus) {
    if (status === 'rejected' && requireCommentOnRejection && !comment.trim()) {
      setPendingStatus(status)
      setShowComment(true)
      return
    }
    if (status === 'rejected' && showComment && requireCommentOnRejection && !comment.trim()) {
      setError('Indica el motivo del rechazo.')
      return
    }
    setLoading(true)
    setError(null)
    const result = await transitionApprovalRecord(instanceId, recordId, status, comment || null)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  function handleRejectClick() {
    if (requireCommentOnRejection) {
      setPendingStatus('rejected')
      setShowComment(true)
    } else {
      handleTransition('rejected')
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Decisión</h2>

      {showComment && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Motivo{requireCommentOnRejection ? ' (obligatorio)' : ''}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Indica el motivo de tu decisión..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      )}

      {!showComment && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Comentario (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Añade un comentario a tu decisión..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleTransition('approved')}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : labelFor('approved')}
        </button>

        <button
          onClick={handleRejectClick}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
        >
          {showComment && pendingStatus === 'rejected' ? 'Confirmar rechazo' : labelFor('rejected')}
        </button>

        <button
          onClick={() => handleTransition('on_hold')}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          {labelFor('on_hold')}
        </button>
      </div>
    </div>
  )
}
