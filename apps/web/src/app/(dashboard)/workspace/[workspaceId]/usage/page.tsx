import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCostEUR } from '@/lib/ai-cost'
import {
  getUserUsageToday,
  getWorkspaceUsageToday,
  getGlobalUsageToday,
  getGlobalCostToday,
  getUserMonthlyAIUsage,
} from '@/lib/ai-rate-limit'
import { getRecentErrors } from '@/app/actions/ai-admin'
import { AdminPanel } from './_components/AdminPanel'
import { getPlanLimits, startOfMonthUTC } from '@/lib/plan-limits'
import { trialPlanLabel, emailTypeLabel } from '@/lib/email-classification'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key]
  if (!v) return fallback
  const n = parseInt(v, 10)
  return isNaN(n) || n <= 0 ? fallback : n
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key]
  if (!v) return fallback
  const n = parseFloat(v)
  return isNaN(n) || n <= 0 ? fallback : n
}

function startOfTodayUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

interface BarProps {
  label: string
  current: number
  limit: number
  format?: (n: number) => string
}

function UsageBar({ label, current, limit, format }: BarProps) {
  const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0
  const fmt = format ?? ((n: number) => String(Math.round(n)))
  const isWarning = pct >= 80
  const isDanger = pct >= 95

  const barColor = isDanger
    ? 'bg-destructive'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-primary'

  const blocks = 10
  const filledBlocks = Math.round((pct / 100) * blocks)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-mono text-xs ${isDanger ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
          {fmt(current)} / {fmt(limit)}
          {pct >= 80 && (
            <span className="ml-2 text-xs">({pct}%)</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {/* ASCII-style progress bar */}
        <span className="font-mono text-xs tracking-tighter text-foreground/70">
          {'█'.repeat(filledBlocks)}{'░'.repeat(blocks - filledBlocks)}
        </span>
        {/* Barra visual */}
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden ml-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default async function UsagePage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  const isAdmin = can(user, 'view_admin_panel')

  // Límites configurados (o defaults)
  const limitUser = envInt('MAX_AI_GENERATIONS_PER_USER_DAY', 10)
  const limitWorkspace = envInt('MAX_AI_GENERATIONS_PER_WORKSPACE_DAY', 20)
  const limitGlobal = envInt('MAX_AI_GENERATIONS_GLOBAL_DAY', 50)
  const limitCostEUR = envFloat('MAX_AI_ESTIMATED_COST_DAY_EUR', 2.0)

  // Plan del usuario
  const planLimits = getPlanLimits(user.trialPlan)

  // Estadísticas en paralelo
  const today = startOfTodayUTC()
  const [
    todayStats,
    userUsage,
    userMonthlyUsage,
    workspaceUsage,
    globalUsage,
    globalCostEUR,
    installedToolsCount,
    recentErrors,
    totalSearches,
    toolsReused,
    toolsGenerated,
  ] = await Promise.all([
    db.aIUsage.aggregate({
      where: {
        orgId: user.orgId,
        status: { not: 'rate_limited' },
        createdAt: { gte: today },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedCostEUR: true,
      },
      _count: true,
    }),
    getUserUsageToday(user.id),
    getUserMonthlyAIUsage(user.id),
    getWorkspaceUsageToday(workspaceId),
    getGlobalUsageToday(),
    getGlobalCostToday(),
    db.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } }),
    isAdmin ? getRecentErrors(user.orgId) : Promise.resolve([]),
    db.registrySearch.count({ where: { orgId: user.orgId } }),
    db.registrySearch.count({ where: { orgId: user.orgId, action: { in: ['install', 'fork'] } } }),
    db.registrySearch.count({ where: { orgId: user.orgId, action: 'generate' } }),
  ])

  const inputTokens = todayStats._sum.inputTokens ?? 0
  const outputTokens = todayStats._sum.outputTokens ?? 0
  const totalTokens = todayStats._sum.totalTokens ?? 0
  const costEURToday = todayStats._sum.estimatedCostEUR ?? 0
  const generationsToday = todayStats._count

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-xl font-semibold">Créditos</h1>

        {/* Tipo de cuenta y plan */}
        <section>
          <div className={`rounded-lg border px-5 py-4 flex items-start justify-between gap-4 ${
            user.trialPlan === 'blocked'
              ? 'bg-red-50 border-red-200'
              : user.trialPlan === 'trial_business'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-muted/40'
          }`}>
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {trialPlanLabel(user.trialPlan as 'trial_personal' | 'trial_business' | 'blocked')}
                {' · '}
                <span className="font-normal text-muted-foreground">
                  {emailTypeLabel(user.emailType as 'personal' | 'business' | 'disposable' | 'unknown')}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            {user.trialPlan === 'blocked' && (
              <span className="shrink-0 text-xs text-red-700 bg-red-100 px-2 py-1 rounded font-medium">
                Bloqueado
              </span>
            )}
            {user.trialPlan === 'trial_business' && (
              <span className="shrink-0 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded font-medium">
                Empresarial
              </span>
            )}
          </div>
        </section>

        {/* Límites del plan */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Límites de tu plan</h2>
          <div className="rounded-lg border bg-card p-5 space-y-5">
            <UsageBar
              label="Ejecuciones hoy"
              current={userUsage}
              limit={planLimits.aiGenerationsPerDay}
            />
            <UsageBar
              label="Ejecuciones este mes"
              current={userMonthlyUsage}
              limit={planLimits.aiGenerationsPerMonth}
            />
            <UsageBar
              label="Herramientas instaladas"
              current={installedToolsCount}
              limit={planLimits.maxToolsInstalled}
            />
          </div>
        </section>

        {/* AI Saved — Registry Intelligence metrics */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Reutilización</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Búsquedas en catálogo" value={String(totalSearches)} />
            <StatCard label="Herramientas reutilizadas" value={String(toolsReused)} />
            <StatCard label="Generaciones" value={String(toolsGenerated)} />
          </div>
          {totalSearches > 0 && (
            <div className="rounded-lg border bg-card px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasa de reutilización</span>
                <span className="font-semibold font-mono">
                  {totalSearches > 0
                    ? `${Math.round((toolsReused / totalSearches) * 100)}%`
                    : '—'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {toolsReused} de {totalSearches} búsquedas resultaron en instalación o fork
                en lugar de generar una nueva.
              </p>
            </div>
          )}
        </section>

        {/* Estadísticas de hoy */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Hoy</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Generaciones" value={String(generationsToday)} />
            <StatCard label="Tokens entrada" value={inputTokens.toLocaleString('es-ES')} />
            <StatCard label="Tokens salida" value={outputTokens.toLocaleString('es-ES')} />
            <StatCard label="Tokens totales" value={totalTokens.toLocaleString('es-ES')} />
            <StatCard
              label="Coste estimado (org)"
              value={formatCostEUR(costEURToday)}
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Límites */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Límites diarios</h2>
          <div className="rounded-lg border bg-card p-5 space-y-5">
            <UsageBar
              label="Usuario (tú)"
              current={userUsage}
              limit={limitUser}
            />
            <UsageBar
              label="Workspace"
              current={workspaceUsage}
              limit={limitWorkspace}
            />
            <UsageBar
              label="Sistema (global)"
              current={globalUsage}
              limit={limitGlobal}
            />
            <UsageBar
              label="Coste estimado (global)"
              current={globalCostEUR}
              limit={limitCostEUR}
              format={(n) => formatCostEUR(n)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Los límites se reinician automáticamente a las 00:00 UTC.
            Para cambiarlos permanentemente, edita las variables de entorno en .env.local.
          </p>
        </section>

        {/* Generaciones restantes hoy */}
        <section className="rounded-lg border bg-muted/40 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Puedes generar{' '}
            <span className="font-semibold text-foreground">
              {Math.max(0, limitUser - userUsage)}
            </span>{' '}
            herramientas más hoy (límite personal) y{' '}
            <span className="font-semibold text-foreground">
              {Math.max(0, limitWorkspace - workspaceUsage)}
            </span>{' '}
            en este workspace.
          </p>
        </section>

        {/* Panel administrador */}
        {isAdmin && (
          <AdminPanel recentErrors={recentErrors} />
        )}
    </div>
  )
}

function StatCard({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1 font-mono">{value}</p>
    </div>
  )
}
