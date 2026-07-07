#!/usr/bin/env node
/**
 * set-user-plan.mjs
 *
 * Assigns a trialPlan to a user identified by email.
 * Runs in dry-run mode by default — pass --apply to persist.
 *
 * Usage:
 *   node scripts/set-user-plan.mjs --email=user@example.com --plan=internal_dev
 *   node scripts/set-user-plan.mjs --email=user@example.com --plan=internal_dev --apply
 */

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local')
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  console.error('❌  No se encontró .env.local — ejecuta desde apps/web o la raíz del monorepo')
  process.exit(1)
}

// ── Valid plans ──────────────────────────────────────────────────────────────
const VALID_PLANS = ['trial_personal', 'trial_business', 'blocked', 'internal_dev']

const PLAN_LABELS = {
  trial_personal: 'Beta Personal',
  trial_business: 'Beta Empresarial',
  blocked:        'Bloqueado',
  internal_dev:   'Dev Interno',
}

// ── Parse args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=')
      return [k, v.join('=') || true]
    })
)

const email = args['email']
const plan  = args['plan']
const apply = args['apply'] === true

if (!email || !plan) {
  console.error('Uso: node scripts/set-user-plan.mjs --email=<email> --plan=<plan> [--apply]')
  console.error('Planes válidos:', VALID_PLANS.join(', '))
  process.exit(1)
}

if (!VALID_PLANS.includes(plan)) {
  console.error(`❌  Plan inválido: "${plan}"`)
  console.error('Planes válidos:', VALID_PLANS.join(', '))
  process.exit(1)
}

// ── Mask email for logging ───────────────────────────────────────────────────
function maskEmail(e) {
  const at = e.indexOf('@')
  if (at <= 1) return '***@***'
  const local = e.slice(0, at)
  const domain = e.slice(at + 1)
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(0, local.length - 2))}@${domain}`
}

// ── Load Prisma client ───────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, trialPlan: true },
  })

  if (!user) {
    console.error(`❌  Usuario no encontrado: ${maskEmail(email)}`)
    await db.$disconnect()
    process.exit(1)
  }

  const maskedEmail = maskEmail(user.email)
  const prevLabel   = PLAN_LABELS[user.trialPlan] ?? user.trialPlan
  const nextLabel   = PLAN_LABELS[plan]

  console.log()
  console.log('  Usuario :', maskedEmail)
  console.log('  Plan actual :', `${user.trialPlan} (${prevLabel})`)
  console.log('  Plan nuevo  :', `${plan} (${nextLabel})`)
  console.log()

  if (user.trialPlan === plan) {
    console.log('  ℹ️  El usuario ya tiene ese plan. Sin cambios.')
    await db.$disconnect()
    return
  }

  if (!apply) {
    console.log('  🔍  DRY-RUN — sin cambios. Añade --apply para aplicar.')
    console.log()
    await db.$disconnect()
    return
  }

  await db.user.update({
    where: { email },
    data: { trialPlan: plan },
  })

  console.log(`  ✅  Plan actualizado: ${user.trialPlan} → ${plan}`)
  console.log()
  await db.$disconnect()
}

main().catch(err => {
  console.error('❌  Error:', err.message)
  db.$disconnect().catch(() => {})
  process.exit(1)
})
