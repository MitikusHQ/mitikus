// POST /api/import/process
// Recibe un archivo vía FormData, lo parsea y normaliza, devuelve NormalizedDocument

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { processFile } from '@protools/import-engine'
import type { ImportFile } from '@protools/import-engine'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(request: NextRequest) {
  const { userId: clerkId, orgId } = await auth()
  if (!clerkId || !orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Request inválida — se esperaba multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" requerido' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: `Archivo demasiado grande (máximo 20 MB)` }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const importFile: ImportFile = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    buffer,
  }

  try {
    const result = await processFile(importFile)

    return NextResponse.json({
      document: result.document,
      isDirectSchema: result.isDirectSchema,
      detectionConfidence: result.detectionConfidence,
      validationErrors: result.validationErrors,
      warnings: result.warnings,
      durationMs: result.durationMs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
