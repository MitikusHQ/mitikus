import type { RendererProps } from '@/lib/ai/types'

/**
 * Renderer para respuestas JSON.
 * Presenta los datos formateados en monoespaciado — nunca como informe.
 */
export function JsonRenderer({ text }: RendererProps) {
  let formatted = text
  try {
    formatted = JSON.stringify(JSON.parse(text), null, 2)
  } catch { /* mantener el original si no parsea */ }

  return (
    <pre className="text-xs leading-relaxed text-foreground bg-muted/50 rounded-xl border p-5 overflow-auto max-h-[500px] font-mono whitespace-pre-wrap">
      {formatted}
    </pre>
  )
}
