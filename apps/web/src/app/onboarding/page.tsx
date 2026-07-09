import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { CreateWorkspaceForm } from './_components/CreateWorkspaceForm'
import { SignOutButton } from '@clerk/nextjs'

export default async function OnboardingPage() {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      org: {
        include: { workspaces: { orderBy: { createdAt: 'asc' }, take: 1 } },
      },
    },
  })

  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) redirect('/sign-in')

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email

    let org = orgId
      ? await db.organization.findFirst({
          where: { clerkOrgId: orgId },
          include: { workspaces: { take: 1 } },
        })
      : null

    if (!org) {
      org = await db.organization.create({
        data: {
          clerkOrgId: orgId ?? null,
          name: `Organización de ${name}`,
          plan: 'FREE',
        },
        include: { workspaces: { take: 1 } },
      })
    }

    user = await db.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        orgId: org.id,
        role: 'OWNER',
      },
      include: {
        org: {
          include: { workspaces: { orderBy: { createdAt: 'asc' }, take: 1 } },
        },
      },
    })
  }

  const firstWorkspace = user.org.workspaces[0]
  if (firstWorkspace) {
    redirect(`/workspace/${firstWorkspace.id}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-8 right-6">
        <SignOutButton>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
      <div className="text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-2">Bienvenido a MITIKUS</h1>
        <p className="text-muted-foreground mb-2">
          Crea tu primer workspace — el espacio de tu empresa donde vivirán tus misiones, herramientas y clientes.
        </p>
        <CreateWorkspaceForm />
      </div>
    </div>
  )
}
