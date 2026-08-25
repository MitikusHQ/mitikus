import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { validateToolSchema } from '@protools/schema'
import type { TableConfig, DataSchema } from '@protools/schema'
import { DeleteButton } from './_components/DeleteButton'
import { CapabilityNav } from './_components/CapabilityNav'
import { ToolSectionNav } from './_components/ToolSectionNav'
import { SocialMediaPostsView } from './_components/SocialMediaPostsView'
import { buildCapabilityTabs } from '@/lib/capability-tabs'
import { getLocale } from '@/i18n/locale'
import { formatDate, formatRelativeDate } from '@/lib/format-date'
import { detectStatusVariant, scoreVariant } from '@/app/(dashboard)/_components/StatusBadge'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

function SmartCell({ value, fieldType, locale }: { value: unknown; fieldType: string; locale: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  if (fieldType === 'boolean') {
    const bool = Boolean(value)
    const label = bool ? (locale === 'es' ? 'Sí' : 'Yes') : 'No'
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        bool
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      )}>
        {label}
      </span>
    )
  }

  if (fieldType === 'number') {
    const n = Number(value)
    if (!isNaN(n) && n >= 0 && n <= 10) {
      const v = scoreVariant(n)
      const cls: Record<string, string> = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        blue:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        danger:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      }
      return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-mono', cls[v])}>
          {n.toFixed(1)}
        </span>
      )
    }
    return <span>{isNaN(n) ? '—' : String(n)}</span>
  }

  if (fieldType === 'date') {
    try {
      return <span className="whitespace-nowrap">{formatDate(String(value), locale)}</span>
    } catch {
      return <span>{String(value)}</span>
    }
  }

  const str = String(value)
  const statusVariant = detectStatusVariant(str)
  if (statusVariant) {
    const cls: Record<string, string> = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      danger:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      blue:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      neutral: 'bg-muted text-muted-foreground',
    }
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cls[statusVariant])}>
        {str}
      </span>
    )
  }

  return <span title={str.length > 80 ? str : undefined}>{str.length > 80 ? `${str.slice(0, 77)}…` : str}</span>
}

