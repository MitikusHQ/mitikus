import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const schema = z.object({
  name:    z.string().min(2).max(100),
  email:   z.string().email(),
  company: z.string().max(100).optional(),
  phone:   z.string().max(30).optional(),
  message: z.string().max(1000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { org: { include: { users: { take: 1 } } } },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.issues }, { status: 400 })

  const lead = await db.workspaceLead.create({
    data: { workspaceId, ...parsed.data },
  })

  // Notificación al propietario del workspace (primer miembro)
  const ownerEmail = workspace.org.users[0]?.email
  if (ownerEmail && resend) {
    await resend.emails.send({
      from: 'MITIKUS <noreply@mitikus.com>',
      to: ownerEmail,
      subject: `Nuevo lead: ${lead.name}`,
      html: `
        <p>Has recibido un nuevo lead en tu workspace <strong>${workspace.name}</strong>.</p>
        <ul>
          <li><strong>Nombre:</strong> ${lead.name}</li>
          <li><strong>Email:</strong> ${lead.email}</li>
          ${lead.company ? `<li><strong>Empresa:</strong> ${lead.company}</li>` : ''}
          ${lead.phone ? `<li><strong>Teléfono:</strong> ${lead.phone}</li>` : ''}
          ${lead.message ? `<li><strong>Mensaje:</strong> ${lead.message}</li>` : ''}
        </ul>
        <p>Gestiona tus leads en MITIKUS.</p>
      `,
    }).catch(() => undefined)
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 })
}
