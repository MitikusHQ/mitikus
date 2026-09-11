import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Resend } from 'resend'

const MAX_SUBJECT_LEN = 200
const MAX_BODY_LEN    = 4000

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const [user, { workspaceId }] = await Promise.all([requireUser(), params])

    const workspace = await db.workspace.findFirst({
      where:  { id: workspaceId, orgId: user.orgId },
      select: { id: true, name: true },
    })
    if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const subject: string = (body.subject ?? '').trim().slice(0, MAX_SUBJECT_LEN)
    const message: string = (body.message ?? '').trim().slice(0, MAX_BODY_LEN)

    if (!subject || !message) {
      return NextResponse.json({ error: 'subject and message are required' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from:    'MITIKUS Support <notificaciones@mitikus.com>',
      to:      'hola@mitikus.com',
      replyTo: user.email,
      subject: `[Soporte] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
          <div style="background:#0f172a;padding:14px 24px;border-radius:8px 8px 0 0">
            <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:.08em">MITIKUS — Mensaje de soporte</span>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <table style="font-size:13px;color:#555;margin-bottom:20px;width:100%">
              <tr><td style="padding:4px 0;font-weight:600;color:#111;width:100px">Usuario:</td><td>${user.email}</td></tr>
              <tr><td style="padding:4px 0;font-weight:600;color:#111">Workspace:</td><td>${workspace.name ?? workspaceId}</td></tr>
              <tr><td style="padding:4px 0;font-weight:600;color:#111">Asunto:</td><td>${subject}</td></tr>
            </table>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;white-space:pre-wrap;font-size:14px;color:#334155;line-height:1.7">
              ${message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
            </div>
            <p style="margin-top:20px;font-size:12px;color:#94a3b8">
              Responde directamente a este email para contestar al usuario.<br/>
              MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[support/contact]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
