'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkflowFromTemplate } from '@/app/actions/workflows'
import type { WorkflowTemplate } from '@/lib/workflow-templates'

interface Props {
  template: WorkflowTemplate
  workspaceId: string
}

export function TemplateCard({ template, workspaceId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleInstall() {
    setLoading(true)
    const result = await createWorkflowFromTemplate(workspaceId, template.id)
    if ('error' in result) {
      setLoading(false)
      alert(result.error)
      return
    }
    router.push(`/workspace/${workspaceId}/workflows/${result.id}`)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${template.color}18`, color: template.color }}
        >
          {template.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ color: template.color, borderColor: `${template.color}40`, backgroundColor: `${template.color}10` }}
            >
              {template.category}
            </span>
            <span className="text-[10px] text-muted-foreground">⏱ ~{template.estimatedMinutes} min</span>
          </div>
          <h3 className="font-semibold text-sm mt-1">{template.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
        </div>
      </div>

      {/* Steps preview */}
      <div className="flex items-center gap-1 flex-wrap">
        {template.nodes.map((node, i) => (
          <span key={node.slug} className="flex items-center gap-1">
            <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded">
              {node.label}
            </span>
            {i < template.nodes.length - 1 && (
              <span className="text-muted-foreground/40 text-xs">→</span>
            )}
          </span>
        ))}
      </div>

      <button
        onClick={handleInstall}
        disabled={loading}
        className="mt-auto w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creando…' : 'Usar plantilla →'}
      </button>
    </div>
  )
}
