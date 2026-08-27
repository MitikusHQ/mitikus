'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { decryptSafe, encryptSafe } from '@/lib/crypto'
import { assertCan } from '@/lib/permissions'
import type { LegalForm, Country } from '@/lib/fiscal-calendar'
import { trackFiscalCompleted } from '@/lib/pmf-analytics'
import { testSmtpConfig } from '@/lib/mail/smtp-client'
import { testImapConfig } from '@/lib/mail/imap-client'

export async function setFiscalConfig(workspaceId: string, country: Country, legalForm?: LegalForm) {
  const user = await requireUser()
  assertCan(user, 'manage_fiscal_settings')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  await db.companyProfile.upsert({
    where:  { workspaceId },
    create: { workspaceId, country, legalForm: legalForm ?? null },
    update: { country, legalForm: legalForm ?? null },
  })
}

// Alias for backward compat with LegalFormPicker (ES only)
export async function setLegalForm(workspaceId: string, legalForm: LegalForm) {
  return setFiscalConfig(workspaceId, 'ES', legalForm)
}

export async function updateNif(workspaceId: string, nif: string) {
  const user = await requireUser()
  assertCan(user, 'manage_fiscal_settings')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  await db.companyProfile.upsert({
    where:  { workspaceId },
    create: { workspaceId, nif: nif.trim().toUpperCase() || null },
    update: { nif: nif.trim().toUpperCase() || null },
  })
}

export interface BillingProfileInput {
  fiscalName: string
  nif: string
  fiscalAddress: string
  fiscalPostalCode: string
  fiscalCity: string
  fiscalProvince: string
  fiscalCountry: string
  fiscalEmail: string
  fiscalPhone: string
  tradeRegistry: string
  iban: string
  defaultPaymentNotes: string
}

export interface EmailSettingsInput {
  emailSendMode: string
  emailSenderName: string
  emailReplyTo: string
  emailSignature: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string  // plain — se cifra antes de guardar
  imapHost?: string
  imapPort?: number
  imapSecure?: boolean
  imapUser?: string
  imapPassword?: string  // plain — se cifra antes de guardar
}

export async function updateBillingProfile(workspaceId: string, input: BillingProfileInput) {
  const user = await requireUser()
  assertCan(user, 'manage_fiscal_settings')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  const data = {
    fiscalName: input.fiscalName.trim() || null,
    nif: input.nif.trim().toUpperCase() || null,
    fiscalAddress: input.fiscalAddress.trim() || null,
    fiscalPostalCode: input.fiscalPostalCode.trim() || null,
    fiscalCity: input.fiscalCity.trim() || null,
    fiscalProvince: input.fiscalProvince.trim() || null,
    fiscalCountry: input.fiscalCountry.trim() || null,
    fiscalEmail: input.fiscalEmail.trim() || null,
    fiscalPhone: input.fiscalPhone.trim() || null,
    tradeRegistry: input.tradeRegistry.trim() || null,
    iban: input.iban.trim().toUpperCase() || null,
    defaultPaymentNotes: input.defaultPaymentNotes.trim() || null,
  }

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, ...data },
    update: data,
  })

  // Evento PMF: perfil fiscal completo (NIF + nombre fiscal presentes)
  if (data.fiscalName && data.nif) {
    trackFiscalCompleted({ orgId: user.orgId, workspaceId, userId: user.id })
  }
}

export async function updateEmailSettings(workspaceId: string, input: EmailSettingsInput) {
  const user = await requireUser()
  assertCan(user, 'manage_fiscal_settings')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  const emailReplyTo = input.emailReplyTo.trim()
  const emailSignature = input.emailSignature.trim()

  const smtpPasswordEncrypted = input.smtpPassword
    ? encryptSafe(input.smtpPassword)
    : undefined
  const smtpUser = input.smtpUser?.trim() || null
  const imapUser = input.imapUser?.trim() || smtpUser
  const sharedPassword = !input.imapPassword && input.smtpPassword && smtpUser && imapUser === smtpUser
  const imapPasswordEncrypted = input.imapPassword
    ? encryptSafe(input.imapPassword)
    : sharedPassword
      ? smtpPasswordEncrypted
      : undefined

  const baseData = {
    emailSendMode: input.emailSendMode || 'mitikus',
    emailSenderName: input.emailSenderName.trim() || null,
    emailReplyTo: emailReplyTo || null,
    emailSignature: emailSignature || null,
    fiscalEmail: emailReplyTo || null,
    smtpHost: input.smtpHost?.trim() || null,
    smtpPort: input.smtpPort ?? null,
    smtpSecure: input.smtpSecure ?? false,
    smtpUser,
    ...(smtpPasswordEncrypted !== undefined ? { smtpPasswordEncrypted } : {}),
    imapHost: input.imapHost?.trim() || null,
    imapPort: input.imapPort ?? null,
    imapSecure: input.imapSecure ?? false,
    imapUser,
    ...(imapPasswordEncrypted !== undefined ? { imapPasswordEncrypted } : {}),
  }

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, ...baseData },
    update: baseData,
  })
}

export async function testEmailSettings(workspaceId: string, input: EmailSettingsInput) {
  const user = await requireUser()
  assertCan(user, 'manage_fiscal_settings')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    include: {
      companyProfile: {
        select: { smtpPasswordEncrypted: true },
      },
    },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  if (!['custom_smtp', 'gmail', 'outlook'].includes(input.emailSendMode)) {
    throw new Error('El modo MITIKUS no necesita prueba SMTP propia.')
  }

  const smtpHost = input.smtpHost?.trim()
  const smtpPort = Number(input.smtpPort)
  const smtpUser = input.smtpUser?.trim()
  const imapHost = input.imapHost?.trim()
  const imapPort = Number(input.imapPort ?? 993)
  const imapUser = input.imapUser?.trim() || smtpUser
  const smtpPassword =
    input.smtpPassword ||
    decryptSafe(workspace.companyProfile?.smtpPasswordEncrypted)
  const imapPassword =
    input.imapPassword ||
    (imapUser && smtpUser && imapUser === smtpUser ? smtpPassword : null)

  if (!smtpHost) throw new Error('Falta el servidor SMTP.')
  if (!Number.isInteger(smtpPort) || smtpPort <= 0) throw new Error('El puerto SMTP no es válido.')
  if (!smtpUser) throw new Error('Falta el usuario o email SMTP.')
  if (!smtpPassword) throw new Error('Falta la contraseña SMTP.')

  await testSmtpConfig({
    host: smtpHost,
    port: smtpPort,
    secure: input.smtpSecure ?? false,
    user: smtpUser,
    pass: smtpPassword,
    fromEmail: smtpUser,
  })

  if (imapHost) {
    if (!Number.isInteger(imapPort) || imapPort <= 0) throw new Error('El puerto IMAP no es válido.')
    if (!imapUser) throw new Error('Falta el usuario IMAP.')
    if (!imapPassword) throw new Error('Falta la contraseña IMAP.')

    await testImapConfig({
      host: imapHost,
      port: imapPort,
      secure: input.imapSecure ?? true,
      user: imapUser,
      pass: imapPassword,
    })
  }

  return { ok: true as const }
}
