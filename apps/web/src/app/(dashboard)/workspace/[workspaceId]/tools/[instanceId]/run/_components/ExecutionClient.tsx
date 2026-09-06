'use client'

import { useState, useCallback, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DataSchema, FormConfig } from '@protools/schema'
import { VariableForm } from './VariableForm'
import { ExecutionResult, type ExecutionState } from './ExecutionResult'
import { createSocialPostDraftFromAI } from '@/app/actions/record'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface ExecutionApiResponse {
  executionId: string
  result: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostEUR: number
  durationMs: number
  error?: string
}

interface NextTool {
  slug: string
  name: string
  reason: string
}

interface Props {
  toolInstanceId: string
  workspaceId: string
  toolName: string
  toolSlug: string
  fields: DataSchema['fields']
  initialValues?: Record<string, string>
  contextDefaults?: Record<string, string>
  fromMissionId?: string
  fromStepId?: string
  nextTools?: NextTool[]
  formSections?: FormConfig['sections']
  locale: Locale
}

export function ExecutionClient({
  toolInstanceId, workspaceId, toolName, toolSlug, fields, initialValues, contextDefaults, fromMissionId, fromStepId, nextTools = [], formSections, locale,
}: Props) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(
    { ...contextDefaults, ...initialValues },
  )
  const [execState, setExecState] = useState<ExecutionState>({ type: 'idle' })
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [isSavingDraft, startSavingDraft] = useTransition()
  const [draftSaveState, setDraftSaveState] = useState<{ type: 'idle' } | { type: 'success'; recordId: string } | { type: 'error'; message: string }>({ type: 'idle' })
  const effectiveFields = useMemo(() => {
    if (toolSlug !== 'social-media-manager') return fields
    return Object.fromEntries(
      Object.entries(fields).map(([fieldId, field]) => [
        fieldId,
        { ...field, required: fieldId === 'copy' },
      ]),
    ) as DataSchema['fields']
  }, [fields, toolSlug])

  const handleCompleteStep = useCallback(async () => {
    if (!fromMissionId || !fromStepId) return
    setCompleting(true)
    setCompleteError(null)
    try {
      const res = await fetch(`/api/missions/${fromMissionId}/steps/${fromStepId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) throw new Error()
      router.push(`/workspace/${workspaceId}/missions/${fromMissionId}`)
    } catch {
      setCompleteError(t.toolMissionUpdateError)
      setCompleting(false)
    }
  }, [fromMissionId, fromStepId, workspaceId, router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setExecState({ type: 'loading' })

      try {
        const res = await fetch('/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolInstanceId, workspaceId, variables: values }),
        })

        const data = (await res.json()) as ExecutionApiResponse

        if (!res.ok || data.error) {
          setExecState({ type: 'error', message: data.error ?? t.toolUnknownError })
          return
        }

        setExecState({
          type: 'success',
          executionId: data.executionId,
          result: data.result,
          model: data.model,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          estimatedCostEUR: data.estimatedCostEUR,
          durationMs: data.durationMs,
        })
      } catch {
        setExecState({ type: 'error', message: t.toolConnectionError })
      }
    },
    [toolInstanceId, workspaceId, values],
  )

  const isLoading = execState.type === 'loading'
  const canSaveSocialDraft = toolSlug === 'social-media-manager' && execState.type === 'success'

  const handleSaveSocialDraft = useCallback(() => {
    if (execState.type !== 'success') return
    setDraftSaveState({ type: 'idle' })
    startSavingDraft(() => {
      void (async () => {
        const result = await createSocialPostDraftFromAI(toolInstanceId, values, execState.result)
        if (result.ok) {
          setDraftSaveState({ type: 'success', recordId: result.recordId })
          router.refresh()
        } else {
          setDraftSaveState({ type: 'error', message: result.error })
        }
      })()
    })
  }, [execState, toolInstanceId, values, router])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Panel izquierdo: variables */}
      <div>
        <div className="rounded-xl border bg-card p-5 sticky top-6">
          <div className="mb-5">
            <h2 className="font-semibold text-[15px]">{t.toolInputVariables}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.toolInputDescription}
            </p>
            {contextDefaults && Object.keys(contextDefaults).length > 0 && (
              <p className="text-[11px] text-primary/70 mt-1.5 flex items-center gap-1">
                <span>📎</span>
                <span>{t.toolContextFilled}</span>
              </p>
            )}
          </div>
          <VariableForm
            fields={effectiveFields}
            values={values}
            onChange={setValues}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            contextFields={new Set(Object.keys(contextDefaults ?? {}))}
            formSections={formSections}
            locale={locale}
          />
        </div>
      </div>

      {/* Panel derecho: resultado */}
      <div>
        <div className="mb-4">
          <h2 className="font-semibold text-[15px]">{t.toolResult}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.toolResultDescription} <span className="font-medium">{toolName}</span>
          </p>
        </div>
        <ExecutionResult state={execState} toolName={toolName} locale={locale} />

        {canSaveSocialDraft && (
          <div className="mt-3 rounded-xl border bg-card p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">{t.toolSaveSocialTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.toolSaveSocialDescription}
              </p>
            </div>
            {draftSaveState.type === 'success' && (
              <p className="text-xs text-green-600 dark:text-green-400">{t.toolDraftSaved}</p>
            )}
            {draftSaveState.type === 'error' && (
              <p className="text-xs text-destructive">{draftSaveState.message}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleSaveSocialDraft}
                disabled={isSavingDraft || draftSaveState.type === 'success'}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isSavingDraft ? t.toolSaving : draftSaveState.type === 'success' ? t.toolSaved : t.toolSaveDraft}
              </button>
              {draftSaveState.type === 'success' && (
                <a
                  href={`/workspace/${workspaceId}/tools/${toolInstanceId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t.toolViewPosts} →
                </a>
              )}
            </div>
          </div>
        )}

        {execState.type === 'success' && fromMissionId && fromStepId && (
          <div className="mt-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">
              ✓ {t.toolMissionStepGenerated}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.toolMissionStepGeneratedDescription}
            </p>
            {completeError && (
              <p className="text-xs text-destructive">{completeError}</p>
            )}
            <button
              type="button"
              onClick={handleCompleteStep}
              disabled={completing}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {completing ? t.toolUpdatingMission : `${t.toolBackToMissionDone} →`}
            </button>
          </div>
        )}

        {execState.type === 'success' && nextTools.length > 0 && (
          <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t.toolContinueWith}
            </p>
            <div className="flex flex-col gap-2">
              {nextTools.map((nextTool) => (
                <a
                  key={nextTool.slug}
                  href={`/tools/${nextTool.slug}?workspaceId=${workspaceId}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                      {nextTool.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{nextTool.reason}</p>
                  </div>
                  <span className="text-xs text-primary shrink-0">{t.toolUse} →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {execState.type === 'success' && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExecState({ type: 'idle' })}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {t.toolNewExecution}
            </button>
            <span className="text-muted-foreground/30">·</span>
            <a
              href={`/workspace/${workspaceId}/tools/${toolInstanceId}/history`}
              className="text-xs text-primary hover:underline"
            >
              {t.todayViewHistory} →
            </a>
            {fromMissionId && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <a
                  href={`/workspace/${workspaceId}/missions/${fromMissionId}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.toolBackWithoutDone}
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}





