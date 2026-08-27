/**
 * PMF Analytics — embudo de activación de MITIKUS.
 *
 * Registra eventos clave del funnel de activación usando AuditLog existente.
 * Todos los eventos son fire-and-forget; nunca bloquean ni lanzan.
 *
 * Privacidad: no se guardan NIF, IBAN, emails de clientes, ni direcciones fiscales.
 * Metadata limitada a IDs, tipos y flags booleanos.
 */

import { audit } from '@/lib/audit'

interface PmfBase {
  orgId: string
  workspaceId?: string
  userId?: string
}

export function trackWorkspaceCreated(p: PmfBase & { workspaceId: string; sector?: string | null }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.workspace.created',
    entityType: 'workspace',
    entityId: p.workspaceId,
    metadata: { sector: p.sector ?? null },
  })
}

export function trackFiscalCompleted(p: PmfBase & { workspaceId: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.fiscal.completed',
    entityType: 'workspace',
    entityId: p.workspaceId,
  })
}

export function trackClientCreated(p: PmfBase & { workspaceId: string; clientId: string; clientType?: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.client.created',
    entityType: 'client',
    entityId: p.clientId,
    metadata: { clientType: p.clientType ?? 'client' },
  })
}

export function trackInvoiceCreated(p: PmfBase & { workspaceId: string; invoiceId: string; total?: number; currency?: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.invoice.created',
    entityType: 'invoice',
    entityId: p.invoiceId,
    metadata: { total: p.total ?? null, currency: p.currency ?? 'EUR' },
  })
}

export function trackInvoiceEmitted(p: PmfBase & { workspaceId: string; invoiceId: string; total?: number }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.invoice.emitted',
    entityType: 'invoice',
    entityId: p.invoiceId,
    metadata: { total: p.total ?? null },
  })
}

export function trackInvoiceSent(p: PmfBase & { workspaceId: string; invoiceId: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.invoice.sent',
    entityType: 'invoice',
    entityId: p.invoiceId,
  })
}

export function trackOnboardingViewed(p: PmfBase & { workspaceId: string; source?: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.onboarding.viewed',
    entityType: 'workspace',
    entityId: p.workspaceId,
    metadata: { source: p.source ?? 'checklist' },
  })
}

export function trackOnboardingStepClicked(p: PmfBase & { workspaceId: string; stepId: string; stepLabel: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.onboarding.step.clicked',
    entityType: 'workspace',
    entityId: p.workspaceId,
    metadata: { stepId: p.stepId, stepLabel: p.stepLabel },
  })
}

export function trackOnboardingStepSkipped(p: PmfBase & { workspaceId: string; stepId: string; stepLabel: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.onboarding.step.skipped',
    entityType: 'workspace',
    entityId: p.workspaceId,
    metadata: { stepId: p.stepId, stepLabel: p.stepLabel },
  })
}

export function trackOnboardingBlocked(p: PmfBase & { workspaceId: string; reason: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.onboarding.blocked',
    entityType: 'workspace',
    entityId: p.workspaceId,
    metadata: { reason: p.reason },
  })
}

export function trackOnboardingCompleted(p: PmfBase & { workspaceId: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.onboarding.completed',
    entityType: 'workspace',
    entityId: p.workspaceId,
  })
}

export function trackInvoicePdfDownloaded(p: PmfBase & { workspaceId: string; invoiceId: string }): void {
  audit({
    orgId: p.orgId,
    workspaceId: p.workspaceId,
    actorUserId: p.userId,
    action: 'pmf.invoice.pdf.downloaded',
    entityType: 'invoice',
    entityId: p.invoiceId,
  })
}
