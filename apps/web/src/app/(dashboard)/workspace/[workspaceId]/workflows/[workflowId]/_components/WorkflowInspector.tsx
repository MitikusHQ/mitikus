'use client'

import type { WorkflowNodeData } from './WorkflowNodeComponent'
import type { WorkflowVariableData } from '@/app/actions/workflows'
import { cn } from '@/lib/utils'

interface Props {
  selectedNode: { id: string; data: WorkflowNodeData } | null
  variables: WorkflowVariableData[]
  onUpdateLabel: (nodeId: string, label: string) => void
  onUpdateInputMapping: (nodeId: string, mapping: Record<string, string>) => void
  onToggleDisabled: (nodeId: string, isDisabled: boolean) => void
  onDelete: (nodeId: string) => void
}

export function WorkflowInspector({
  selectedNode,
  variables,
  onUpdateLabel,
  onUpdateInputMapping,
  onToggleDisabled,
  onDelete,
}: Props) {
  if (!selectedNode) {
    return (
      <aside className="w-64 shrink-0 border-l bg-card flex flex-col items-center justify-center h-full">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">🖱️</div>
          <p className="text-xs text-muted-foreground">
            Selecciona un nodo para configurarlo
          </p>
        </div>
      </aside>
    )
  }

  const { id, data } = selectedNode
  const inputMapping = (data.inputMapping ?? {}) as Record<string, string>

  const handleMappingChange = (fieldId: string, value: string) => {
    onUpdateInputMapping(id, { ...inputMapping, [fieldId]: value })
  }

  const varOptions = variables.map((v) => ({
    label: `{{variables.${v.key}}}`,
    value: `{{variables.${v.key}}}`,
  }))

  return (
    <aside className="w-72 shrink-0 border-l bg-card flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{data.toolIcon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{data.toolName}</p>
          </div>
          <button
            onClick={() => onDelete(id)}
            className="text-muted-foreground hover:text-destructive transition-colors text-xs"
            title="Eliminar nodo"
          >
            🗑
          </button>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Nombre del paso</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => onUpdateLabel(id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Input mapping */}
      <div className="p-4 border-b flex-1">
        <p className="text-xs font-semibold mb-3">Mapeo de entradas</p>
        <p className="text-[10px] text-muted-foreground mb-3">
          Usa <code className="bg-muted px-1 rounded">{'{{variables.clave}}'}</code> para variables globales o{' '}
          <code className="bg-muted px-1 rounded">{'{{nodes.id.output}}'}</code> para el output de un nodo anterior.
        </p>

        {varOptions.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-muted/50 border">
            <p className="text-[10px] font-medium mb-1.5">Variables disponibles</p>
            <div className="flex flex-wrap gap-1">
              {varOptions.map((v) => (
                <span
                  key={v.value}
                  className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20"
                  onClick={() => navigator.clipboard.writeText(v.value).catch(() => undefined)}
                  title="Clic para copiar"
                >
                  {v.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {Object.keys(inputMapping).length === 0 ? (
            <p className="text-[10px] text-muted-foreground">
              Añade entradas usando el formato de plantilla.
            </p>
          ) : (
            Object.entries(inputMapping).map(([key, value]) => (
              <div key={key} className="space-y-0.5">
                <label className="text-[10px] font-medium text-muted-foreground">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleMappingChange(key, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-[11px] font-mono focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder={`{{variables.${key}}}`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Options */}
      <div className="p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isDisabled}
            onChange={(e) => onToggleDisabled(id, e.target.checked)}
            className="rounded"
          />
          <span className="text-xs">Desactivar este paso</span>
        </label>
      </div>
    </aside>
  )
}
