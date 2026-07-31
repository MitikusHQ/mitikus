import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { validateToolSchema } from '@protools/schema'
import type { ChecklistConfig, ScoringConfig, ValidatedToolSchema } from '@protools/schema'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string; recordId: string }>
}

function formatValue(value: unknown, fieldType: string): string {
  if (value === null || value === undefined) return '—'
  if (fieldType === 'boolean') return value ? 'Sí' : 'No'
  if (fieldType === 'date') {
    try {
      return new Date(String(value)).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export default async function RecordDetailPage({ params }: Props) {
  const [{ workspaceId, instanceId, recordId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance, record] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
    db.toolRecord.findFirst({
      where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
    }),
  ])

  if (!workspace || !instance || !record) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">Schema de herramienta inválido.</p>
      </div>
    )
  }

  const schema = schemaResult.data
  const data = (record.data ?? {}) as Record<string, unknown>
  const recordType = data._type as string | undefined

  const editHref =
    recordType === 'checklist'
      ? `/workspace/${workspaceId}/tools/${instanceId}/checklist/${recordId}/edit`
      : recordType === 'scoring'
      ? `/workspace/${workspaceId}/tools/${instanceId}/scoring/${recordId}/edit`
      : `/workspace/${workspaceId}/tools/${instanceId}/records/${recordId}/edit`

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <Link href={`/workspace/${workspaceId}/tools/${instanceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {instance.name}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Detalle del registro</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/api/pdf/${recordId}`}
            download
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Exportar PDF
          </a>
          <Link
            href={editHref}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
          Creado el{' '}
          {new Date(record.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {recordType === 'checklist' ? (
          <ChecklistDetailView schema={schema} data={data} />
        ) : recordType === 'scoring' ? (
          <ScoringDetailView schema={schema} data={data} />
        ) : (
          <FormDetailView schema={schema} data={data} />
        )}
    </div>
  )
}

function FormDetailView({
  schema,
  data,
}: {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
}) {
  const { fields } = schema.dataSchema
  return (
    <div className="rounded-lg border divide-y">
      {Object.entries(fields).map(([fieldId, field]) => (
        <div key={fieldId} className="px-5 py-3 grid grid-cols-[1fr_2fr] gap-4">
          <dt className="text-sm font-medium text-muted-foreground self-start pt-0.5">
            {field.label}
          </dt>
          <dd className="text-sm whitespace-pre-wrap break-words">
            {formatValue(data[fieldId], field.type)}
          </dd>
        </div>
      ))}
    </div>
  )
}

function ChecklistDetailView({
  schema,
  data,
}: {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
}) {
  const checklistCap = schema.capabilities.find((c) => c.type === 'CHECKLIST')
  if (!checklistCap) return null
  const config = checklistCap.config as ChecklistConfig
  const items = (data._items ?? {}) as Record<string, boolean>

  const totalItems = config.items.length
  const checkedCount = Object.values(items).filter(Boolean).length
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  const formFields = Object.entries(schema.dataSchema.fields)

  const orderedCategories: string[] = config.categories
    ? config.categories
    : [...new Set(config.items.map((i) => i.category).filter((c): c is string => !!c))]

  const grouped: Array<{ name: string; items: typeof config.items }> = []
  for (const cat of orderedCategories) {
    const catItems = config.items.filter((i) => i.category === cat)
    if (catItems.length > 0) grouped.push({ name: cat, items: catItems })
  }
  const uncategorized = config.items.filter((i) => !i.category)
  if (uncategorized.length > 0) grouped.push({ name: '', items: uncategorized })

  return (
    <div className="space-y-6">
      {formFields.length > 0 && (
        <div className="rounded-lg border divide-y">
          {formFields.map(([fieldId, field]) => (
            <div key={fieldId} className="px-5 py-3 grid grid-cols-[1fr_2fr] gap-4">
              <dt className="text-sm font-medium text-muted-foreground self-start pt-0.5">
                {field.label}
              </dt>
              <dd className="text-sm whitespace-pre-wrap break-words">
                {formatValue(data[fieldId], field.type)}
              </dd>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {checkedCount} de {totalItems} completados
          </span>
          <span className="font-semibold">{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.name || '__all__'} className="space-y-1.5">
          {group.name && (
            <h3 className="text-sm font-semibold border-b pb-1">{group.name}</h3>
          )}
          {group.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-1">
              <div
                className={`w-4 h-4 rounded shrink-0 border ${
                  items[item.id] ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}
              />
              <span
                className={`text-sm ${items[item.id] ? 'line-through text-muted-foreground' : ''}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ScoringDetailView({
  schema,
  data,
}: {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
}) {
  const scoringCap = schema.capabilities.find((c) => c.type === 'SCORING')
  if (!scoringCap) return null
  const config = scoringCap.config as ScoringConfig
  const scores = (data._scores ?? {}) as Record<string, number>
  const total = typeof data._total === 'number' ? data._total : 0

  const threshold = config.thresholds?.find((t) => total >= t.min && total <= t.max)
  const THRESHOLD_COLORS: Record<string, string> = {
    green: 'text-green-700 bg-green-50 border-green-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    red: 'text-red-700 bg-red-50 border-red-200',
  }

  const orderedCategories = [
    ...new Set(config.criteria.map((c) => c.category).filter((c): c is string => !!c)),
  ]
  const grouped: Array<{ name: string; criteria: typeof config.criteria }> = []
  for (const cat of orderedCategories) {
    const catCriteria = config.criteria.filter((c) => c.category === cat)
    if (catCriteria.length > 0) grouped.push({ name: cat, criteria: catCriteria })
  }
  const uncategorized = config.criteria.filter((c) => !c.category)
  if (uncategorized.length > 0) grouped.push({ name: '', criteria: uncategorized })

  return (
    <div className="space-y-6">
      <div
        className={`rounded-lg border p-5 text-center ${
          threshold ? (THRESHOLD_COLORS[threshold.color] ?? 'border-border') : 'border-border'
        }`}
      >
        <p className="text-sm text-muted-foreground mb-1">Puntuación total</p>
        <p className="text-4xl font-bold">{total.toFixed(2)}</p>
        {threshold && <p className="text-sm font-semibold mt-1">{threshold.label}</p>}
      </div>

      {grouped.map((group) => (
        <div key={group.name || '__all__'} className="space-y-1">
          {group.name && (
            <h3 className="text-sm font-semibold border-b pb-1">{group.name}</h3>
          )}
          <div className="rounded-lg border divide-y">
            {group.criteria.map((criterion) => {
              const score = scores[criterion.id] ?? '—'
              const max = criterion.max ?? 10
              return (
                <div
                  key={criterion.id}
                  className="px-4 py-2.5 flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">{criterion.label}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {score}/{max}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
