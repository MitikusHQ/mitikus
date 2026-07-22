import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ contractId: string }>
}

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { contractId } = await params

  // Permitir llamada interna (desde signClientContract) o usuario autenticado
  const internalSecret = req.headers.get('x-internal-secret')
  const isInternal     = internalSecret && internalSecret === (process.env.INTERNAL_SECRET ?? '')

  if (!isInternal) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contract = await db.contract.findUnique({
    where:  { id: contractId },
    select: {
      pdfData:           true,
      internalSignature: true,
      clientSignature:   true,
      internalSignedAt:  true,
      clientSignedAt:    true,
      clientName:        true,
      clientIp:          true,
      creator:           { select: { name: true, email: true } },
    },
  })

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')

  const pdfDoc = await PDFDocument.load(contract.pdfData)

  // Añadir página de registro de firmas
  const signPage = pdfDoc.addPage([595, 842]) // A4
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  signPage.drawText('Registro de firmas', {
    x: 50, y: 790, size: 18, font: fontBold, color: rgb(0.1, 0.1, 0.1),
  })
  signPage.drawLine({
    start: { x: 50, y: 778 }, end: { x: 545, y: 778 },
    thickness: 1, color: rgb(0.8, 0.8, 0.8),
  })

  // Firma interna
  signPage.drawText('Parte emisora', {
    x: 50, y: 750, size: 11, font: fontBold, color: rgb(0.3, 0.3, 0.3),
  })
  signPage.drawText(contract.creator.name ?? contract.creator.email, {
    x: 50, y: 733, size: 10, font, color: rgb(0.1, 0.1, 0.1),
  })
  if (contract.internalSignedAt) {
    signPage.drawText(
      `Firmado el ${contract.internalSignedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      { x: 50, y: 718, size: 9, font, color: rgb(0.5, 0.5, 0.5) },
    )
  }
  if (contract.internalSignature) {
    const sigImg = await pdfDoc.embedPng(contract.internalSignature)
    signPage.drawImage(sigImg, { x: 50, y: 640, width: 180, height: 70 })
  }
  signPage.drawLine({
    start: { x: 50, y: 630 }, end: { x: 230, y: 630 },
    thickness: 0.5, color: rgb(0.5, 0.5, 0.5),
  })

  // Firma cliente
  signPage.drawText('Parte receptora', {
    x: 310, y: 750, size: 11, font: fontBold, color: rgb(0.3, 0.3, 0.3),
  })
  signPage.drawText(contract.clientName ?? '—', {
    x: 310, y: 733, size: 10, font, color: rgb(0.1, 0.1, 0.1),
  })
  if (contract.clientSignedAt) {
    signPage.drawText(
      `Firmado el ${contract.clientSignedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      { x: 310, y: 718, size: 9, font, color: rgb(0.5, 0.5, 0.5) },
    )
  }
  if (contract.clientIp) {
    signPage.drawText(`IP: ${contract.clientIp}`, {
      x: 310, y: 706, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    })
  }
  if (contract.clientSignature) {
    const sigImg = await pdfDoc.embedPng(contract.clientSignature)
    signPage.drawImage(sigImg, { x: 310, y: 640, width: 180, height: 70 })
  }
  signPage.drawLine({
    start: { x: 310, y: 630 }, end: { x: 490, y: 630 },
    thickness: 0.5, color: rgb(0.5, 0.5, 0.5),
  })

  signPage.drawText('Documento generado por MITIKUS · mitikus.com', {
    x: 50, y: 40, size: 8, font, color: rgb(0.7, 0.7, 0.7),
  })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'inline; filename="contrato-firmado.pdf"',
    },
  })
}
