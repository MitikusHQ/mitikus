import { cn } from '@/lib/utils'
import { renderMarkdown } from '@/lib/ai/render-markdown'
import type { RendererProps } from '@/lib/ai/types'

/**
 * Renderer para respuestas conversacionales o markdown sin estructura de informe.
 * Aplica renderizado markdown básico con scroll limitado.
 */
export function ConversationRenderer({ text }: RendererProps) {
  const html = renderMarkdown(text)
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 overflow-auto',
        'text-sm leading-relaxed text-foreground',
        'max-h-[600px]',
      )}
      dangerouslySetInnerHTML={{ __html: `<div class="space-y-1">${html}</div>` }}
    />
  )
}
