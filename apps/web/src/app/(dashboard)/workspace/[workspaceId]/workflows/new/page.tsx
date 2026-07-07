'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWorkflow } from '@/app/actions/workflows'
import { use } from 'react'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default function NewWorkflowPage({ params }: Props) {
  const { workspaceId } = use(params)
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsCreating(true)
    setError('')
    const result = await createWorkflow(workspaceId, name.trim(), description.trim() || undefined)
    if ('error' in result) {
      setError(result.error)
      setIsCreating(false)
    } else {
      router.push(`/workspace/${workspaceId}/workflows/${result.id}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold mb-1">Nuevo Workflow</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Define un nombre y descripción. Añadirás los pasos en el editor de canvas.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nombre del workflow *</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Análisis estratégico completo"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Descripción <span className="text-muted-foreground">(opcional)</span></label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej. DAFO → Análisis competencia → Plan de acción → Informe ejecutivo"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                maxLength={500}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isCreating ? 'Creando…' : 'Crear y abrir editor →'}
            </button>
          </form>
        </div>
    </div>
  )
}
