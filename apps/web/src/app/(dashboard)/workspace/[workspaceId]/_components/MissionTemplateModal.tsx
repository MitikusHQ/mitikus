'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MISSION_TEMPLATES } from '@/lib/missions/templates'
import type { MissionTemplate } from '@/lib/missions/templates'
import { createMissionFromTemplate } from '@/app/actions/mission-templates'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  workspaceId: string
  locale: Locale
}

export function MissionTemplateButton({ workspaceId, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground border border-dashed border-input rounded-md px-3 py-1.5 transition-colors"
      >
        {t.templateFromTemplate}
      </button>
      {open && <MissionTemplateModal workspaceId={workspaceId} locale={locale} onClose={() => setOpen(false)} />}
    </>
  )
}

function MissionTemplateModal({ workspaceId, locale, onClose }: { workspaceId: string; locale: Locale; onClose: () => void }) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [selected, setSelected] = useState<MissionTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const { objectiveId } = await createMissionFromTemplate(workspaceId, selected.id)
      router.push(`/workspace/${workspaceId}/missions/${objectiveId}`)
      onClose()
    } catch {
      setError(t.templateError)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold text-base">{t.templateModalTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t.templateModalSubtitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>

        {/* Grid de plantillas */}
        <div className="overflow-y-auto flex-1 p-4">
          {selected === null ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {MISSION_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelected(tmpl)}
                  className="text-left rounded-lg border p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{tmpl.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{tmpl.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tmpl.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tmpl.tag}</span>
                        <span className="text-[10px] text-muted-foreground">{tmpl.steps.length} {t.templateSteps}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {/* Preview de pasos */}
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                {t.templateBackToList}
              </button>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selected.icon}</span>
                <div>
                  <h3 className="font-semibold">{selected.label}</h3>
                  <p className="text-xs text-muted-foreground">{selected.description}</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {t.templateIncludedStepsPrefix}{selected.steps.length})
              </p>
              <ol className="space-y-2">
                {selected.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {step.responsibleActor === 'ai' ? t.templateActorAI : step.responsibleActor === 'shared' ? t.templateActorShared : t.templateActorUser}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {step.estimatedMinutes} {t.templateMinutes}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div className="border-t px-6 py-4 flex items-center justify-between gap-3">
            {error && <p className="text-xs text-destructive flex-1">{error}</p>}
            {!error && <span />}
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="text-sm px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors"
              >
                {t.templateBack}
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? t.templateCreating : t.templateCreate}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
