'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkflow } from '@/app/actions/workflows'
import { use } from 'react'
import { AIWorkflowModal } from '../_components/AIWorkflowModal'
import { useLocale } from '@/i18n/locale-context'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default function NewWorkflowPage({ params }: Props) {
  const { workspaceId } = use(params)
  const router = useRouter()
  const locale = useLocale()
  const t = getDashboardTranslations(locale)
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* columna izquierda — formulario existente */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold mb-1">{t.wfNewTitle}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t.wfNewDesc}</p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t.wfNameLabel}</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.wfNamePlaceholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t.wfDescLabel} <span className="text-muted-foreground">{t.wfDescOptional}</span></label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.wfDescPlaceholder}
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
              {isCreating ? t.wfCreating : t.wfCreate}
            </button>
          </form>
        </div>

        {/* AI generation column */}
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 flex flex-col items-center text-center gap-4">
          <div className="text-4xl">✨</div>
          <div>
            <h2 className="text-lg font-semibold">{t.wfGenerateTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.wfGenerateDesc}</p>
          </div>
          <AIWorkflowModal
            workspaceId={workspaceId}
            trigger={
              <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                {t.wfGenerate}
              </button>
            }
          />
        </div>
      </div>
    </div>
  )
}
