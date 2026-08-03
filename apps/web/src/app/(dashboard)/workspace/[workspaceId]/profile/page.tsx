import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { UserProfileClient } from './_components/UserProfileClient'
import { WorkspaceBrandingClient } from './_components/WorkspaceBrandingClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) notFound()

  const base = `/workspace/${workspaceId}`

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10">
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </Link>

      <h1 className="text-xl font-semibold">Mi perfil</h1>

      <UserProfileClient base={base} workspaceId={workspaceId} userName={user.name} userEmail={user.email} userRole={user.role} />

      <hr className="border-border" />

      <WorkspaceBrandingClient
        workspaceId={workspaceId}
        logoUrl={workspace.logoUrl ?? null}
        brandColor={workspace.brandColor ?? null}
        workspaceName={workspace.name}
      />
    </div>
  )
}
