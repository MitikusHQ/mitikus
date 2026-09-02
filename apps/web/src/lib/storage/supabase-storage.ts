import { StorageClient } from '@supabase/storage-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = 'workspace-files'

// Límites por plan (en bytes)
export const STORAGE_LIMITS: Record<string, number> = {
  AUTONOMO:     1 * 1024 * 1024 * 1024,  // 1 GB
  STARTER:      2 * 1024 * 1024 * 1024,  // 2 GB
  PROFESSIONAL: 5 * 1024 * 1024 * 1024,  // 5 GB
  BUSINESS:    20 * 1024 * 1024 * 1024,  // 20 GB
  ENTERPRISE:  50 * 1024 * 1024 * 1024,  // 50 GB
}

// GB extra de add-on Stripe: cada unidad = 5 GB
export const EXTRA_GB_PER_ADDON = 5 * 1024 * 1024 * 1024

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorios')
  }
  return new StorageClient(`${SUPABASE_URL}/storage/v1`, {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  })
}

export function storagePath(workspaceId: string, fileId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `workspaces/${workspaceId}/${fileId}/${safe}`
}

export async function uploadFile(
  workspaceId: string,
  fileId: string,
  filename: string,
  data: Buffer | Blob,
  mimeType: string,
): Promise<{ path: string; url: string }> {
  const client = getClient()
  const path = storagePath(workspaceId, fileId, filename)
  const { error } = await client.from(BUCKET).upload(path, data, {
    contentType: mimeType,
    upsert: false,
  })
  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const { data: urlData } = client.from(BUCKET).getPublicUrl(path)
  return { path, url: urlData.publicUrl }
}

export async function deleteFile(storagePath: string): Promise<void> {
  const client = getClient()
  const { error } = await client.from(BUCKET).remove([storagePath])
  if (error) throw new Error(`Supabase delete failed: ${error.message}`)
}

export async function getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const client = getClient()
  const { data, error } = await client.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds)
  if (error || !data) throw new Error(`Supabase signed URL failed: ${error?.message}`)
  return data.signedUrl
}

export function totalStorageLimit(tier: string, extraStorageGB: number): number {
  const base = STORAGE_LIMITS[tier] ?? STORAGE_LIMITS['STARTER']!
  return base + extraStorageGB * EXTRA_GB_PER_ADDON
}
