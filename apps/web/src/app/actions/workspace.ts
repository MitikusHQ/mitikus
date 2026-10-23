'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { deleteAvailabilityData } from '@/app/actions/availability'
import { checkEntitlement } from '@/lib/billing/entitlements'
import { can } from '@/lib/permissions'
import { trackWorkspaceCreated } from '@/lib/pmf-analytics'

export type WorkspaceActionState = { error: string } | null

async function requireWorkspace(workspaceId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado')
  return { user, workspace }
}

export async function deleteWorkspace(workspaceId: string): Promise<{ error: string } | null> {
  try {
    const { user } = await requireWorkspace(workspaceId)
    if (!can(user, 'delete_workspace')) {
      return { error: 'Solo el propietario puede eliminar el workspace.' }
    }

    const hosts = await db.availabilitySettings.findMany({
      where: { workspaceId },
      select: { userId: true },
    })
    // This helper commits separately; its cleanup cannot be rolled back below.
    for (const host of hosts) {
      await deleteAvailabilityData(workspaceId, host.userId)
    }

    await db.$transaction(async (tx) => {
      // Permanent workspace deletion also removes historical bookings retained
      // by deleteAvailabilityData. These three relations use RESTRICT.
      await tx.bookingRequest.deleteMany({
        where: { bookingPage: { availability: { workspaceId } } },
      })
      await tx.bookingPage.deleteMany({ where: { availability: { workspaceId } } })
      await tx.availabilitySettings.deleteMany({ where: { workspaceId } })

      // These workspace identifiers have no FK to Workspace.
      await tx.aIUsage.deleteMany({ where: { workspaceId } })
      await tx.registrySearch.deleteMany({ where: { workspaceId } })
      await tx.auditLog.deleteMany({ where: { workspaceId } })
      await tx.productEvent.deleteMany({ where: { workspaceId } })
      await tx.businessMemoryLog.deleteMany({ where: { workspaceId } })
      const rooms = await tx.guestRoom.findMany({
        where: { workspaceId }, select: { token: true },
      })
      await tx.guestEvent.deleteMany({ where: { token: { in: rooms.map((room) => room.token) } } })

      // Break the folder tree's NO ACTION self-reference before cascading.
      await tx.folder.updateMany({ where: { workspaceId }, data: { parentId: null } })
      // All remaining Workspace FKs use CASCADE, including dependent children.
      await tx.workspace.delete({ where: { id: workspaceId } })
    })
  } catch {
    return { error: 'No se ha podido eliminar el workspace. Inténtalo de nuevo.' }
  }

  revalidatePath('/')
  return null
}

export type WorkspaceWithProfileState =
  | { error: string; workspaceId?: never }
  | { workspaceId: string; error?: never }
  | null

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createWorkspace(
  _prev: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const name = formData.get('name')?.toString().trim() ?? ''
  if (!name) {
    return { error: 'El nombre del workspace es obligatorio.' }
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true },
  })
  if (!user) redirect('/onboarding')
  if (!can(user, 'create_workspace')) return { error: 'Solo los administradores pueden crear workspaces.' }

  const currentWs = await db.workspace.count({ where: { orgId: user.orgId } })
  const limitCheck = await checkEntitlement(user.orgId, 'maxWorkspaces', currentWs)
  if (!limitCheck.allowed) return { error: limitCheck.reason ?? 'Has alcanzado el límite de workspaces de tu plan.' }

  const baseSlug = toSlug(name)
  if (!baseSlug) {
    return { error: 'El nombre debe contener caracteres válidos (letras o números).' }
  }

  // Garantizar slug único dentro de la organización
  let slug = baseSlug
  let counter = 1
  while (await db.workspace.findFirst({ where: { orgId: user.orgId, slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const workspace = await db.workspace.create({
    data: { name, slug, orgId: user.orgId },
  })

  redirect(`/workspace/${workspace.id}`)
}

export async function createWorkspaceWithProfile(
  _prev: WorkspaceWithProfileState,
  formData: FormData,
): Promise<WorkspaceWithProfileState> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const name = formData.get('name')?.toString().trim() ?? ''
  if (!name) return { error: 'El nombre del workspace es obligatorio.' }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true },
  })
  if (!user) redirect('/onboarding')
  if (!can(user, 'create_workspace')) return { error: 'Solo los administradores pueden crear workspaces.' }

  const currentWs2 = await db.workspace.count({ where: { orgId: user.orgId } })
  const limitCheck = await checkEntitlement(user.orgId, 'maxWorkspaces', currentWs2)
  if (!limitCheck.allowed) return { error: limitCheck.reason ?? 'Has alcanzado el límite de workspaces de tu plan.' }

  const baseSlug = toSlug(name)
  if (!baseSlug) return { error: 'El nombre debe contener caracteres válidos (letras o números).' }

  let slug = baseSlug
  let counter = 1
  while (await db.workspace.findFirst({ where: { orgId: user.orgId, slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const sector = formData.get('sector')?.toString().trim() ?? ''
  const size = formData.get('size')?.toString().trim() || 'unknown'
  const customerType = formData.get('customerType')?.toString().trim() ?? ''
  const country   = formData.get('country')?.toString().trim() || null
  const legalForm = formData.get('legalForm')?.toString().trim() || null

  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      orgId: user.orgId,
      companyProfile: {
        create: {
          companyName: name,
          sector: sector || null,
          size,
          customers: customerType ? [customerType] : [],
          country:   country || null,
          legalForm: legalForm || null,
          confidence: sector ? 0.3 : 0.1,
          lastUpdatedBy: user.id,
        },
      },
    },
    select: { id: true },
  })

  trackWorkspaceCreated({ orgId: user.orgId, workspaceId: workspace.id, userId: user.id, sector: sector || null })

  return { workspaceId: workspace.id }
}
