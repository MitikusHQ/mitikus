'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { NormalizedDocument } from '@protools/import-engine'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

type Step = 'upload' | 'preview' | 'converting' | 'review' | 'done'

interface ImportFlowProps {
  workspaceId: string
  locale: Locale
}

const ACCEPTED_TYPES = '.xlsx,.xls,.csv,.json,.docx,.doc,.pdf,.md,.txt'

function getFormatLabels(t: ReturnType<typeof getDashboardTranslations>): Record<string, string> {
  return {
    excel: 'Excel',
    csv: 'CSV',
    json: 'JSON',
    'tool-schema': 'ToolSchema (MITIKUS)',
    docx: 'Word',
    pdf: 'PDF',
    markdown: 'Markdown',
    'plain-text': t.importPlainText,
  }
}

export function ImportFlow({ workspaceId, locale }: ImportFlowProps) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [document, setDocument] = useState<NormalizedDocument | null>(null)
  const [schema, setSchema] = useState<unknown>(null)
  const [isDirectSchema, setIsDirectSchema] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number; costEUR: number } | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setWarnings([])
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import/process', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t.importProcessError)
        setLoading(false)
        return
      }

      setDocument(data.document)
      setIsDirectSchema(data.isDirectSchema)
      setWarnings(data.warnings ?? [])
      setStep('preview')

      // Si es ToolSchema válido directo, convertir sin IA
      if (data.isDirectSchema) {
        setSchema(JSON.parse(data.document.rawText))
        setStep('review')
      }
    } catch {
      setError(t.importNetworkProcessError)
    } finally {
      setLoading(false)
    }
  }

  async function handleConvert() {
    if (!document) return
    setError(null)
    setStep('converting')
    setLoading(true)

    try {
      const res = await fetch('/api/import/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document, workspaceId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t.importConvertError)
        setStep('preview')
        setLoading(false)
        return
      }

      setSchema(data.schema)
      setUsage(data.usage)
      setWarnings((prev) => [...prev, ...(data.warnings ?? [])])
      setStep('review')
    } catch {
      setError(t.importNetworkConvertError)
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!schema || !document) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema,
          importMeta: {
            format: document.metadata.format,
            originalName: document.metadata.source,
            fileSizeBytes: document.metadata.fileSizeBytes,
            confidence: document.metadata.confidence,
            warnings,
          },
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t.importSaveError)
        setLoading(false)
        return
      }

      setSavedSlug(data.slug)
      setStep('done')
    } catch {
      setError(t.importNetworkSaveError)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('upload')
    setDocument(null)
    setSchema(null)
    setError(null)
    setWarnings([])
    setLoading(false)
    setUsage(null)
    setSavedSlug(null)
    setIsDirectSchema(false)
  }

  // ─── Upload step ───────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) void handleFile(file)
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <div className="text-4xl mb-4">📂</div>
        <h3 className="text-lg font-semibold mb-2">{t.importDropTitle}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t.importDropSubtitle}
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? t.importProcessing : t.importSelectFile}
        </button>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  // ─── Preview step ──────────────────────────────────────────
  if (step === 'preview' && document) {
    const fmt = getFormatLabels(t)[document.metadata.format] ?? document.metadata.format
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">{document.metadata.title ?? document.metadata.source}</h3>
              <p className="text-sm text-muted-foreground">
                {t.importFormat}: <span className="font-medium">{fmt}</span> · {t.importConfidence}: {Math.round(document.metadata.confidence * 100)}%
              </p>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {(document.metadata.fileSizeBytes / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat label={t.importFields} value={document.fields.length} />
            <Stat label={t.importTables} value={document.tables.length} />
            <Stat label={t.importChecklists} value={document.checklists.length} />
            <Stat label={t.importSections} value={document.sections.length} />
          </div>

          {document.fields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t.importDetectedFields}</p>
              <div className="flex flex-wrap gap-2">
                {document.fields.slice(0, 12).map((f) => (
                  <span key={f.id} className="text-xs bg-muted px-2 py-1 rounded">
                    {f.label} <span className="text-muted-foreground">({f.type})</span>
                  </span>
                ))}
                {document.fields.length > 12 && (
                  <span className="text-xs text-muted-foreground">+{document.fields.length - 12} {t.importMore}</span>
                )}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-xs font-medium text-yellow-800 mb-1">{t.importWarnings}</p>
              {warnings.slice(0, 5).map((w, i) => (
                <p key={i} className="text-xs text-yellow-700">· {w}</p>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => void handleConvert()}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t.importProcessing : `✦ ${t.importConvertToTool}`}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2.5 border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            {t.importCancel}
          </button>
        </div>
      </div>
    )
  }

  // ─── Converting step ───────────────────────────────────────
  if (step === 'converting') {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-4">
        <div className="text-4xl animate-pulse">⚙️</div>
        <p className="font-medium">{t.importAnalyzing}</p>
        <p className="text-sm text-muted-foreground">{t.importAnalyzingHelp}</p>
      </div>
    )
  }

  // ─── Review step ───────────────────────────────────────────
  if (step === 'review' && schema) {
    const s = schema as Record<string, unknown>
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">{String(s.title ?? t.importImportedToolFallback)}</h3>
              <p className="text-sm text-muted-foreground">{String(s.description ?? '')}</p>
            </div>
            {isDirectSchema && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">{t.importValidToolSchema}</span>
            )}
          </div>

          {usage && (
            <div className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
              {usage.inputTokens.toLocaleString(locale)} {t.importTokensProcessed} · ~€{usage.costEUR.toFixed(4)}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t.importGeneratedSchemaPreview}</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(schema, null, 2).slice(0, 2000)}
            </pre>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              {warnings.slice(0, 5).map((w, i) => (
                <p key={i} className="text-xs text-yellow-700">· {w}</p>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => void handleSave()}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t.importSaving : t.importSaveTool}
          </button>
          <button
            onClick={() => setStep('preview')}
            disabled={loading}
            className="px-4 py-2.5 border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            {t.importBack}
          </button>
        </div>
      </div>
    )
  }

  // ─── Done step ─────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-4">
        <div className="text-4xl">✓</div>
        <h3 className="font-semibold text-lg">{t.importToolImported}</h3>
        <p className="text-sm text-muted-foreground">{t.importAvailableInCatalog}</p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => router.push(`/workspace/${workspaceId}/tools`)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t.importViewTools}
          </button>
          <button
            onClick={reset}
            className="px-6 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            {t.importAnother}
          </button>
        </div>
      </div>
    )
  }

  return null
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
