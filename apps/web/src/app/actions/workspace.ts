'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export type WorkspaceActionState = { error: string } | null

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
    select: { id: true, orgId: true },
  })
  if (!user) redirect('/onboarding')

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
