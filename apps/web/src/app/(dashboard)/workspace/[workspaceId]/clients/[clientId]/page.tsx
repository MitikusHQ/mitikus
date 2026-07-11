import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCostEUR } from '@/lib/ai-cost'
import { ExecutionStatusBadge } from '../../tools/[instanceId]/_components/ExecutionStatusBadge'

interface Props {
  params: Promise<{ workspaceId: string; clientId: string }>
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export default async function ClientDossierPage({ params }: Props) {
  const [{ workspaceId, clientId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const client = await db.client.findFirst({
    where: { id: clientId, workspaceId },
  })
  if (!client) notFound()

  // Herramientas vinculadas a este cliente
  const instances = await db.toolInstance.findMany({
    where: { clientId, workspaceId, status: 'ACTIVE' },
    include: {
      toolDefinition: { select: { name: true, category: true } },
      toolExecutions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, createdAt: true, estimatedCostEUR: true },
      },
      _count: { select: { toolExecutions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Últimas 30 ejecuciones de herramientas de este cliente
  const recentExecutions = await db.toolExecution.findMany({
    where: {
      workspaceId,
      toolInstance: { clientId },
    },
    include: {
      user: { select: { name: true } },
      toolInstance: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const totalCost = recentExecutions.reduce((s, e) => s + e.estimatedCostEUR, 0)
  const completedCount = recentExecutions.filter((e) => e.status === 'COMPLETED').length

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href={`/workspace/${workspaceId}/clients`} className="hover:text-foreground transition-colors">
              Clientes
            </Link>
            <span>/</span>
            <span>{client.name}</span>
          </div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {client.email && <span>{client.email}</span>}
            {client.sector && <span>· {client.sector}</span>}
            <span>· Cliente desde {formatDateShort(client.createdAt)}</span>
          </div>
          {client.notes && (
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">{client.notes}</p>
          )}
        </div>
        <Link
          href={`/workspace/${workspaceId}/clients/${clientId}/edit`}
          className="shrink-0 text-xs border border-input rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
        >
          Editar
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Herramientas</p>
          <p className="text-2xl font-bold">{instances.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Ejecuciones</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Coste IA</p>
          <p className="text-2xl font-bold">{formatCostEUR(totalCost)}</p>
        </div>
      </div>

      {/* Herramientas del cliente */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Herramientas</h2>
          <Link
            href={`/workspace/${workspaceId}/tools`}
            className="text-xs text-primary hover:underline"
          >
            + Vincular herramienta
          </Link>
        </div>

        {instances.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No hay herramientas vinculadas a este cliente.
            </p>
            <Link
              href={`/workspace/${workspaceId}/tools`}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Ir a Herramientas
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border divide-y">
            {instances.map((inst) => {
              const lastExec = inst.toolExecutions[0]
              return (
                <div key={inst.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{inst.name}</p>
                    <p className="text-xs text-muted-foreground">{inst.toolDefinition.name}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                    <span>{inst._count.toolExecutions} ejecuciones</span>
                    {lastExec && (
                      <span>Última: {formatDateShort(lastExec.createdAt)}</span>
                    )}
                    <Link
                      href={`/workspace/${workspaceId}/tools/${inst.id}/run`}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      ✨ Ejecutar
                    </Link>
                    <Link
                      href={`/workspace/${workspaceId}/tools/${inst.id}/history`}
                      className="text-primary hover:underline"
                    >
                      Historial
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Últimas ejecuciones */}
      {recentExecutions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-4">Últimas ejecuciones</h2>
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Herramienta</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Coste</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Usuario</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground border-b">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExecutions.map((exec, idx) => (
                    <tr
                      key={exec.id}
                      className={cn(
                        'hover:bg-primary/5 transition-colors border-b last:border-0',
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(exec.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {exec.toolInstance.name}
                      </td>
                      <td className="px-4 py-3">
                        <ExecutionStatusBadge status={exec.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {exec.estimatedCostEUR > 0 ? formatCostEUR(exec.estimatedCostEUR) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {exec.user.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {exec.status === 'COMPLETED' && (
                          <Link
                            href={`/workspace/${workspaceId}/tools/${exec.toolInstance.id}/history/${exec.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Ver
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