export default async function ToolRunnerPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user, locale] = await Promise.all([
    params,
    requireUser(),
    getLocale(),
  ])

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
  ])

  if (!workspace) notFound()
  if (!instance) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">Schema de herramienta inválido.</p>
      </div>
    )
  }

  const schema = schemaResult.data
  const dataSchema: DataSchema = schema.dataSchema

  const tableCap = schema.capabilities.find((c) => c.type === 'TABLE')
  const tableConfig = tableCap?.config as TableConfig | undefined

  const columns: Array<{ fieldId: string; label: string }> =
    tableConfig?.columns.map((c) => ({
      fieldId: c.fieldId,
      label: c.label ?? dataSchema.fields[c.fieldId]?.label ?? c.fieldId,
    })) ??
    Object.entries(dataSchema.fields)
      .slice(0, 4)
      .map(([fieldId, field]) => ({ fieldId, label: field.label }))

  const records = await db.toolRecord.findMany({
    where: { toolInstanceId: instanceId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
  })

  const tabs = buildCapabilityTabs(schema, workspaceId, instanceId)
  const formCap = schema.capabilities.find((c) => c.type === 'FORM')
  const hasFormCap = Boolean(formCap)
  const createLabel = formCap?.label ?? 'Nueva entrada'
  const isSocialMedia = instance.toolDefinition.slug === 'social-media-manager'
  const aiLabel = isSocialMedia ? 'Ideas con IA' : undefined
  const firstNonTableTab = tabs.find((t) => t.type !== 'TABLE')

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href={`/workspace/${workspaceId}/tools`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 block">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Herramientas
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{instance.name}</h1>
          <p className="text-xs text-muted-foreground truncate">{instance.toolDefinition.name}</p>
        </div>
        {hasFormCap && (
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/import`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Importar CSV
            </Link>
            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/records/new`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              + {createLabel}
            </Link>
          </div>
        )}
      </div>

      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} aiLabel={aiLabel} />
      <CapabilityNav tabs={tabs} active="TABLE" />

        {records.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center bg-card">
            <p className="text-muted-foreground text-sm mb-4">Aún no hay registros en esta herramienta.</p>
            {hasFormCap ? (
              <Link
                href={`/workspace/${workspaceId}/tools/${instanceId}/records/new`}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                {createLabel}
              </Link>
            ) : firstNonTableTab ? (
              <Link
                href={firstNonTableTab.href}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                {firstNonTableTab.label}
              </Link>
            ) : null}
          </div>
        ) : isSocialMedia ? (
          <SocialMediaPostsView
            records={records.map((r) => {
              const d = (r.data ?? {}) as Record<string, unknown>
              return {
                id: r.id,
                titulo: String(d.titulo ?? ''),
                cliente_o_marca: d.cliente_o_marca ? String(d.cliente_o_marca) : undefined,
                plataforma: d.plataforma ? String(d.plataforma) : undefined,
                formato: d.formato ? String(d.formato) : undefined,
                estado: d.estado ? String(d.estado) : undefined,
                fecha_prevista: d.fecha_prevista ? String(d.fecha_prevista) : undefined,
                copy: d.copy ? String(d.copy) : undefined,
                revision: d.revision ? String(d.revision) : undefined,
                createdAt: r.createdAt,
              }
            })}
            workspaceId={workspaceId}
            instanceId={instanceId}
            locale={locale}
          />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10 whitespace-nowrap border-b">#</th>
                    {columns.map((col) => (
                      <th
                        key={col.fieldId}
                        className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap border-b min-w-[120px]"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap border-b min-w-[90px]">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap border-b min-w-[130px]">Fecha</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap border-b min-w-[100px]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => {
                    const data = (record.data ?? {}) as Record<string, unknown>
                    const isChecklist = data._type === 'checklist'
                    const isScoring = data._type === 'scoring'
                    const isEven = idx % 2 === 0

                    let typeBadge: React.ReactNode = (
                      <span className="text-xs text-muted-foreground">Formulario</span>
                    )
                    if (isChecklist) {
                      const items = (data._items ?? {}) as Record<string, boolean>
                      const total = Object.keys(items).length
                      const done = Object.values(items).filter(Boolean).length
                      const allDone = done === total && total > 0
                      typeBadge = (
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium font-mono',
                          allDone
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                        )}>
                          ✓ {done}/{total}
                        </span>
                      )
                    } else if (isScoring) {
                      const total = typeof data._total === 'number' ? data._total : 0
                      const v = scoreVariant(total)
                      const cls: Record<string, string> = {
                        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                        blue:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                        danger:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                      }
                      typeBadge = (
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-mono',
                          cls[v],
                        )}>
                          ★ {total.toFixed(1)}
                        </span>
                      )
                    }

                    return (
                      <tr
                        key={record.id}
                        className={cn(
                          'hover:bg-primary/5 transition-colors border-b last:border-0',
                          isEven ? 'bg-background' : 'bg-muted/20',
                        )}
                      >
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {records.length - idx}
                        </td>
                        {columns.map((col) => (
                          <td key={col.fieldId} className="px-4 py-3 max-w-[220px]">
                            <SmartCell
                              value={data[col.fieldId]}
                              fieldType={dataSchema.fields[col.fieldId]?.type ?? 'string'}
                              locale={locale}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 whitespace-nowrap">{typeBadge}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="text-xs text-muted-foreground"
                            title={formatDate(record.createdAt, locale)}
                          >
                            {formatRelativeDate(record.createdAt, locale)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/workspace/${workspaceId}/tools/${instanceId}/records/${record.id}`}
                              className="text-xs text-primary hover:underline whitespace-nowrap"
                            >
                              Ver
                            </Link>
                            <DeleteButton instanceId={instanceId} recordId={record.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
              {records.length} {records.length === 1 ? 'registro' : 'registros'}
            </div>
          </div>
        )}
    </div>
  )
}



