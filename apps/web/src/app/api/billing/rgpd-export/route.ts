/**
 * POST /api/billing/rgpd-export
 *   Protegido con x-internal-secret (solo llamado desde triggerOrgDataExport).
 *   Genera el ZIP, lo almacena en DataExportRequest, y envía el email al owner.
 *
 * GET /api/billing/rgpd-export?token=<export-token>
 *   Descarga el ZIP verificando el token HMAC.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOrgExportZip, issueExportToken, verifyExportToken } from '@/lib/rgpd/export-service'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const maxDuration = 300 // Vercel Pro — hasta 5 min para orgs grandes

// ---------------------------------------------------------------
// POST — generación
// ---------------------------------------------------------------

export async function POST(req: Request) {
  const secret = process.env.MITIKUS_LICENSE_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const internalSecret = req.headers.get('x-internal-secret')
  if (!internalSecret || internalSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let orgId: string
  try {
    const body = await req.json() as { orgId?: string }
    if (!body.orgId) throw new Error('missing orgId')
    orgId = body.orgId
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Marcar como PROCESSING
  await db.dataExportRequest.upsert({
    where: { orgId },
    create: { orgId, status: 'PROCESSING' },
    update: { status: 'PROCESSING', updatedAt: new Date() },
  })

  try {
    const zipBuffer = await generateOrgExportZip(orgId)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.dataExportRequest.update({
      where: { orgId },
      data: { status: 'DONE', zipData: new Uint8Array(zipBuffer), expiresAt, updatedAt: new Date() },
    })

    // Buscar email del owner
    const owner = await db.user.findFirst({
      where: { orgId, role: 'OWNER' },
      select: { email: true, name: true },
    })
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    })

    if (owner && process.env.RESEND_API_KEY) {
      const token = issueExportToken(orgId)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mitikus.com'
      const downloadUrl = `${baseUrl}/api/billing/rgpd-export?token=${encodeURIComponent(token)}`

      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'MITIKUS <notificaciones@mitikus.com>',
        to: owner.email,
        subject: 'Tu exportación de datos MITIKUS está lista',
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:0">
            <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
              <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
            </div>
            <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
              <p style="font-size:16px;color:#0f172a;margin:0 0 12px">Hola${owner.name ? `, ${owner.name.split(' ')[0]}` : ''}.</p>
              <p style="font-size:15px;color:#334155;margin:0 0 16px;line-height:1.6">
                Hemos preparado tu exportación de datos de <strong>${org?.name ?? 'tu cuenta'}</strong> conforme al
                artículo 20 del RGPD (derecho a la portabilidad).
              </p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:0 0 24px;border:1px solid #e2e8f0">
                <p style="margin:0 0 6px;font-size:13px;color:#64748b">El ZIP incluye:</p>
                <ul style="margin:0;padding-left:18px;font-size:13px;color:#334155;line-height:1.8">
                  <li>Organización, workspaces y miembros</li>
                  <li>Documentos, hojas, tareas y presentaciones</li>
                  <li>Contratos y facturas</li>
                  <li>Memoria del Brain (si aplica)</li>
                </ul>
              </div>
              <div style="text-align:center;margin:24px 0">
                <a href="${downloadUrl}"
                   style="display:inline-block;padding:13px 28px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
                  Descargar mis datos →
                </a>
              </div>
              <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">
                Este enlace caduca el ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(expiresAt)}.
              </p>
              <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center">
                Para cualquier consulta sobre tus datos, escríbenos a
                <a href="mailto:privacidad@mitikus.com" style="color:#94a3b8">privacidad@mitikus.com</a>
              </p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await db.dataExportRequest.update({
      where: { orgId },
      data: { status: 'FAILED', error: String(err), updatedAt: new Date() },
    }).catch(() => {})
    console.error('[rgpd-export] error generando ZIP', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------
// GET — descarga
// ---------------------------------------------------------------

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const parsed = verifyExportToken(token)
  if (!parsed) return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 403 })

  const record = await db.dataExportRequest.findUnique({
    where: { orgId: parsed.orgId },
    select: { status: true, zipData: true, expiresAt: true },
  })

  if (!record || record.status !== 'DONE' || !record.zipData) {
    return NextResponse.json({ error: 'Exportación no disponible' }, { status: 404 })
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'El enlace de descarga ha expirado' }, { status: 410 })
  }

  const org = await db.organization.findUnique({
    where: { id: parsed.orgId },
    select: { name: true },
  })
  const filename = `mitikus-export-${(org?.name ?? parsed.orgId).toLowerCase().replace(/\s+/g, '-')}.zip`

  return new Response(record.zipData, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(record.zipData.length),
      'Cache-Control': 'private, no-store',
    },
  })
}
