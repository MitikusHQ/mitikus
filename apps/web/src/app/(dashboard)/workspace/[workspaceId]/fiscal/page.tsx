import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFiscalEvents, LEGAL_FORM_LABELS, COUNTRY_LABELS, COUNTRY_AGENCY, type LegalForm, type Country, type FiscalEventWithStatus } from '@/lib/fiscal-calendar'
import { getCountryModels } from '@/lib/fiscal-models-config'
import { FiscalSetupPicker } from './_components/FiscalSetupPicker'
import { listFiscalDeclarations } from '@/app/actions/fiscal-declarations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function FiscalPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const profile = await db.companyProfile.findUnique({
    where: { workspaceId },
    select: { legalForm: true, country: true },
  })

  const legalForm = profile?.legalForm as LegalForm | null
  const country   = (profile?.country ?? null) as Country | null

  if (!country && !legalForm) {
    return (
      <>
        <div className="px-6 py-2.5 border-b bg-background">
          <Link href={`/workspace/${workspaceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Mi Office
          </Link>
        </div>
        <FiscalSetupPicker workspaceId={workspaceId} />
      </>
    )
  }

  const effectiveCountry = country ?? 'ES'

  const [events, declarations] = await Promise.all([
    Promise.resolve(getFiscalEvents(effectiveCountry, legalForm)),
    listFiscalDeclarations(workspaceId),
  ])
  const configurableModels = new Set(
    effectiveCountry === 'ES'
      ? ['303', '130', '111', '115', '202', '390', '190', '347', '184', '100', '200']
      : getCountryModels(effectiveCountry)
  )

  const upcoming = events.filter((e) => e.status !== 'vencido' || (e.daysLeft !== null))
  const proximos = upcoming.filter((e) => e.status === 'proximo')
  const pendientes = upcoming.filter((e) => e.status === 'pendiente')
  const vencidos = upcoming.filter((e) => e.status === 'vencido')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="px-0">
        <Link href={`/workspace/${workspaceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Mi Office
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Calendario Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {effectiveCountry === 'ES' && legalForm
              ? <><span className="font-medium">{LEGAL_FORM_LABELS[legalForm]}</span> · {COUNTRY_LABELS['ES']} {new Date().getFullYear()}</>
              : <>{COUNTRY_LABELS[effectiveCountry]} {new Date().getFullYear()}</>
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}/fiscal/resumen`}
            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity font-medium"
          >
            Resumen para gestor →
          </Link>
          <Link
            href={`/workspace/${workspaceId}/fiscal/configurar`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cambiar forma jurídica
          </Link>
        </div>
      </div>

      {/* Próximos — alerta */}
      {proximos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <span>⚠️</span> Próximos (30 días)
          </h2>
          <div className="space-y-2">
            {proximos.map((e) => <EventCard key={e.id} event={e} workspaceId={workspaceId} agencyLabel={COUNTRY_AGENCY[effectiveCountry]} configurableModels={configurableModels} country={effectiveCountry} />)}
          </div>
        </section>
      )}

      {/* Vencidos recientes */}
      {vencidos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 flex items-center gap-2">
            <span>🔴</span> Vencidos recientemente
          </h2>
          <div className="space-y-2">
            {vencidos.map((e) => <EventCard key={e.id} event={e} workspaceId={workspaceId} agencyLabel={COUNTRY_AGENCY[effectiveCountry]} configurableModels={configurableModels} country={effectiveCountry} />)}
          </div>
        </section>
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <span>📅</span> Resto del año
          </h2>
          <div className="space-y-2">
            {pendientes.map((e) => <EventCard key={e.id} event={e} workspaceId={workspaceId} agencyLabel={COUNTRY_AGENCY[effectiveCountry]} configurableModels={configurableModels} country={effectiveCountry} />)}
          </div>
        </section>
      )}

      {/* Historial */}
      {declarations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <span>🗂️</span> Historial de declaraciones
            </h2>
            <a
              href={`/api/workspace/${workspaceId}/fiscal/export-csv`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </a>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Modelo</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Período</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Resultado</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Estado</th>
                  <th className="w-10"/>
                </tr>
              </thead>
              <tbody className="divide-y">
                {declarations.map((dec) => (
                  <tr key={dec.id} className="bg-card">
                    <td className="px-4 py-2.5 font-semibold text-primary">{dec.modelo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{dec.periodo} {dec.year}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      <span className={dec.resultado > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {dec.resultado > 0 ? '' : '− '}
                        {Math.abs(dec.resultado).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        dec.status === 'presentada'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {dec.status === 'presentada' ? '✓ Presentada' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/workspace/${workspaceId}/fiscal/${dec.modelo}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function EventCard({ event, workspaceId, agencyLabel, configurableModels, country }: {
  event: FiscalEventWithStatus
  workspaceId: string
  agencyLabel: string
  configurableModels: Set<string>
  country: Country
}) {
  const deadlineStr = event.deadline.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const statusBadge = {
    vencido:  { label: 'Vencido',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    proximo:  { label: event.daysLeft === 0 ? 'Hoy' : `${event.daysLeft}d`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    pendiente: { label: event.daysLeft !== null ? `${event.daysLeft}d` : '—', cls: 'bg-muted text-muted-foreground' },
    sin_aplica: { label: '—', cls: 'bg-muted text-muted-foreground' },
  }[event.status]

  return (
    <div className={`rounded-lg border bg-card p-4 flex items-start gap-4 ${event.status === 'vencido' ? 'opacity-60' : ''}`}>
      <div className="shrink-0 w-12 text-center">
        <div className="text-lg font-bold text-primary">{event.modelo}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{event.titulo}</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">{event.periodo}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{event.descripcion}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Plazo: <span className="font-medium">{deadlineStr}</span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
        {configurableModels.has(event.modelo) && (
          <Link
            href={
              country === 'ES'
                ? `/workspace/${workspaceId}/fiscal/${event.modelo}`
                : `/workspace/${workspaceId}/fiscal/${country}/${event.modelo}`
            }
            className="text-xs text-primary hover:underline font-medium"
          >
            Calcular →
          </Link>
        )}
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          {agencyLabel} →
        </a>
      </div>
    </div>
  )
}
