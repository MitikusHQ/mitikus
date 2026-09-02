import { db } from '@/lib/db'
import { totalStorageLimit } from './supabase-storage'

export interface StorageStatus {
  usedBytes: number
  limitBytes: number
  percentUsed: number
  hasCapacity: boolean
}

export async function getStorageStatus(workspaceId: string, fileSizeBytes = 0): Promise<StorageStatus> {
  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: {
      org: {
        include: { subscription: true },
      },
      workspaceFiles: { select: { size: true } },
    },
  })

  const sub = workspace.org.subscription
  const tier = sub?.tier ?? 'STARTER'
  const extraGB = sub?.extraStorageGB ?? 0

  const usedBytes = workspace.workspaceFiles.reduce((sum, f) => sum + f.size, 0)
  const limitBytes = totalStorageLimit(tier, extraGB)
  const afterUpload = usedBytes + fileSizeBytes

  return {
    usedBytes,
    limitBytes,
    percentUsed: Math.round((afterUpload / limitBytes) * 100),
    hasCapacity: afterUpload <= limitBytes,
  }
}
