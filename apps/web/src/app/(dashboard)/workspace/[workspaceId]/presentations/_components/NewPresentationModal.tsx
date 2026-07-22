'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPresentation, TEMPLATES } from '@/app/actions/presentations'

const PRESET_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  workspaceId: string
  onClose:     () => void
}

export function NewPresentationModal({ workspaceId, onClose }: Props) {
  const router  = useRouter()
  const [title,      setTitle]      = useState('')
  const [color,      setColor]      = useState('#6366f1')
  const [template,   setTemplate]   = useState<string>('blank')
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsCreating(true)
    const slides = template !== 'blank' ? TEMPLATES[template]?.slides : undefined
    const { id } = await createPresentation(workspaceId, title.trim(), color, slides)
    router.push(`/workspace/${workspaceId}/presentations/${id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">Nueva presentación</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi presentación"
              required
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Color de acento</label>
            <div className="flex gap-2 flex-wrap items-center">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-input"
                title="Color personalizado"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Plantilla</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('blank')}
                className={`rounded-md border p-3 text-left text-xs transition-colors ${template === 'blank' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="font-medium mb-0.5">En blanco</div>
                <div className="text-muted-foreground">Empieza desde cero</div>
              </button>
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTemplate(key)}
                  className={`rounded-md border p-3 text-left text-xs transition-colors ${template === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                >
                  <div className="font-medium mb-0.5">{tpl.label}</div>
                  <div className="text-muted-foreground">{tpl.slides.length} slides</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreating ? 'Creando...' : 'Crear presentación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
