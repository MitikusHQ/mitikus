import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { roleAtLeast } from '@/lib/permissions'
import type { OrgRole } from '@prisma/client'

/**
 * Obtiene el usuario actual desde nuestra DB (no solo de Clerk).
 * Redirige a /sign-in si no hay sesión.
 * Redirige a /onboarding si el usuario no tiene organización.
 */
export async function requireUser() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      org: {
        include: {
          workspaces: { orderBy: { createdAt: 'asc' }, take: 1 },
        },
      },
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  return user
}

/**
 * Obtiene el usuario actual sin redirigir.
 * Útil para layouts donde el usuario puede o no estar autenticado.
 */
export async function getOptionalUser() {
  const { userId } = await auth()
  if (!userId) return null

  return db.user.findUnique({
    where: { clerkId: userId },
    include: { org: true },
  })
}

/**
 * Igual que requireUser pero además exige que el usuario tenga
 * al menos el rol indicado. Lanza error si no lo cumple.
 *
 * @example
 *   const user = await requireRole('ADMIN')
 */
export async function requireRole(minRole: OrgRole) {
  const user = await requireUser()
  if (!roleAtLeast(user.role, minRole)) {
    throw new Error(`Se requiere el rol ${minRole} o superior`)
  }
  return user
}
