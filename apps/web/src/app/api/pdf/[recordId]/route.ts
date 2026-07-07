export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { validateToolSchema } from '@protools/schema'
import { NextResponse } from 'next/server'
import { createElement } from 'react'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const record = await db.toolRecord.findFirst({
    where: { id: recordId, isDeleted: false },
    include: {
      toolInstance: {
        include: {
          toolDefinition: true,
          workspace: true,
          client: { select: { name: true } },
        },
      },
    },
  })

  if (!record) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  // Verify ownership
  if (record.toolInstance.workspace.orgId !== user.orgId) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const schemaResult = validateToolSchema(record.toolInstance.toolDefinition.schema)
  if (!schemaResult.success) {
    return NextResponse.json({ error: 'Schema inválido' }, { status: 500 })
  }

  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { RecordPdfDocument } = await import('@/lib/record-pdf')

  const data = (record.data ?? {}) as Record<string, unknown>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(RecordPdfDocument as any, {
    schema: schemaResult.data,
    data,
    toolName: record.toolInstance.name,
    workspaceName: record.toolInstance.workspace.name,
    clientName: record.toolInstance.client?.name ?? null,
    createdAt: record.createdAt,
    recordId,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await renderToBuffer(element as any)
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-${recordId.slice(0, 8)}.pdf"`,
    },
  })
}
