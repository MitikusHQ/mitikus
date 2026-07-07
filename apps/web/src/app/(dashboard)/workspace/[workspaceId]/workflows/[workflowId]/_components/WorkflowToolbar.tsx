'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_BADGE_CLASSES, type ResourceStatusString } from '@/lib/marketplace-config'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type RunState = 'idle' | 'running' | 'done' | 'error'

interface Props {
  workspaceName: string
  workspaceId: string
  workflowName: string
  workflowStatus: string
  workflowVersion: number
  saveState: SaveState
  runState: RunState
  onSave: () => void
  onRun: () => void
  onPublish: (() => void) | null
  onArchive: (() => void) | null
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
}

const SAVE_LABEL: Record<SaveState, string> = {
  idle: 'Guardar',
  saving: 'Guardando…',
  saved: '✓ Guardado',
  error: 'Error al guardar',
}

const RUN_LABEL: Record<RunState, string> = {
  idle: '▶ Ejecutar',
  running: '⏳ Ejecutando…',
  done: '✓ Completado',
  error: '✗ Error',
}

export function WorkflowToolbar({
  workspaceName,
  workspaceId,
  workflowName,
  workflowStatus,
  workflowVersion,
  saveState,
  runState,
  onSave,
  onRun,
  onPublish,
  onArchive,
  onZoomIn,
  onZoomOut,
  onFitView,
}: Props) {
  const isSaving = saveState === 'saving'
  const isRunning = runState === 'running'
  const isBusy = isSaving || isRunning
  const statusKey = (workflowStatus ?? 'PUBLISHED') as ResourceStatusString

  return (
    <header className="h-12 border-b bg-card flex items-center justify-between px-4 shrink-0">
      {/* Breadcrumb + status badge */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <Link
          href={`/workspace/${workspaceId}/workflows`}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {workspaceName}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-medium truncate">{workflowName}</span>
        <span
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none shrink-0',
            STATUS_BADGE_CLASSES[statusKey],
          )}
        >
          {STATUS_LABELS[statusKey]} · v{workflowVersion}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Publish / Archive */}
        {onPublish && workflowStatus === 'DRAFT' && (
          <button
            type="button"
            onClick={onPublish}
            disabled={isBusy}
            className="rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            Publicar
          </button>
        )}
        {onArchive && workflowStatus === 'PUBLISHED' && (
          <button
            type="button"
            onClick={onArchive}
            disabled={isBusy}
            className="rounded-md px-3 py-1.5 text-xs font-medium border border-input hover:bg-muted transition-colors disabled:opacity-60 text-muted-foreground"
          >
            Archivar
          </button>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 border rounded-md overflow-hidden">
          <button
            onClick={onZoomOut}
            className="px-2 py-1 text-xs hover:bg-muted transition-colors"
            title="Alejar"
          >
            −
          </button>
          <button
            onClick={onFitView}
            className="px-2 py-1 text-xs hover:bg-muted transition-colors border-x"
            title="Ajustar vista"
          >
            ⊡
          </button>
          <button
            onClick={onZoomIn}
            className="px-2 py-1 text-xs hover:bg-muted transition-colors"
            title="Acercar"
          >
            +
          </button>
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isBusy}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium border transition-all',
            saveState === 'saved'
              ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
              : saveState === 'error'
                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                : 'border-input bg-background hover:bg-muted',
            isBusy && 'opacity-60 cursor-not-allowed',
          )}
        >
          {SAVE_LABEL[saveState]}
        </button>

        {/* Run */}
        <button
          onClick={onRun}
          disabled={isBusy}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-all shadow-sm',
            runState === 'done'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : runState === 'error'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            isBusy && 'opacity-60 cursor-not-allowed',
          )}
        >
          {RUN_LABEL[runState]}
        </button>
      </div>
    </header>
  )
}
