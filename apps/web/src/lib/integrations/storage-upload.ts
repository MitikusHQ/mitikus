import type { StorageProvider } from '@/lib/integrations/calendar'

export interface ExternalStorageUploadInput {
  provider: StorageProvider
  accessToken: string
  filename: string
  buffer: Buffer
}

export interface ExternalStorageUploadResult {
  providerFileId?: string | null
  webUrl?: string | null
}

export async function uploadToExternalStorage(input: ExternalStorageUploadInput): Promise<ExternalStorageUploadResult> {
  if (input.provider === 'google_drive') return uploadToGoogleDrive(input)
  if (input.provider === 'onedrive') return uploadToOneDrive(input)
  return uploadToDropbox(input)
}

async function uploadToGoogleDrive(input: ExternalStorageUploadInput): Promise<ExternalStorageUploadResult> {
  const metadata = {
    name: input.filename,
    mimeType: 'application/zip',
  }
  const boundary = `mitikus_${Date.now()}`
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\ncontent-type: application/zip\r\n\r\n`),
    input.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ])

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      'content-type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
  const data = await res.json() as { id?: string; webViewLink?: string; error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message ?? 'No se pudo subir el ZIP a Google Drive.')
  return { providerFileId: data.id ?? null, webUrl: data.webViewLink ?? null }
}

async function uploadToOneDrive(input: ExternalStorageUploadInput): Promise<ExternalStorageUploadResult> {
  const encodedName = encodeURIComponent(input.filename)
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/MITIKUS/${encodedName}:/content`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      'content-type': 'application/zip',
    },
    body: new Uint8Array(input.buffer),
  })
  const data = await res.json() as { id?: string; webUrl?: string; error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message ?? 'No se pudo subir el ZIP a OneDrive.')
  return { providerFileId: data.id ?? null, webUrl: data.webUrl ?? null }
}

async function uploadToDropbox(input: ExternalStorageUploadInput): Promise<ExternalStorageUploadResult> {
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      'content-type': 'application/octet-stream',
      'dropbox-api-arg': JSON.stringify({
        path: `/MITIKUS/${input.filename}`,
        mode: 'add',
        autorename: true,
        mute: false,
      }),
    },
    body: new Uint8Array(input.buffer),
  })
  const data = await res.json() as { id?: string; path_display?: string; error_summary?: string }
  if (!res.ok) throw new Error(data.error_summary ?? 'No se pudo subir el ZIP a Dropbox.')
  return { providerFileId: data.id ?? null, webUrl: data.path_display ?? null }
}
