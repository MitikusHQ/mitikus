/**
 * Company Profile — CRUD del perfil empresarial por workspace.
 *
 * Cada workspace tiene exactamente un CompanyProfile (1:1).
 * Si no existe, se crea vacío la primera vez que se accede.
 */

import { db } from '@/lib/db'
import { normalizeProfileUpdate, calculateConfidence } from './memory-validator'
import type { CompanyProfileData, CompanyProfileUpdate, MemorySource } from './memory-types'
import type { Prisma } from '@prisma/client'

// ── Helpers ────────────────────────────────────────────────────────

function toJsonArray(v: Prisma.JsonValue): string[] {
  return Array.isArray(v) ? (v as string[]) : []
}

function mapToData(p: Awaited<ReturnType<typeof db.companyProfile.findUnique>>): CompanyProfileData | null {
  if (!p) return null
  return {
    id:              p.id,
    workspaceId:     p.workspaceId,
    companyName:     p.companyName,
    sector:          p.sector,
    subsector:       p.subsector,
    country:         p.country,
    city:            p.city,
    website:         p.website,
    foundedYear:     p.foundedYear,
    size:            p.size as CompanyProfileData['size'],
    languages:       toJsonArray(p.languages),
    markets:         toJsonArray(p.markets),
    services:        toJsonArray(p.services),
    products:        toJsonArray(p.products),
    customers:       toJsonArray(p.customers),
    competitors:     toJsonArray(p.competitors),
    regulations:     toJsonArray(p.regulations),
    certifications:  toJsonArray(p.certifications),
    softwareUsed:    toJsonArray(p.softwareUsed),
    integrations:    toJsonArray(p.integrations),
    digitalMaturity: p.digitalMaturity as CompanyProfileData['digitalMaturity'],
    departments:     toJsonArray(p.departments),
    confidence:      p.confidence,
    lastUpdatedBy:   p.lastUpdatedBy,
    lastUpdatedAt:   p.lastUpdatedAt.toISOString(),
  }
}

// ── Public functions ───────────────────────────────────────────────

/**
 * Obtiene el perfil del workspace, creándolo si no existe.
 */
export async function getOrCreateProfile(workspaceId: string): Promise<CompanyProfileData> {
  const existing = await db.companyProfile.findUnique({ where: { workspaceId } })
  if (existing) return mapToData(existing)!

  const created = await db.companyProfile.create({
    data: { workspaceId },
  })
  return mapToData(created)!
}

/**
 * Obtiene el perfil del workspace. Devuelve null si no existe.
 */
export async function getProfile(workspaceId: string): Promise<CompanyProfileData | null> {
  const p = await db.companyProfile.findUnique({ where: { workspaceId } })
  return mapToData(p)
}

/**
 * Actualiza campos del perfil, registrando el log de cambios.
 * Solo actualiza los campos que son más informativos que los actuales.
 */
export async function updateProfile(
  workspaceId: string,
  update: CompanyProfileUpdate,
  source: MemorySource,
  actorUserId: string | null,
  confidence: number,
  sourceId: string | null = null,
): Promise<CompanyProfileData> {
  const clean   = normalizeProfileUpdate(update)
  const profile = await getOrCreateProfile(workspaceId)

  // Preparar datos de log de cada campo cambiado
  const logEntries: Array<{
    field: string
    oldValue: Prisma.InputJsonValue | null
    newValue: Prisma.InputJsonValue
  }> = []

  const updateData: Record<string, unknown> = {}

  for (const [field, newValue] of Object.entries(clean)) {
    const oldValue = profile[field as keyof CompanyProfileData]

    // No sobrescribir con null si ya hay dato
    if ((newValue === null || newValue === undefined) && oldValue !== null && oldValue !== undefined) continue

    // Para arrays: mergear en lugar de reemplazar
    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
      const merged = [...new Set([...oldValue, ...newValue])]
      if (merged.length === (oldValue as string[]).length) continue  // sin cambios
      updateData[field] = merged
      logEntries.push({ field, oldValue: oldValue as string[], newValue: merged })
    } else {
      if (JSON.stringify(newValue) === JSON.stringify(oldValue)) continue
      updateData[field] = newValue
      logEntries.push({
        field,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
      })
    }
  }

  if (Object.keys(updateData).length === 0) return profile

  // Recalcular confianza
  const mergedForConfidence: CompanyProfileUpdate = { ...profile, ...updateData } as CompanyProfileUpdate
  const newConfidence = Math.max(profile.confidence, calculateConfidence(mergedForConfidence))

  const updated = await db.companyProfile.update({
    where:  { workspaceId },
    data:   {
      ...updateData,
      confidence:    newConfidence,
      lastUpdatedBy: actorUserId ?? source,
      lastUpdatedAt: new Date(),
    },
  })

  // Registrar logs (fire and forget)
  if (logEntries.length > 0) {
    void db.businessMemoryLog.createMany({
      data: logEntries.map((e) => ({
        workspaceId,
        profileId:   profile.id,
        field:       e.field,
        oldValue:    e.oldValue as Prisma.InputJsonValue,
        newValue:    e.newValue as Prisma.InputJsonValue,
        source,
        sourceId,
        actorUserId,
        confidence,
      })),
    })
  }

  return mapToData(updated)!
}
