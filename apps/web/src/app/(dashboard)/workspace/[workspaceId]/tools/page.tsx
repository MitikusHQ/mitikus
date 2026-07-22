import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ToolCategory } from '@prisma/client'
import { formatDate } from '@/lib/format-date'
import { getLocale } from '@/i18n/locale'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  AUDIT:      'Auditoría',
  EVALUATION: 'Evaluación',
  CHECKLIST:  'Checklist',
  CRM:        'CRM',
  REPORT:     'Informes',
  HR:         'RRHH',
  OPERATIONS: 'Operaciones',
  FINANCE:    'Finanzas',
  CUSTOM:     'Personalizado',
}

const CATEGORY_ICONS: Record<ToolCategory, string> = {
  AUDIT:      '🛡',
  EVALUATION: '⭐',
  CHECKLIST:  '✓',
  CRM:        '👥',
  REPORT:     '📄',
  HR:         '👤',
  OPERATIONS: '⚙',
  FINANCE:    '💰',
  CUSTOM:     '⬡',
}

// PRODUCT-001 — Beachhead ICP (consultoras IT, GTM-003): prioriza visualmente
// las categorías del caso de uso de auditoría sin ocultar ni borrar el resto.
const CATEGORY_PRIORITY: Record<ToolCategory, number> = {
  AUDIT:      0,
  CHECKLIST:  1,
  REPORT:     2,
  OPERATIONS: 3,
  EVALUATION: 4,
  CRM:        5,
  HR:         6,
  FINANCE:    7,
  CUSTOM:     8,
}

const CATEGORY_COLORS: Record<ToolCategory, string> = {
  AUDIT:      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  EVALUATION: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  CHECKLIST:  'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  CRM:        'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  REPORT:     'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  HR:         'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  OPERATIONS: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  FINANCE:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  CUSTOM:     'bg-muted text-muted-foreground',
}

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspaceToolsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([
    params,
    requireUser(),
    getLocale(),
  ])

  const [workspace, instances] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findMany({
      where: { workspaceId, status: 'ACTIVE' },
      include: {
        toolDefinition: { select: { name: true, category: true, slug: true, description: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!workspace) notFound()

  // Auditorías/Checklist/Informes/Procesos primero — sin ocultar el resto (PRODUCT-001)
  const sortedInstances = [...instances].sort((a, b) => {
    const diff = CATEGORY_PRIORITY[a.toolDefinition.category] - CATEGORY_PRIORITY[b.toolDefinition.category]
    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime()
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Herramientas instaladas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pequeñas apps para tareas concretas de tu negocio — auditorías, checklists, informes...</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}/generate`}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          >
            ✦ Generar
          </Link>
          <Link
            href={`/tools?workspaceId=${workspaceId}`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            + Añadir
          </Link>
        </div>
      </div>
      {/* Herramientas de Office */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Herramientas de Office
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href={`/workspace/${workspaceId}/docs`}
            className="flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <span className="text-2xl">📄</span>
            <p className="text-sm font-medium">Documentos</p>
            <p className="text-xs text-muted-foreground">Base de conocimiento</p>
            <span className="text-xs text-primary font-medium">BUILT-IN</span>
          </Link>
          <Link
            href={`/workspace/${workspaceId}/sheets`}
            className="flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <p className="text-sm font-medium">Hojas de cálculo</p>
            <p className="text-xs text-muted-foreground">Datos y presupuestos</p>
            <span className="text-xs text-primary font-medium">BUILT-IN</span>
          </Link>
          <Link
            href={`/workspace/${workspaceId}/pdfs`}
            className="flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <span className="text-2xl">📑</span>
            <p className="text-sm font-medium">PDFs</p>
            <p className="text-xs text-muted-foreground">Visor y conversión a Doc</p>
            <span className="text-xs text-primary font-medium">BUILT-IN</span>
          </Link>
        </div>
      </div>

      <div>
        {instances.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center bg-card">
            <p className="font-medium mb-1">Aún no tienes herramientas</p>
            <p className="text-muted-foreground text-sm mb-6">
              Genera una nueva describiendo tu proceso, o añade una ya hecha desde el catálogo.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href={`/workspace/${workspaceId}/generate`}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                ✦ Generar
              </Link>
              <Link
                href={`/tools?workspaceId=${workspaceId}`}
                className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedInstances.map((instance) => {
              const cat = instance.toolDefinition.category
              const desc = instance.toolDefinition.description
              return (
                <div
                  key={instance.id}
                  className="rounded-lg border bg-card p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0',
                      CATEGORY_COLORS[cat],
                    )}>
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {instance.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          CATEGORY_COLORS[cat],
                        )}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                        {instance.client && (
                          <span className="text-xs text-muted-foreground truncate">
                            · {instance.client.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                      Activa
                    </span>
                  </div>

                  {/* Description */}
                  {desc && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 mt-auto">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(instance.createdAt, locale)}
                    </span>
                    <Link
                      href={`/workspace/${workspaceId}/tools/${instance.id}`}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Abrir →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
