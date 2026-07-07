'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { validateToolSchema } from '@protools/schema'
import type { DataSchema } from '@protools/schema'
import type { Prisma } from '@prisma/client'
import { getPlanLimits } from '@/lib/plan-limits'
import { assertCan } from '@/lib/permissions'
import { audit } from '@/lib/audit'

export type RecordActionState = { error: string } | null

/** Carga la instancia y verifica que pertenece al workspace del usuario autenticado */
async function resolveInstance(instanceId: string) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true, trialPlan: true },
  })
  if (!user) redirect('/onboarding')

  const instance = await db.toolInstance.findFirst({
    where: {
      id: instanceId,
      status: 'ACTIVE',
      workspace: { orgId: user.orgId },
    },
    include: { toolDefinition: true, workspace: true },
  })

  return instance ? { user, instance } : null
}

/** Convierte los valores de FormData en el objeto data del record */
function buildRecordData(
  formData: FormData,
  dataSchema: DataSchema,
): { data: Record<string, unknown>; error: string | null } {
  const data: Record<string, unknown> = {}

  for (const [fieldId, field] of Object.entries(dataSchema.fields)) {
    const raw = formData.get(fieldId)

    // Checkbox no enviado = false para boolean
    if (field.type === 'boolean') {
      data[fieldId] = raw === 'on' || raw === 'true'
      continue
    }

    if (field.required && (raw === null || raw === '')) {
      return { data: {}, error: `El campo "${field.label}" es obligatorio.` }
    }

    if (raw === null || raw === '') {
      data[fieldId] = null
      continue
    }

    const str = raw.toString()
    if (field.type === 'number') {
      const n = parseFloat(str)
      data[fieldId] = isNaN(n) ? null : n
    } else {
      data[fieldId] = str
    }
  }

  return { data, error: null }
}

export async function createRecord(
  _prev: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const instanceId = formData.get('instanceId')?.toString() ?? ''
  const ctx = await resolveInstance(instanceId)
  if (!ctx) return { error: 'Herramienta no encontrada o sin acceso.' }

  const { user, instance } = ctx
  assertCan(user, 'create_record', { orgId: user.orgId, userId: user.id, workspaceId: instance.workspaceId, entityType: 'record', entityId: instanceId })

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) return { error: 'Schema de herramienta inválido.' }

  // Límite de registros por plan
  const planLimits = getPlanLimits(user.trialPlan)
  if (planLimits.maxRecordsPerInstance === 0) {
    return { error: 'Este dominio de correo no está permitido para la beta.' }
  }
  const recordCount = await db.toolRecord.count({
    where: { toolInstanceId: instanceId, isDeleted: false },
  })
  if (recordCount >= planLimits.maxRecordsPerInstance) {
    return {
      error: `Has alcanzado el límite de registros de tu plan (${planLimits.maxRecordsPerInstance}). Contacta con soporte para ampliar.`,
    }
  }

  const { data, error } = buildRecordData(formData, schemaResult.data.dataSchema)
  if (error) return { error }

  const created = await db.toolRecord.create({
    data: { toolInstanceId: instanceId, data: data as Prisma.InputJsonValue, createdBy: user.id },
  })

  audit({
    orgId: user.orgId,
    workspaceId: instance.workspaceId,
    actorUserId: user.id,
    action: 'record.create',
    entityType: 'record',
    entityId: created.id,
    metadata: { toolInstanceId: instanceId },
  })

  redirect(`/workspace/${instance.workspaceId}/tools/${instanceId}`)
}

export async function updateRecord(
  _prev: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const instanceId = formData.get('instanceId')?.toString() ?? ''
  const recordId = formData.get('recordId')?.toString() ?? ''
  const ctx = await resolveInstance(instanceId)
  if (!ctx) return { error: 'Herramienta no encontrada o sin acceso.' }

  assertCan(ctx.user, 'update_record', { orgId: ctx.user.orgId, userId: ctx.user.id, workspaceId: ctx.instance.workspaceId, entityType: 'record', entityId: recordId })
  const { instance } = ctx

  const existing = await db.toolRecord.findFirst({
    where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
  })
  if (!existing) return { error: 'Registro no encontrado.' }

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) return { error: 'Schema de herramienta inválido.' }

  const { data, error } = buildRecordData(formData, schemaResult.data.dataSchema)
  if (error) return { error }

  await db.toolRecord.update({ where: { id: recordId }, data: { data: data as Prisma.InputJsonValue } })

  audit({
    orgId: ctx.user.orgId,
    workspaceId: instance.workspaceId,
    actorUserId: ctx.user.id,
    action: 'record.update',
    entityType: 'record',
    entityId: recordId,
    metadata: { toolInstanceId: instanceId },
  })

  redirect(`/workspace/${instance.workspaceId}/tools/${instanceId}`)
}

