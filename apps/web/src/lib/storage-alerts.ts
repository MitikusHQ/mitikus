import { db } from '@/lib/db'
import { getEntitlements } from '@/lib/billing/entitlements'
import { sendStorageAlertEmail } from '@/lib/email'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function olderThan7Days(date: Date | null): boolean {
  if (!date) return true
  return Date.now() - date.getTime() > SEVEN_DAYS_MS
}

export async function checkStorageAlerts(workspaceId: string, orgId: string): Promise<void> {
  const [workspace, agg, entitlements] = await Promise.all([
    db.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        storageAlert80SentAt: true,
        storageAlert100SentAt: true,
        org: {
          select: {
            users: {
              where: { role: 'OWNER' },
              select: { email: true },
              take: 1,
            },
          },
        },
      },
    }),
    db.workspaceFile.aggregate({
      where: { workspaceId },
      _sum: { size: true },
    }),
    getEntitlements(orgId),
  ])

  if (!workspace) return

  const limitGB = entitlements.limits.maxStorageGB
  if (limitGB >= Number.MAX_SAFE_INTEGER) return // unlimited plan — no alerts

  const ownerEmail = workspace.org.users[0]?.email
  if (!ownerEmail) return

  const totalBytes = agg._sum.size ?? 0
  const usedGB = totalBytes / (1024 * 1024 * 1024)
  const pct = (usedGB / limitGB) * 100

  const filesUrl = `https://mitikus.com/workspace/${workspaceId}/office/files`

  if (pct >= 100 && olderThan7Days(workspace.storageAlert100SentAt)) {
    await Promise.all([
      sendStorageAlertEmail({ to: ownerEmail, workspaceName: workspace.name, usedGB, limitGB, level: 100, filesUrl }),
      db.workspace.update({ where: { id: workspaceId }, data: { storageAlert100SentAt: new Date() } }),
    ])
  } else if (pct >= 80 && pct < 100 && olderThan7Days(workspace.storageAlert80SentAt)) {
    await Promise.all([
      sendStorageAlertEmail({ to: ownerEmail, workspaceName: workspace.name, usedGB, limitGB, level: 80, filesUrl }),
      db.workspace.update({ where: { id: workspaceId }, data: { storageAlert80SentAt: new Date() } }),
    ])
  }
}
