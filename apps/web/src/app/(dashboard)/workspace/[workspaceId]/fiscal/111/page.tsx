import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Modelo111Client } from './_components/Modelo111Client'
import { getFiscalDeclaration } from '@/app/actions/fiscal-declarations'

interface Props { params: Promise<{ workspaceId: string }> }

function getCurrentPeriod() {
  const m = new Date().getMonth() + 1, y = new Date().getFullYear()
  if (m <= 4)  return { label: `T1 ${y - 1}`, periodo: 'T1', year: y - 1 }
  if (m <= 7)  return { label: `T2 ${y}`,     periodo: 'T2', year: y }
  if (m <= 10) return { label: `T3 ${y}`,     periodo: 'T3', year: y }
  return             { label: `T4 ${y}`,     periodo: 'T4', year: y }
}

export default async function Modelo111Page({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { id: true } })
  if (!workspace) notFound()

  const { label, periodo, year } = getCurrentPeriod()
  const saved = await getFiscalDeclaration(workspaceId, '111', periodo, year)

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/fiscal`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Calendario Fiscal
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Modelo 111 — Retenciones IRPF</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Retenciones e ingresos a cuenta · {label}</p>
        </div>
        <Modelo111Client
          periodo={label}
          save={{
            workspaceId, periodoLabel: label,
            initialStatus: saved?.status,
            initialId:     saved?.id,
            initialData:   saved?.data as Record<string, string> | undefined,
          }}
        />
      </div>
    </>
  )
}
