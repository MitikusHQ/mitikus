#!/usr/bin/env node
/**
 * Reclasifica emailType y trialPlan de todos los usuarios según su email real.
 *
 * Uso:
 *   node scripts/reclassify-users.mjs           → dry-run (solo muestra, no modifica)
 *   node scripts/reclassify-users.mjs --apply   → aplica cambios en DB
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IS_DRY_RUN = !process.argv.includes('--apply')

// ── Carga DATABASE_URL desde .env.local ───────────────────────────────────────
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const eqIndex = trimmed.indexOf('=')
      const key = trimmed.slice(0, eqIndex).trim()
      const raw = trimmed.slice(eqIndex + 1).trim()
      const value = raw.replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local no existe — confiar en el entorno actual
  }
}

// ── Lógica de clasificación (espejo de email-classification.ts) ───────────────
// Mantenida sincronizada manualmente con src/lib/email-classification.ts

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'hotmail.co.uk',
  'outlook.com', 'outlook.es', 'live.com', 'live.es', 'msn.com',
  'yahoo.com', 'yahoo.es', 'yahoo.co.uk',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'tutanota.com', 'tutanota.de',
  'zoho.com', 'aol.com', 'mail.com',
  'gmx.com', 'gmx.de', 'gmx.es', 'web.de',
  'yandex.com', 'yandex.ru',
])

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org',
  '10minutemail.com', '10minutemail.net',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de',
  'yopmail.com', 'yopmail.fr',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'spam4.me', 'trashmail.com', 'trashmail.io', 'trashmail.me',
  'dispostable.com', 'throwaway.email', 'maildrop.cc',
  'fakeinbox.com', 'mailnull.com',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'trashmail.at', 'mailnesia.com', 'discard.email', 'crap.la',
  'getairmail.com', 'spamherelots.com', 'spamherelots.org',
  'example.com', 'example.org', 'example.net', 'test.com',
])

/**
 * @param {string} email
 * @returns {{ emailType: string, trialPlan: string, domain: string }}
 */
function classifyEmail(email) {
  const lower = email.toLowerCase().trim()
  const atIndex = lower.lastIndexOf('@')
  if (atIndex === -1) return { emailType: 'unknown', trialPlan: 'trial_personal', domain: '' }

  const domain = lower.slice(atIndex + 1)

  if (DISPOSABLE_DOMAINS.has(domain)) return { emailType: 'disposable', trialPlan: 'blocked', domain }
  if (PERSONAL_DOMAINS.has(domain)) return { emailType: 'personal', trialPlan: 'trial_personal', domain }

  const isInstitutional = ['edu', 'edu.es', 'ac.uk', 'gov', 'gov.es', 'gob.es'].some(
    (suffix) => domain.endsWith(suffix),
  )
  if (isInstitutional) return { emailType: 'business', trialPlan: 'trial_business', domain }

  return { emailType: 'business', trialPlan: 'trial_business', domain }
}

/**
 * b***@gmail.com
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
  const atIndex = email.lastIndexOf('@')
  if (atIndex <= 0) return '***'
  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex)
  return `${local[0]}***${domain}`
}

// ── Informe ────────────────────────────────────────────────────────────────────

/** @param {string} label @param {number} n */
function row(label, n) {
  console.log(`  ${label.padEnd(28)} ${String(n).padStart(5)}`)
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv()

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL no encontrada. Añádela a .env.local o al entorno.')
    process.exit(1)
  }

  const db = new PrismaClient()

  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, emailType: true, trialPlan: true },
    })

    const counts = { personal: 0, business: 0, disposable: 0, unknown: 0 }
    const changes = []

    for (const user of users) {
      const classification = classifyEmail(user.email)
      counts[classification.emailType] = (counts[classification.emailType] ?? 0) + 1

      const needsUpdate =
        user.emailType !== classification.emailType ||
        user.trialPlan !== classification.trialPlan

      if (needsUpdate) {
        changes.push({
          id: user.id,
          masked: maskEmail(user.email),
          before: { emailType: user.emailType, trialPlan: user.trialPlan },
          after: { emailType: classification.emailType, trialPlan: classification.trialPlan },
        })
      }
    }

    // ── Informe ────────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  ProTools Hub — Reclasificación de usuarios')
    console.log(`  Modo: ${IS_DRY_RUN ? 'DRY-RUN (sin cambios)' : 'APPLY (escribiendo en DB)'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n  Distribución de tipos:')
    row('Total usuarios', users.length)
    row('Personal (gmail, outlook…)', counts.personal)
    row('Business (corporativo)', counts.business)
    row('Disposable (bloqueado)', counts.disposable)
    row('Unknown', counts.unknown)

    console.log(`\n  Cambios detectados: ${changes.length}`)

    if (changes.length > 0) {
      console.log('')
      for (const c of changes) {
        console.log(
          `  ${c.masked.padEnd(30)}` +
          `${c.before.emailType}→${c.after.emailType}  ` +
          `${c.before.trialPlan}→${c.after.trialPlan}`,
        )
      }
    }

    if (IS_DRY_RUN) {
      console.log('\n  ℹ  Ejecuta con --apply para aplicar los cambios.')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      return
    }

    // ── Aplicar cambios ────────────────────────────────────────────────────────
    if (changes.length === 0) {
      console.log('\n  Todos los usuarios ya están correctamente clasificados.')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      return
    }

    console.log('\n  Aplicando cambios...')
    let applied = 0
    for (const c of changes) {
      await db.user.update({
        where: { id: c.id },
        data: { emailType: c.after.emailType, trialPlan: c.after.trialPlan },
      })
      applied++
      process.stdout.write(`\r  ${applied}/${changes.length} actualizados`)
    }

    console.log(`\n\n  Completado: ${applied} usuarios actualizados.`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error('\nERROR:', err.message)
  process.exit(1)
})
