'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { encryptSafe } from '@/lib/crypto'
import type { LegalForm, Country } from '@/lib/fiscal-calendar'

export async function setFiscalConfig(workspaceId: string, country: Country, legalForm?: LegalForm) {
  const user = await requireUser()

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
}

export async function updateEmailSettings(workspaceId: string, input: EmailSettingsInput) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  const emailReplyTo = input.emailReplyTo.trim()
  const emailSignature = input.emailSignature.trim()

  const smtpPasswordEncrypted = input.smtpPassword
    ? encryptSafe(input.smtpPassword)
    : undefined
  const imapPasswordEncrypted = input.imapPassword
    ? encryptSafe(input.imapPassword)
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
    smtpUser: input.smtpUser?.trim() || null,
    ...(smtpPasswordEncrypted !== undefined ? { smtpPasswordEncrypted } : {}),
    imapHost: input.imapHost?.trim() || null,
    imapPort: input.imapPort ?? null,
    imapSecure: input.imapSecure ?? false,
    imapUser: input.imapUser?.trim() || null,
    ...(imapPasswordEncrypted !== undefined ? { imapPasswordEncrypted } : {}),
  }

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, ...baseData },
    update: baseData,
  })
}
