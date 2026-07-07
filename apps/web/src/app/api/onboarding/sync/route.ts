import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const { userId, orgId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Buscar usuario existente
  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      org: {
        include: { workspaces: { orderBy: { createdAt: 'asc' }, take: 1 } },
      },
    },
  })

  if (user) {
    return NextResponse.json({
      created: false,
      workspaceId: user.org.workspaces[0]?.id ?? null,
    })
  }

  // Crear usuario con datos de Clerk
  const clerkUser = await currentUser()
  if (!clerkUser) {
    return NextResponse.json({ error: 'Clerk user not found' }, { status: 401 })
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email

  // Buscar o crear organización
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
        name: `${name}'s Organization`,
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

  return NextResponse.json({
    created: true,
    workspaceId: user.org.workspaces[0]?.id ?? null,
  })
}
