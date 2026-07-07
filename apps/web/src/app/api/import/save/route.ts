// POST /api/import/save
// Guarda el ToolSchema validado como nueva ToolDefinition + registra ImportSource

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { validateImportedSchema } from '@protools/import-engine'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { userId: clerkId, orgId } = await auth()
  if (!clerkId || !orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { schema, importMeta } = body as {
    schema: unknown
    importMeta?: {
      format?: string
      originalName?: string
      fileSizeBytes?: number
      confidence?: number
      warnings?: string[]
    }
  }

  // Validar el schema antes de guardar
  const validation = validateImportedSchema(schema)
  if (!validation.valid) {
    return NextResponse.json({ error: 'Schema inválido', details: validation.errors }, { status: 422 })
  }

  const validSchema = validation.schema!
  const title = (validSchema as Record<string, unknown>).title as string || 'Herramienta importada'

  // Generar slug único dentro de la org
  const baseSlug = title.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  const slug = `${baseSlug}-${nanoid(6)}`

  // Mapear category del schema al enum Prisma
  const categoryMap: Record<string, string> = {
    audit: 'AUDIT', checklist: 'CHECKLIST', scoring: 'EVALUATION',
    form: 'CUSTOM', mixed: 'CUSTOM',
  }
  const schemaCategory = (validSchema as Record<string, unknown>).category as string | undefined
  const category = categoryMap[schemaCategory ?? ''] ?? 'CUSTOM'

  const description = (validSchema as Record<string, unknown>).description as string || ''

  const [toolDefinition, importSource] = await db.$transaction([
    db.toolDefinition.create({
      data: {
        slug,
        name: title,
        description,
        category: category as never,
        schema: validSchema as never,
        isPublic: false,
        orgId: user.orgId,
        createdBy: user.id,
      },
    }),
    db.importSource.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        format: importMeta?.format ?? 'unknown',
        originalName: importMeta?.originalName ?? 'desconocido',
        fileSizeBytes: importMeta?.fileSizeBytes ?? 0,
        confidence: importMeta?.confidence ?? 0,
        warnings: (importMeta?.warnings ?? []) as never,
      },
    }),
  ])

  // Actualizar ImportSource con toolDefinitionId
  await db.importSource.update({
    where: { id: importSource.id },
    data: { toolDefinitionId: toolDefinition.id },
  })

  return NextResponse.json({ toolDefinitionId: toolDefinition.id, slug }, { status: 201 })
}
