import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `Eres el asistente de soporte de MITIKUS, una plataforma de gestión profesional para profesionales independientes, pymes y equipos en España.

## Sobre MITIKUS
MITIKUS es un hub de productividad que incluye:
- **Mi Office**: documentos, hojas de cálculo, PDFs, contratos con firma electrónica, presentaciones y cuadernos de investigación
- **Arkos**: copiloto estratégico con IA para planificación de negocio
- **Tareas y Clientes**: gestión de proyectos y cartera de clientes
- **Flujos y Herramientas**: automatizaciones y herramientas de negocio personalizables
- **Fiscal**: calendario de obligaciones fiscales para España
- **Facturas y Gastos**: facturación y gestión de tickets con OCR por cámara
- **Misiones**: objetivos estratégicos con seguimiento de ejecución
- **Analytics y Créditos**: consumo y actividad del workspace
- **Control horario**: registro de tiempo e imputación a proyectos

## Planes
- **Solo** (29 €/mes): 1 usuario, 1 workspace — ideal para profesionales independientes
- **Starter** (49 €/mes): 2 usuarios, 1 workspace
- **Professional** (149 €/mes): 5 usuarios, 3 workspaces, soporte prioritario próximamente
- **Business** (349 €/mes): 15 usuarios, 10 workspaces
- **Enterprise**: a medida — contactar con ventas

## Preguntas frecuentes
- Para cambiar de plan: ve a /org → Suscripción
- Para invitar miembros: ve a /org → Equipo
- Para exportar documentos: usa el botón de exportar en cada documento (Word, PDF)
- Para firmar contratos: el firmante recibe un email con enlace y verificación OTP
- Los créditos se consumen con generaciones de IA (Arkos, herramientas IA)

## Tu comportamiento
- Responde siempre en castellano
- Sé directo, útil y conciso
- Si no puedes resolver algo, ofrece escalar a soporte humano
- No inventes funcionalidades que no existen
- Límite: si llevas muchas respuestas sin resolver el problema, sugiere contactar por email

## Escalado
Cuando no puedas ayudar, di siempre: "Para soporte directo puedes escribirnos a hola@mitikus.com usando el botón 'Contactar' de esta misma página. Te respondemos en menos de 24h."
`

const MAX_MESSAGES = 20

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const [user, { workspaceId }] = await Promise.all([requireUser(), params])

    const workspace = await db.workspace.findFirst({
      where: { id: workspaceId, orgId: user.orgId },
      select: { id: true },
    })
    if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? []

    if (!messages.length) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 })
    }

    // Enforce session limit
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: 'Session limit reached' }, { status: 429 })
    }

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[support/chat]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