export async function saveChecklistRecord(
  instanceId: string,
  formFields: Record<string, unknown>,
  items: Record<string, boolean>,
  recordId?: string,
): Promise<RecordActionState> {
  const ctx = await resolveInstance(instanceId)
  if (!ctx) return { error: 'Herramienta no encontrada o sin acceso.' }

  assertCan(ctx.user, recordId ? 'update_record' : 'create_record')

  // Server-side validation: sanitize formFields against schema
  const schemaResult = validateToolSchema(ctx.instance.toolDefinition.schema)
  if (!schemaResult.success) return { error: 'Schema de herramienta inválido.' }

  const { dataSchema } = schemaResult.data
  const sanitized: Record<string, unknown> = {}
  for (const [fieldId, field] of Object.entries(dataSchema.fields)) {
    const v = formFields[fieldId]
    if (field.required && field.type !== 'boolean' && (v === null || v === undefined || v === '')) {
      return { error: `El campo "${field.label}" es obligatorio.` }
    }
    sanitized[fieldId] = v ?? null
  }

  const data: Record<string, unknown> = {
    ...sanitized,
    _type: 'checklist',
    _items: items,
  }

  if (recordId) {
    const existing = await db.toolRecord.findFirst({
      where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
    })
    if (!existing) return { error: 'Registro no encontrado.' }
    await db.toolRecord.update({
      where: { id: recordId },
      data: { data: data as Prisma.InputJsonValue },
    })
  } else {
    await db.toolRecord.create({
      data: {
        toolInstanceId: instanceId,
        data: data as Prisma.InputJsonValue,
        createdBy: ctx.user.id,
      },
    })
  }

  return null
}

