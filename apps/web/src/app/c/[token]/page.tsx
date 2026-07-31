import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const share = await db.clientShare.findUnique({
    where:  { token },
    select: { document: { select: { title: true } }, workspace: { select: { name: true } } },
  })
  if (!share) return { title: 'Informe no encontrado' }
  return {
    title: `${share.document.title} · ${share.workspace.name}`,
    robots: { index: false },
  }
}

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params

  const share = await db.clientShare.findUnique({
    where: { token },
    include: {
      document:  { select: { title: true, content: true, rawText: true, createdAt: true, wordCount: true } },
      workspace: { select: { name: true } },
    },
  })

  if (!share) notFound()

  // Marcar como visto la primera vez (fire-and-forget)
  if (!share.viewedAt) {
    void db.clientShare.update({
      where: { token },
      data:  { viewedAt: new Date() },
    }).catch(() => null)
  }

  const { document: doc, workspace } = share
  const dateStr = doc.createdAt.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Cabecera de marca */}
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <span className="text-white text-sm font-bold tracking-widest uppercase">
          {workspace.name}
        </span>
        <span className="text-slate-500 text-xs">mitikus.com</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Título e info */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {doc.title}
          </h1>
          <p className="text-sm text-slate-500">
            {dateStr} · {doc.wordCount.toLocaleString()} palabras
            {share.recipientName ? ` · Para ${share.recipientName}` : ''}
          </p>
          {share.note && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {share.note}
            </div>
          )}
        </div>

        {/* Separador */}
        <hr className="border-slate-200 dark:border-slate-800 mb-8" />

        {/* Contenido del documento */}
        <div
          className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 py-8 text-center">
        <p className="text-xs text-slate-400">
          Enviado por <strong className="text-slate-500">{workspace.name}</strong> a través de{' '}
          <a href="https://mitikus.com" className="text-slate-500 hover:text-slate-700 transition-colors">
            MITIKUS
          </a>
        </p>
      </footer>
    </div>
  )
}
