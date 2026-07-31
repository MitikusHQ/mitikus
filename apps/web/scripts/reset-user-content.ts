/**
 * reset-user-content.ts
 *
 * Borra todo el contenido del workspace del usuario indicado
 * pero mantiene: User, Organization, Subscription, OrgMember, BillingEvent.
 *
 * Uso:
 *   npx tsx scripts/reset-user-content.ts borjaprietomark82@gmail.com
 *
 * El usuario quedará en estado "post-registro, pre-onboarding":
 * al entrar a mitikus.com se le redirigirá al onboarding para crear workspace.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Uso: npx tsx scripts/reset-user-content.ts <email>')
    process.exit(1)
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      org: {
        include: {
          workspaces: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!user) {
    console.error(`No se encontró usuario con email: ${email}`)
    process.exit(1)
  }

  console.log(`\nUsuario encontrado: ${user.name} (${user.email})`)
  console.log(`Organización: ${user.org?.name ?? '—'}`)
  console.log(`Workspaces:`)
  user.org?.workspaces.forEach((w) => console.log(`  - ${w.name} [${w.id}]`))

  if (!user.org || user.org.workspaces.length === 0) {
    console.log('\nNo hay workspaces que borrar. El usuario ya está limpio.')
    return
  }

  console.log('\n⚠️  Esto borrará TODO el contenido de los workspaces (cascade).')
  console.log('Se conservarán: User, Organization, Subscription, OrgMember.\n')

  // Borrar workspaces — el cascade de Prisma elimina todo lo asociado
  const deleted = await db.workspace.deleteMany({
    where: { orgId: user.org.id },
  })

  console.log(`✓ ${deleted.count} workspace(s) eliminado(s) con todo su contenido.`)
  console.log('\nEl usuario puede entrar ahora a mitikus.com — verá el onboarding para crear un workspace nuevo.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
