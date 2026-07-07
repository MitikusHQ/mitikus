import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ImportFlow } from './_components/ImportFlow'

interface ImportPageProps {
  params: Promise<{ workspaceId: string }>
}

const FORMAT_CARDS = [
  { icon: '📊', label: 'Excel', ext: '.xlsx / .xls', desc: 'Hojas de cálculo con campos, tablas y listas' },
  { icon: '📋', label: 'CSV', ext: '.csv', desc: 'Datos tabulares separados por comas o punto y coma' },
  { icon: '📄', label: 'JSON', ext: '.json', desc: 'JSON genérico o ToolSchema ProTools directamente' },
  { icon: '📝', label: 'Word', ext: '.docx / .doc', desc: 'Documentos con encabezados, formularios y listas' },
  { icon: '📑', label: 'PDF', ext: '.pdf', desc: 'Formularios y documentos con texto extraíble' },
  { icon: '🔤', label: 'Markdown', ext: '.md', desc: 'Guías, checklists y documentos técnicos' },
]

export default async function ImportPage({ params }: ImportPageProps) {
  const { workspaceId } = await params
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
        <h1 className="text-2xl font-bold">Import Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Convierte cualquier archivo en una herramienta ProTools
        </p>
      </div>

      {/* Formatos soportados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FORMAT_CARDS.map((f) => (
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
      <ImportFlow workspaceId={workspaceId} />

      {/* Importaciones recientes */}
      {recentImports.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Importaciones recientes
          </h2>
          <div className="space-y-2">
            {recentImports.map((imp) => (
              <div key={imp.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 text-sm">
                <span className="font-medium truncate">{imp.originalName}</span>
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                  {imp.format} · {new Date(imp.importedAt).toLocaleDateString('es-ES')}
                </span>
                {imp.toolDefinitionId ? (
                  <span className="text-xs text-green-600 font-medium shrink-0">✓ guardada</span>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">— sin guardar</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
