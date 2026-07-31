import { getNotebookByToken } from '@/lib/notebook-public'
import { notFound } from 'next/navigation'

export default async function PublicNotebookPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const notebook = await getNotebookByToken(token)
  if (!notebook) notFound()

  let synthesis: { summary: string; keyPoints: string[]; suggestedQuestions: string[] } | null = null
  if (notebook.synthesisCache) {
    try {
      synthesis = JSON.parse(notebook.synthesisCache)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-xs text-muted-foreground mb-2">Notebook compartido · MITIKUS</p>
          <h1 className="text-2xl font-semibold">{notebook.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notebook.sources.length} {notebook.sources.length === 1 ? 'fuente' : 'fuentes'}
          </p>
        </div>

        {notebook.sources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Fuentes</h2>
            <div className="space-y-1">
              {notebook.sources.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{s.type === 'doc' ? '📄' : s.type === 'pdf' ? '📑' : s.type === 'url' ? '🔗' : '📝'}</span>
                  <span>{s.title}</span>
                  <span className="ml-auto tabular-nums">{s.charCount.toLocaleString()} chars</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {synthesis ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Resumen</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{synthesis.summary}</p>
            </div>
            {synthesis.keyPoints?.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Puntos clave</h2>
                <ul className="space-y-1">
                  {synthesis.keyPoints.map((p, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Este notebook no tiene síntesis generada todavía.</p>
        )}
      </div>
    </div>
  )
}
