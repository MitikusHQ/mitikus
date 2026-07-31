import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LEGAL_FORM_LABELS, type LegalForm } from '@/lib/fiscal-calendar'
import { ResumenGestorClient } from './_components/ResumenGestorClient'
import { listFiscalDeclarations } from '@/app/actions/fiscal-declarations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ResumenGestorPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, profile, declarations] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { id: true, name: true } }),
    db.companyProfile.findUnique({ where: { workspaceId }, select: { legalForm: true } }),
    listFiscalDeclarations(workspaceId),
  ])
  if (!workspace) notFound()

  const legalFormLabel = profile?.legalForm
    ? LEGAL_FORM_LABELS[profile.legalForm as LegalForm]
    : 'Empresa'

  // Pre-fill from saved declarations — pick most recent period's 303 and 130
  const dec303 = declarations.find((d) => d.modelo === '303')
  const dec130 = declarations.find((d) => d.modelo === '130')
  const prefill = {
    periodo: (dec303 ?? dec130)?.periodo ?? undefined,
    year:    (dec303 ?? dec130)?.year    ?? undefined,
    // 303 fields
    ivaRep21: (dec303?.data as Record<string,string>)?.['cuota_rep-21'] ?? '',
    ivaRep10: (dec303?.data as Record<string,string>)?.['cuota_rep-10'] ?? '',
    ivaRep4:  (dec303?.data as Record<string,string>)?.['cuota_rep-4']  ?? '',
    ivaSop21: (dec303?.data as Record<string,string>)?.['cuota_sop-21'] ?? '',
    ivaSop10: (dec303?.data as Record<string,string>)?.['cuota_sop-10'] ?? '',
    ivaSop4:  (dec303?.data as Record<string,string>)?.['cuota_sop-4']  ?? '',
    ivaComp:  (dec303?.data as Record<string,string>)?.['compensar']    ?? '',
    // 130 fields
    ingresos:    (dec130?.data as Record<string,string>)?.['ingresos']    ?? '',
    gastos:      (dec130?.data as Record<string,string>)?.['gastos']      ?? '',
    retenciones: (dec130?.data as Record<string,string>)?.['retenciones'] ?? '',
    cuotaSS:     (dec130?.data as Record<string,string>)?.['cuotaSS']     ?? '',
  }

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background print:hidden">
        <Link
          href={`/workspace/${workspaceId}/fiscal`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Calendario Fiscal
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="print:hidden">
          <h1 className="text-xl font-semibold">Resumen para el gestor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dec303 ?? dec130
              ? 'Datos precargados desde tus borradores guardados'
              : 'Rellena los datos del trimestre y genera un PDF para tu asesor'}
          </p>
        </div>
        <ResumenGestorClient
          workspaceName={workspace.name}
          legalForm={legalFormLabel}
          prefill={prefill}
        />
      </div>
    </>
  )
}
