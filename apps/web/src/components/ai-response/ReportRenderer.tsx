'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { parseReport } from '@/lib/ai/parse-report'
import { renderMarkdown } from '@/lib/ai/render-markdown'
import type { RendererProps } from '@/lib/ai/types'

function SectionContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: `<div class="space-y-1">${html}</div>` }}
    />
  )
}

/**
 * Renderer para informes estructurados con jerarquía de 4 secciones:
 * 🎯 Conclusión → ⚡ Acción → 📌 Por qué → 📄 Informe completo (plegable)
 */
export function ReportRenderer({ text }: RendererProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const parsed = parseReport(text)

  // Si no hay estructura suficiente, renderizar como markdown plano
  if (!parsed.hasStructure) {
    return (
      <div
        className="text-sm leading-relaxed text-foreground overflow-auto max-h-[600px]"
        dangerouslySetInnerHTML={{ __html: `<div class="space-y-1">${renderMarkdown(text)}</div>` }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* 🎯 Conclusión ejecutiva — mayor peso visual */}
      {parsed.conclusion && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span aria-hidden="true">🎯</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/60">
              Conclusión ejecutiva
            </span>
          </div>
          <SectionContent
            html={renderMarkdown(parsed.conclusion)}
            className="text-[15px] font-medium leading-relaxed text-foreground"
          />
        </div>
      )}

      {/* ⚡ Acción recomendada — destacada, no agresiva */}
      {parsed.action && (
        <div className="rounded-xl border bg-card p-5 border-l-[3px] border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <span aria-hidden="true">⚡</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Acción recomendada
            </span>
          </div>
          <SectionContent
            html={renderMarkdown(parsed.action)}
            className="text-sm font-medium leading-relaxed text-foreground"
          />
        </div>
      )}

      {/* 📌 ¿Por qué? — evidencias de soporte */}
      {parsed.why && (
        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span aria-hidden="true">📌</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              ¿Por qué?
            </span>
          </div>
          <SectionContent
            html={renderMarkdown(parsed.why)}
            className="text-sm leading-relaxed text-muted-foreground"
          />
        </div>
      )}

      {/* 📄 Informe completo — plegable, cerrado por defecto */}
      {parsed.report && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setReportOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">📄</span>
              <span className="text-sm font-medium">Informe completo</span>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className={cn(
                'text-muted-foreground transition-transform duration-200',
                reportOpen && 'rotate-180',
              )}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {reportOpen && (
            <div className="border-t px-5 py-4">
              <SectionContent
                html={renderMarkdown(parsed.report)}
                className="text-sm leading-relaxed text-foreground overflow-auto max-h-[500px]"
              />
            </div>
          )}
        </div>
      )}

    </div>
  )
}
