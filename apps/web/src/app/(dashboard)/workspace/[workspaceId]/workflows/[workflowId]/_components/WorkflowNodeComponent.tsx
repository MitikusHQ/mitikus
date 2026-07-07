'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  AUDIT:      'border-blue-400 bg-blue-50 dark:bg-blue-950/40',
  EVALUATION: 'border-amber-400 bg-amber-50 dark:bg-amber-950/40',
  CHECKLIST:  'border-green-400 bg-green-50 dark:bg-green-950/40',
  CRM:        'border-purple-400 bg-purple-50 dark:bg-purple-950/40',
  REPORT:     'border-slate-400 bg-slate-50 dark:bg-slate-800/40',
  HR:         'border-rose-400 bg-rose-50 dark:bg-rose-950/40',
  OPERATIONS: 'border-orange-400 bg-orange-50 dark:bg-orange-950/40',
  FINANCE:    'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
  CUSTOM:     'border-border bg-card',
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  IDLE:      { dot: 'bg-muted-foreground/30', label: '' },
  QUEUED:    { dot: 'bg-amber-400 animate-pulse', label: 'En cola' },
  RUNNING:   { dot: 'bg-blue-500 animate-pulse', label: 'Ejecutando…' },
  COMPLETED: { dot: 'bg-green-500', label: 'Completado' },
  FAILED:    { dot: 'bg-destructive', label: 'Error' },
  CANCELLED: { dot: 'bg-muted-foreground', label: 'Cancelado' },
  SKIPPED:   { dot: 'bg-muted-foreground/40', label: 'Omitido' },
}

export interface WorkflowNodeData {
  workflowNodeId: string
  toolDefinitionId: string
  toolName: string
  toolDescription: string
  toolCategory: string
  toolIcon: string
  label: string
  isDisabled: boolean
  executionStatus?: string
  hasInputs?: boolean  // tiene aristas entrantes
  hasOutputs?: boolean // tiene aristas salientes
  [key: string]: unknown
}

export type WorkflowNode = Node<WorkflowNodeData, 'workflowTool'>

export function WorkflowNodeComponent({ data, selected }: NodeProps<WorkflowNode>) {
  const categoryColor = CATEGORY_COLORS[data.toolCategory] ?? CATEGORY_COLORS['CUSTOM']!
  const status = data.executionStatus ?? 'IDLE'
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES['IDLE']!

  return (
    <div
      className={cn(
        'w-52 rounded-xl border-2 bg-card shadow-sm transition-all duration-150',
        'cursor-default',
        selected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40',
        data.isDisabled && 'opacity-40',
      )}
    >
      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
      />

      {/* Cuerpo del nodo */}
      <div className={cn('rounded-t-[10px] px-3 py-2.5 border-b', categoryColor)}>
        <div className="flex items-center gap-2">
          <span className="text-base">{data.toolIcon}</span>
          <span className="font-semibold text-xs truncate flex-1">{data.label}</span>
          {/* Status dot */}
          <span className={cn('w-2 h-2 rounded-full shrink-0', statusStyle.dot)} />
        </div>
      </div>

      <div className="px-3 py-2">
        <p className="text-[10px] text-muted-foreground truncate">{data.toolName}</p>
        {statusStyle.label && (
          <p className="text-[10px] font-medium text-primary mt-0.5">{statusStyle.label}</p>
        )}
      </div>

      {/* Handle de salida (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
      />
    </div>
  )
}
