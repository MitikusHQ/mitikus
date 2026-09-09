import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ImportFlow } from './_components/ImportFlow'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { DashboardTranslations } from '@/i18n/dashboard-translations'

interface ImportPageProps {
  params: Promise<{ workspaceId: string }>
}

function getFormatCards(t: DashboardTranslations) {
  return [
    { icon: '📊', label: 'Excel', ext: '.xlsx / .xls', desc: t.importExcelDescription },
    { icon: '📋', label: 'CSV', ext: '.csv', desc: t.importCsvDescription },
    { icon: '📄', label: 'JSON', ext: '.json', desc: t.importJsonDescription },
    { icon: '📝', label: 'Word', ext: '.docx / .doc', desc: t.importWordDescription },
    { icon: '📑', label: 'PDF', ext: '.pdf', desc: t.importPdfDescription },
    { icon: '🔤', label: 'Markdown', ext: '.md', desc: t.importMarkdownDescription },
  ]
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { workspaceId } = await params
  const locale = await getLocale()
  const t = getDashboardTranslations(locale)
  const { userId: clerkId } = await auth()

  if (!clerkId) redirect('/sign-in')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect('/onboarding')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) redirect(`/workspace`)

  // Historial de importaciones recientes
  const recentImports = await db.importSource.findMany({
    where: { orgId: user.orgId },
    orderBy: { importedAt: 'desc' },
    take: 5,
    select: { id: true, originalName: true, format: true, importedAt: true, toolDefinitionId: true },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t.importTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t.importSubtitle}
        </p>
      </div>

      {/* Formatos soportados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {getFormatCards(t).map((f) => (
          <div key={f.label} className="rounded-lg border bg-card p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{f.icon}</span>
              <span className="font-medium text-sm">{f.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">{f.ext}</span>
            </div>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Flujo de importación */}
      <ImportFlow workspaceId={workspaceId} locale={locale} />

      {/* Importaciones recientes */}
      {recentImports.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t.importRecent}
          </h2>
          <div className="space-y-2">
            {recentImports.map((imp) => (
              <div key={imp.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 text-sm">
                <span className="font-medium truncate">{imp.originalName}</span>
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                  {imp.format} · {new Date(imp.importedAt).toLocaleDateString(locale)}
                </span>
                {imp.toolDefinitionId ? (
                  <span className="text-xs text-green-600 font-medium shrink-0">✓ {t.importSaved}</span>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">— {t.importNotSaved}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
