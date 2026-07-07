import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'
import { OrgShell } from './_components/OrgShell'

interface Props {
  children: React.ReactNode
}

export default async function OrgLayout({ children }: Props) {
  const user = await requireUser()

  const firstWorkspace = await db.workspace.findFirst({
    where: { orgId: user.orgId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  const workspaceId = firstWorkspace?.id

  if (!can(user, 'view_usage')) {
    redirect(workspaceId ? `/workspace/${workspaceId}` : '/')
  }

  return (
    <OrgShell
      orgName={user.org.name}
      canManageMembers={can(user, 'manage_members')}
      canViewAdmin={can(user, 'view_admin_panel')}
      workspaceId={workspaceId}
    >
      {children}
    </OrgShell>
  )
}
