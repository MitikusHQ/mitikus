import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getModelConfig } from '@/lib/fiscal-models-config'
import { COUNTRY_LABELS, type Country } from '@/lib/fiscal-calendar'
import { getFiscalDeclaration } from '@/app/actions/fiscal-declarations'
import { GenericDeclarationClient } from '../../_components/GenericDeclarationClient'

interface Props {
  params: Promise<{ workspaceId: string; country: string; modelo: string }>
}

export default async function CountryModeloPage({ params }: Props) {
  const [{ workspaceId, country, modelo }, user] = await Promise.all([params, requireUser()])

  const config = getModelConfig(country, modelo)
  if (!config) notFound()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  // Verify workspace country matches
  const profile = await db.companyProfile.findUnique({
    where: { workspaceId },
    select: { country: true },
  })
  if (profile?.country && profile.country !== country) notFound()

  const year   = new Date().getFullYear() - 1
  const periodo = 'Anual'

  const dec = await getFiscalDeclaration(workspaceId, modelo, periodo, year).catch(() => null)

  const prefill = dec ? (dec.data as Record<string, string>) : undefined

  const countryLabel = COUNTRY_LABELS[country as Country] ?? country

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background print:hidden">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/workspace/${workspaceId}/fiscal`}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Calendario Fiscal
          </Link>
          <span>/</span>
          <span>{countryLabel}</span>
          <span>/</span>
          <span className="font-semibold text-foreground">{modelo}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              {countryLabel}
            </span>
          </div>
          <h1 className="text-xl font-bold">{config.titulo}</h1>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => window.print()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>

        <GenericDeclarationClient
          workspaceId={workspaceId}
          modelo={modelo}
          periodo={periodo}
          year={year}
          config={config}
          prefill={prefill}
          initialId={dec?.id}
          initialStatus={dec?.status}
        />
      </div>
    </>
  )
}
