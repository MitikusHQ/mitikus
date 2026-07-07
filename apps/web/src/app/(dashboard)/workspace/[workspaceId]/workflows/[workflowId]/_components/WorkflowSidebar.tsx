'use client'

import { useState } from 'react'
import type { ToolPaletteItem } from '@/app/actions/workflows'
import { cn } from '@/lib/utils'

interface Props {
  tools: ToolPaletteItem[]
  onDragStart: (tool: ToolPaletteItem) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  AUDIT: 'Auditoría',
  EVALUATION: 'Evaluación',
  CHECKLIST: 'Checklists',
  CRM: 'CRM',
  REPORT: 'Informes',
  HR: 'RRHH',
  OPERATIONS: 'Operaciones',
  FINANCE: 'Finanzas',
  CUSTOM: 'Personalizadas',
}

export function WorkflowSidebar({ tools, onDragStart }: Props) {
  const [search, setSearch] = useState('')

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  )

  const grouped = filtered.reduce<Record<string, ToolPaletteItem[]>>((acc, t) => {
    const cat = t.category
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(t)
    return acc
  }, {})

  return (
    <aside className="w-64 shrink-0 border-r bg-card flex flex-col h-full">
      <div className="p-3 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Herramientas
        </p>
        <input
          type="search"
          placeholder="Buscar herramienta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {Object.entries(grouped).map(([category, catTools]) => (
          <div key={category}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="space-y-1">
              {catTools.map((tool) => (
                <div
                  key={tool.id}
                  draggable
                  onDragStart={() => onDragStart(tool)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5',
                    'cursor-grab active:cursor-grabbing bg-background hover:bg-muted hover:border-border',
                    'transition-all duration-100 select-none',
                  )}
                  title={tool.description}
                >
                  <span className="text-base shrink-0">{tool.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{tool.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">Sin resultados para &quot;{search}&quot;</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t">
        <p className="text-[10px] text-muted-foreground">
          Arrastra herramientas al canvas para añadirlas al workflow.
        </p>
      </div>
    </aside>
  )
}