function computeTotalServerSide(
  criteria: Array<{ id: string; weight?: number; min?: number; max?: number }>,
  scores: Record<string, number>,
): number {
  const hasWeights = criteria.some((c) => typeof c.weight === 'number')
  if (hasWeights) {
    let weightedSum = 0
    let totalWeight = 0
    for (const c of criteria) {
      const w = c.weight ?? 0
      weightedSum += (scores[c.id] ?? (c.min ?? 1)) * w
      totalWeight += w
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }
  if (criteria.length === 0) return 0
  const sum = criteria.reduce((acc, c) => acc + (scores[c.id] ?? (c.min ?? 1)), 0)
  return sum / criteria.length
}

export async function saveScoringRecord(
  instanceId: string,
  scores: Record<string, number>,
  recordId?: string,
): Promise<RecordActionState> {
  const ctx = await resolveInstance(instanceId)
  if (!ctx) return { error: 'Herramienta no encontrada o sin acceso.' }

  assertCan(ctx.user, recordId ? 'update_record' : 'create_record')

  // Server-side validation: sanitize scores against schema criteria
  const schemaResult = validateToolSchema(ctx.instance.toolDefinition.schema)
  if (!schemaResult.success) return { error: 'Schema de herramienta inválido.' }

  const scoringCap = schemaResult.data.capabilities.find((c) => c.type === 'SCORING')
  if (!scoringCap) return { error: 'Esta herramienta no tiene capability SCORING.' }

  const criteria = (
    scoringCap.config as { criteria: Array<{ id: string; min?: number; max?: number; weight?: number }> }
  ).criteria

  const sanitizedScores: Record<string, number> = {}
  for (const criterion of criteria) {
    const raw = scores[criterion.id]
    const min = criterion.min ?? 1
    const max = criterion.max ?? 10
    const clamped = typeof raw === 'number' ? Math.min(max, Math.max(min, raw)) : min
    sanitizedScores[criterion.id] = clamped
  }

  const data: Record<string, unknown> = {
    _type: 'scoring',
    _scores: sanitizedScores,
    _total: computeTotalServerSide(criteria, sanitizedScores),
  }

  if (recordId) {
    const existing = await db.toolRecord.findFirst({
      where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
    })
    if (!existing) return { error: 'Registro no encontrado.' }
    await db.toolRecord.update({
      where: { id: recordId },
      data: { data: data as Prisma.InputJsonValue },
    })
  } else {
    await db.toolRecord.create({
      data: {
        toolInstanceId: instanceId,
        data: data as Prisma.InputJsonValue,
        createdBy: ctx.user.id,
      },
    })
  }

  return null
}

export type ImportResult = { imported: number; skipped: number; error?: string }

export async function importRecords(
  instanceId: string,
  rows: Record<string, unknown>[],
): Promise<ImportResult> {
  const ctx = await resolveInstance(instanceId)
  if (!ctx) return { imported: 0, skipped: 0, error: 'Herramienta no encontrada o sin acceso.' }

  const { user, instance } = ctx
  assertCan(user, 'create_record', { orgId: user.orgId, userId: user.id, workspaceId: instance.workspaceId, entityType: 'record', entityId: instanceId })

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) return { imported: 0, skipped: 0, error: 'Schema de herramienta inválido.' }

  const { dataSchema } = schemaResult.data
  const planLimits = getPlanLimits(user.trialPlan)

  const currentCount = await db.toolRecord.count({ where: { toolInstanceId: instanceId, isDeleted: false } })
  const available = planLimits.maxRecordsPerInstance - currentCount

  if (available <= 0) {
    return { imported: 0, skipped: rows.length, error: `Has alcanzado el límite de registros de tu plan (${planLimits.maxRecordsPerInstance}).` }
  }

  const toProcess = rows.slice(0, available)
  const cappedSkipped = rows.length - toProcess.length

  const validRows: Record<string, unknown>[] = []
  for (const row of toProcess) {
    const sanitized: Record<string, unknown> = {}
    let valid = true
    for (const [fieldId, field] of Object.entries(dataSchema.fields)) {
      const val = row[fieldId]
      if (field.required && (val === null || val === undefined || val === '')) {
        valid = false
        break
      }
      if (field.type === 'number' && val !== null && val !== undefined && val !== '') {
        const n = parseFloat(String(val))
        sanitized[fieldId] = isNaN(n) ? null : n
      } else {
        sanitized[fieldId] = val ?? null
      }
    }
    if (valid) validRows.push(sanitized)
  }

  const invalidSkipped = toProcess.length - validRows.length

  if (validRows.length === 0) {
    return { imported: 0, skipped: rows.length, error: 'Ninguna fila tiene todos los campos obligatorios cubiertos.' }
  }

  const result = await db.toolRecord.createMany({
    data: validRows.map((data) => ({
      toolInstanceId: instanceId,
      data: data as Prisma.InputJsonValue,
      createdBy: user.id,
    })),
  })

  audit({
    orgId: user.orgId,
    workspaceId: instance.workspaceId,
    actorUserId: user.id,
    action: 'record.import',
    entityType: 'record',
    entityId: instanceId,
    metadata: { toolInstanceId: instanceId, imported: result.count },
  })

  return { imported: result.count, skipped: cappedSkipped + invalidSkipped }
}

export async function deleteRecord(
  _prev: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const instanceId = formData.get('instanceId')?.toString() ?? ''
  const recordId = formData.get('recordId')?.toString() ?? ''
  const ctx = await resolveInstance(instanceId)
  if (!ctx) return { error: 'Herramienta no encontrada o sin acceso.' }

  assertCan(ctx.user, 'delete_record', { orgId: ctx.user.orgId, userId: ctx.user.id, workspaceId: ctx.instance.workspaceId, entityType: 'record', entityId: recordId })

  const existing = await db.toolRecord.findFirst({
    where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
  })
  if (!existing) return { error: 'Registro no encontrado.' }

  await db.toolRecord.update({
    where: { id: recordId },
    data: { isDeleted: true, deletedAt: new Date() },
  })

  audit({
    orgId: ctx.user.orgId,
    workspaceId: ctx.instance.workspaceId,
    actorUserId: ctx.user.id,
    action: 'record.delete',
    entityType: 'record',
    entityId: recordId,
    metadata: { toolInstanceId: instanceId },
  })

  redirect(`/workspace/${ctx.instance.workspaceId}/tools/${instanceId}`)
}
