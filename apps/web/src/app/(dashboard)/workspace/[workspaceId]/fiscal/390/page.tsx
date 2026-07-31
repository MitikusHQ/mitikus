import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFiscalDeclaration } from '@/app/actions/fiscal-declarations'
import { Modelo390Client } from './_components/Modelo390Client'

interface Props { params: Promise<{ workspaceId: string }> }

export default async function Modelo390Page({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { id: true } })
  if (!workspace) notFound()

  const year = new Date().getFullYear() - 1 // resumen del año anterior
  const saved = await getFiscalDeclaration(workspaceId, '390', 'Anual', year)

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/fiscal`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Calendario Fiscal
        </Link>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-semibold">390</span>
            <h1 className="text-xl font-semibold">Resumen anual IVA</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Ejercicio {year} — Resumen de las cuatro declaraciones trimestrales (303)</p>
        </div>
        <Modelo390Client
          year={year}
          save={{ workspaceId, periodoLabel: `Anual ${year}`, initialStatus: saved?.status, initialId: saved?.id, initialData: saved?.data as Record<string,string> | undefined }}
        />
      </div>
    </>
  )
}
