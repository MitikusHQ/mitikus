/**
 * Company Assets — activos digitales y físicos del workspace.
 */

import { db } from '@/lib/db'
import { getOrCreateProfile } from './company-profile'
import type { CompanyAssetData, AssetType } from './memory-types'

function mapAsset(a: {
  id: string
  workspaceId: string
  type: string
  name: string
  description: string | null
  url: string | null
  vendor: string | null
  status: string
}): CompanyAssetData {
  return {
    id:          a.id,
    workspaceId: a.workspaceId,
    type:        a.type as AssetType,
    name:        a.name,
    description: a.description,
    url:         a.url,
    vendor:      a.vendor,
    status:      a.status as CompanyAssetData['status'],
  }
}

export async function getAssets(
  workspaceId: string,
  type?: AssetType,
): Promise<CompanyAssetData[]> {
  const rows = await db.companyAsset.findMany({
    where:   { workspaceId, ...(type ? { type } : {}), status: { not: 'inactive' } },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
  return rows.map(mapAsset)
}

export async function upsertAsset(
  workspaceId: string,
  data: {
    type:         AssetType
    name:         string
    description?: string
    url?:         string
    vendor?:      string
  },
): Promise<CompanyAssetData> {
  const profile = await getOrCreateProfile(workspaceId)

  // Si ya existe un activo del mismo tipo y nombre, actualizar
  const existing = await db.companyAsset.findFirst({
    where: { workspaceId, type: data.type, name: data.name },
  })

  if (existing) {
    const updated = await db.companyAsset.update({
      where: { id: existing.id },
      data:  {
        description: data.description ?? existing.description,
        url:         data.url         ?? existing.url,
        vendor:      data.vendor      ?? existing.vendor,
        status:      'active',
      },
    })
    return mapAsset(updated)
  }

  const created = await db.companyAsset.create({
    data: {
      workspaceId,
      profileId:   profile.id,
      type:        data.type,
      name:        data.name.trim().slice(0, 200),
      description: data.description?.trim().slice(0, 500) ?? null,
      url:         data.url?.trim()    ?? null,
      vendor:      data.vendor?.trim() ?? null,
    },
  })
  return mapAsset(created)
}
