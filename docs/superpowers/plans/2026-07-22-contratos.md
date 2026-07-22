# Contratos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulo completo de firma de contratos: subir PDF, firma interna + cliente, estados DRAFT/SENT/SIGNED, PDF final con firmas incrustadas, emails automáticos.

**Architecture:** Modelo `Contract` en Prisma con `pdfData` (Bytes) y firmas como PNG (Bytes). Server actions autenticadas para el flujo interno; API route pública `POST /api/contracts/sign/[token]` para la firma del cliente. `pdf-lib` en server-side genera el PDF firmado. `react-signature-canvas` en Client Components para el canvas de firma. Contratos accesibles desde Mi Office hub, sin ítem propio en el sidebar.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma + PostgreSQL, pdf-lib, react-signature-canvas, react-pdf (ya instalado), Resend (ya instalado).

---

## Archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/web/prisma/schema.prisma` |
| Crear | `apps/web/src/app/actions/contracts.ts` |
| Crear | `apps/web/src/app/api/contracts/upload/route.ts` |
| Crear | `apps/web/src/app/api/contracts/[contractId]/sign-pdf/route.ts` |
| Modificar | `apps/web/src/lib/email.ts` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractList.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractUploadZone.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/page.tsx` |
| Crear | `apps/web/src/components/signature-canvas.tsx` — componente compartido |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/SendToClientModal.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/ContractViewerClient.tsx` |
| Crear | `apps/web/src/app/contracts/sign/[token]/page.tsx` |
| Crear | `apps/web/src/app/contracts/sign/[token]/_components/PublicSignClient.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` |

---

### Task 1: Prisma schema + dependencias

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Instalar dependencias**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npm install pdf-lib react-signature-canvas
npm install --save-dev @types/react-signature-canvas
```

Expected: `added N packages` sin errores.

- [ ] **Step 2: Añadir enum y modelo Contract al schema**

Localiza el final del archivo `apps/web/prisma/schema.prisma` (después del modelo `Notification`) y añade:

```prisma
enum ContractStatus {
  DRAFT
  SENT
  SIGNED
}

model Contract {
  id                String         @id @default(cuid())
  workspaceId       String
  title             String
  pdfData           Bytes
  status            ContractStatus @default(DRAFT)
  clientName        String         @default("")
  clientEmail       String         @default("")
  shareToken        String         @unique @default(cuid())

  internalSignature Bytes?
  internalAccepted  Boolean        @default(false)
  internalSignedAt  DateTime?

  clientSignature   Bytes?
  clientAccepted    Boolean        @default(false)
  clientSignedAt    DateTime?
  clientIp          String?

  signedPdfData     Bytes?

  createdBy         String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  workspace         Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator           User           @relation(fields: [createdBy], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@index([workspaceId, status])
  @@index([shareToken])
  @@map("contracts")
}
```

También añade la relación inversa en el modelo `Workspace` (busca el bloque `model Workspace`) — añade junto a `pdfs` y `documents`:

```prisma
  contracts            Contract[]
```

Y en el modelo `User` añade junto a `pdfsUploaded`:

```prisma
  contractsCreated     Contract[]
```

- [ ] **Step 3: Push schema a la BD**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/prisma/schema.prisma apps/web/package.json apps/web/package-lock.json
git commit -m "feat: add Contract model and install pdf-lib, react-signature-canvas"
```

---

### Task 2: Server actions `contracts.ts`

**Files:**
- Create: `apps/web/src/app/actions/contracts.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/app/actions/contracts.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface ContractData {
  id:              string
  title:           string
  status:          'DRAFT' | 'SENT' | 'SIGNED'
  clientName:      string
  clientEmail:     string
  internalAccepted: boolean
  internalSignedAt: string | null
  clientAccepted:  boolean
  clientSignedAt:  string | null
  createdAt:       string
  creatorName:     string | null
}

export interface ContractDetail extends ContractData {
  pdfDataArray:              number[]
  internalSignatureArray:    number[] | null
  clientSignatureArray:      number[] | null
  shareToken:                string
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getContracts(workspaceId: string): Promise<ContractData[]> {
  await getAuthUser()
  const contracts = await db.contract.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:               true,
      title:            true,
      status:           true,
      clientName:       true,
      clientEmail:      true,
      internalAccepted: true,
      internalSignedAt: true,
      clientAccepted:   true,
      clientSignedAt:   true,
      createdAt:        true,
      creator:          { select: { name: true } },
    },
  })

  return contracts.map((c) => ({
    id:               c.id,
    title:            c.title,
    status:           c.status,
    clientName:       c.clientName,
    clientEmail:      c.clientEmail,
    internalAccepted: c.internalAccepted,
    internalSignedAt: c.internalSignedAt?.toISOString() ?? null,
    clientAccepted:   c.clientAccepted,
    clientSignedAt:   c.clientSignedAt?.toISOString() ?? null,
    createdAt:        c.createdAt.toISOString(),
    creatorName:      c.creator.name,
  }))
}

export async function getContract(
  contractId: string,
  workspaceId: string,
): Promise<ContractDetail | null> {
  await getAuthUser()
  const c = await db.contract.findFirst({
    where:  { id: contractId, workspaceId },
    select: {
      id:                    true,
      title:                 true,
      status:                true,
      clientName:            true,
      clientEmail:           true,
      shareToken:            true,
      internalAccepted:      true,
      internalSignedAt:      true,
      internalSignature:     true,
      clientAccepted:        true,
      clientSignedAt:        true,
      clientSignature:       true,
      pdfData:               true,
      createdAt:             true,
      creator:               { select: { name: true } },
    },
  })
  if (!c) return null

  return {
    id:                     c.id,
    title:                  c.title,
    status:                 c.status,
    clientName:             c.clientName,
    clientEmail:            c.clientEmail,
    shareToken:             c.shareToken,
    internalAccepted:       c.internalAccepted,
    internalSignedAt:       c.internalSignedAt?.toISOString() ?? null,
    internalSignatureArray: c.internalSignature ? Array.from(c.internalSignature) : null,
    clientAccepted:         c.clientAccepted,
    clientSignedAt:         c.clientSignedAt?.toISOString() ?? null,
    clientSignatureArray:   c.clientSignature ? Array.from(c.clientSignature) : null,
    pdfDataArray:           Array.from(c.pdfData),
    createdAt:              c.createdAt.toISOString(),
    creatorName:            c.creator.name,
  }
}

export async function signInternalContract(
  contractId:   string,
  workspaceId:  string,
  dataUrl:      string,
  accepted:     boolean,
): Promise<void> {
  await getAuthUser()
  // dataUrl = "data:image/png;base64,..."
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid signature data URL')
  const buffer = Buffer.from(base64, 'base64')

  await db.contract.updateMany({
    where: { id: contractId, workspaceId },
    data: {
      internalSignature: buffer,
      internalAccepted:  accepted,
      internalSignedAt:  new Date(),
    },
  })
  revalidatePath(`/workspace/${workspaceId}/contracts/${contractId}`)
}

export async function sendContractToClient(
  contractId:  string,
  workspaceId: string,
  clientName:  string,
  clientEmail: string,
): Promise<void> {
  const user = await getAuthUser()
  const contract = await db.contract.findFirst({
    where:  { id: contractId, workspaceId },
    select: { id: true, title: true, shareToken: true, internalSignedAt: true, status: true },
  })
  if (!contract) throw new Error('Contract not found')
  if (!contract.internalSignedAt) throw new Error('Internal signature required before sending')
  if (contract.status !== 'DRAFT') throw new Error('Contract already sent')

  await db.contract.updateMany({
    where: { id: contractId, workspaceId },
    data:  { clientName, clientEmail, status: 'SENT' },
  })

  const workspace = await db.workspace.findUnique({
    where:  { id: workspaceId },
    select: { name: true },
  })

  const { sendContractInviteEmail } = await import('@/lib/email')
  await sendContractInviteEmail({
    to:           clientEmail,
    clientName,
    workspaceName: workspace?.name ?? 'MITIKUS',
    contractTitle: contract.title,
    signUrl:      `https://www.mitikus.com/contracts/sign/${contract.shareToken}`,
  })

  revalidatePath(`/workspace/${workspaceId}/contracts`)
  revalidatePath(`/workspace/${workspaceId}/contracts/${contractId}`)
}

export async function deleteContract(
  contractId:  string,
  workspaceId: string,
): Promise<void> {
  await getAuthUser()
  await db.contract.deleteMany({ where: { id: contractId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/contracts`)
}

// Acción pública — sin auth, usa shareToken
export async function getContractByToken(shareToken: string): Promise<{
  id:         string
  title:      string
  status:     'DRAFT' | 'SENT' | 'SIGNED'
  clientName: string
  pdfDataArray: number[]
} | null> {
  const c = await db.contract.findUnique({
    where:  { shareToken },
    select: { id: true, title: true, status: true, clientName: true, pdfData: true },
  })
  if (!c) return null
  return {
    id:           c.id,
    title:        c.title,
    status:       c.status,
    clientName:   c.clientName,
    pdfDataArray: Array.from(c.pdfData),
  }
}

// Acción pública — sin auth
export async function signClientContract(
  shareToken:  string,
  dataUrl:     string,
  accepted:    boolean,
  clientIp:    string,
): Promise<void> {
  const contract = await db.contract.findUnique({
    where:  { shareToken },
    select: {
      id:          true,
      title:       true,
      clientEmail: true,
      clientName:  true,
      status:      true,
      workspaceId: true,
      createdBy:   true,
      creator:     { select: { email: true, name: true } },
    },
  })
  if (!contract) throw new Error('Contract not found')
  if (contract.status !== 'SENT') throw new Error('Contract is not in SENT state')

  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid signature data URL')
  const buffer = Buffer.from(base64, 'base64')

  await db.contract.update({
    where: { shareToken },
    data:  {
      clientSignature: buffer,
      clientAccepted:  accepted,
      clientSignedAt:  new Date(),
      clientIp,
      status:          'SIGNED',
    },
  })

  // Generar PDF firmado via API route interna
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'
  const pdfRes  = await fetch(`${baseUrl}/api/contracts/${contract.id}/sign-pdf`, {
    headers: { 'x-internal-secret': process.env.INTERNAL_SECRET ?? '' },
  })
  if (pdfRes.ok) {
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())
    await db.contract.update({
      where: { shareToken },
      data:  { signedPdfData: pdfBuffer },
    })

    const { sendContractSignedEmail } = await import('@/lib/email')
    const pdfBase64 = pdfBuffer.toString('base64')
    await Promise.all([
      sendContractSignedEmail({
        to:            contract.creator.email,
        contractTitle: contract.title,
        pdfBase64,
      }),
      sendContractSignedEmail({
        to:            contract.clientEmail,
        contractTitle: contract.title,
        pdfBase64,
      }),
    ])
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-String "contracts" | Select-Object -First 15
```

Expected: sin errores relativos a contracts (puede haber otros pre-existentes que no son nuestros).

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/app/actions/contracts.ts
git commit -m "feat: add contracts server actions"
```

---

### Task 3: Funciones de email para contratos

**Files:**
- Modify: `apps/web/src/lib/email.ts`

- [ ] **Step 1: Añadir las dos funciones al final del archivo `apps/web/src/lib/email.ts`**

```typescript
export async function sendContractInviteEmail({
  to,
  clientName,
  workspaceName,
  contractTitle,
  signUrl,
}: {
  to:            string
  clientName:    string
  workspaceName: string
  contractTitle: string
  signUrl:       string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    'MITIKUS <noreply@mitikus.com>',
    to,
    subject: `${workspaceName} te envía un contrato para firmar`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="font-size:15px;color:#111">Hola <strong>${clientName}</strong>,</p>
        <p style="font-size:15px;color:#111"><strong>${workspaceName}</strong> te ha enviado el siguiente contrato para que lo revises y firmes:</p>
        <div style="margin:16px 0;padding:12px 16px;background:#f5f5f5;border-radius:8px;font-size:15px;color:#111">
          ${contractTitle}
        </div>
        <a href="${signUrl}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Ver y firmar contrato
        </a>
        <p style="margin-top:24px;font-size:12px;color:#888">MITIKUS · <a href="https://mitikus.com" style="color:#888">mitikus.com</a></p>
      </div>
    `,
  })
}

export async function sendContractSignedEmail({
  to,
  contractTitle,
  pdfBase64,
}: {
  to:            string
  contractTitle: string
  pdfBase64:     string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:        'MITIKUS <noreply@mitikus.com>',
    to,
    subject:     `Contrato firmado — ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="font-size:15px;color:#111">El contrato <strong>${contractTitle}</strong> ha sido firmado por ambas partes.</p>
        <p style="font-size:14px;color:#555">Encontrarás el PDF firmado adjunto a este email.</p>
        <p style="margin-top:24px;font-size:12px;color:#888">MITIKUS · <a href="https://mitikus.com" style="color:#888">mitikus.com</a></p>
      </div>
    `,
    attachments: [
      {
        filename:    `${contractTitle}.pdf`,
        content:     pdfBase64,
        contentType: 'application/pdf',
      },
    ],
  })
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/lib/email.ts
git commit -m "feat: add contract email functions"
```

---

### Task 4: API route upload de contrato

**Files:**
- Create: `apps/web/src/app/api/contracts/upload/route.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/app/api/contracts/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file        = formData.get('file') as File | null
  const workspaceId = formData.get('workspaceId') as string | null

  if (!file || !workspaceId) {
    return NextResponse.json({ error: 'Missing file or workspaceId' }, { status: 400 })
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo se admiten archivos PDF' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'El archivo supera el límite de 10 MB' }, { status: 400 })
  }

  const workspace = await db.workspace.findFirst({
    where:  { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  const title = file.name
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .trim() || 'Contrato sin título'

  const contract = await db.contract.create({
    data: {
      workspaceId,
      title,
      pdfData:   buffer,
      createdBy: user.id,
    },
  })

  return NextResponse.json({ id: contract.id, title: contract.title })
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/api/contracts/upload/route.ts"
git commit -m "feat: add contract upload API route"
```

---

### Task 5: API route generación PDF firmado

**Files:**
- Create: `apps/web/src/app/api/contracts/[contractId]/sign-pdf/route.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/app/api/contracts/[contractId]/sign-pdf/route.ts
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
  signPage.drawText(contract.clientName || '—', {
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
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/api/contracts/[contractId]/sign-pdf/route.ts"
git commit -m "feat: add sign-pdf API route using pdf-lib"
```

---

### Task 6: Componente SignatureCanvas

**Files:**
- Create: `apps/web/src/components/signature-canvas.tsx`

El componente se coloca en `src/components/` (compartido) porque lo usan tanto el visor interno como la página pública.

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/components/signature-canvas.tsx
'use client'

import { useRef, useState } from 'react'
import SignatureCanvasLib from 'react-signature-canvas'

interface Props {
  onSave:              (dataUrl: string) => void
  disabled?:           boolean
  existingSignature?:  string | null // data URL o null
  label?:              string
}

export function SignatureCanvas({ onSave, disabled, existingSignature, label }: Props) {
  const canvasRef = useRef<SignatureCanvasLib>(null)
  const [accepted, setAccepted] = useState(false)
  const [isEmpty, setIsEmpty]   = useState(true)

  function handleClear() {
    canvasRef.current?.clear()
    setIsEmpty(true)
  }

  function handleSave() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return
    const dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL('image/png')
    onSave(dataUrl)
  }

  if (existingSignature) {
    return (
      <div className="space-y-2">
        {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>}
        <img
          src={existingSignature}
          alt="Firma guardada"
          className="border border-border rounded-md max-h-20 bg-white"
        />
        <p className="text-xs text-green-600 font-medium">✓ Firmado</p>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>}
        <div className="border border-dashed border-border rounded-md h-20 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Pendiente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>}
      <div className="border border-border rounded-md overflow-hidden bg-white">
        <SignatureCanvasLib
          ref={canvasRef}
          penColor="#1a1a1a"
          canvasProps={{ width: 240, height: 80, className: 'w-full' }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="rounded"
          />
          Acepto los términos
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty || !accepted}
          className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          Guardar firma
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/components/signature-canvas.tsx"
git commit -m "feat: add SignatureCanvas shared component"
```

---

### Task 7: ContractUploadZone + ContractList

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractUploadZone.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractList.tsx`

- [ ] **Step 1: Crear ContractUploadZone.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractUploadZone.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  workspaceId: string
}

export function ContractUploadZone({ workspaceId }: Props) {
  const [isDragging, setIsDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se admiten archivos PDF (.pdf)')
      return
    }
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceId', workspaceId)

    try {
      const res  = await fetch('/api/contracts/upload', { method: 'POST', body: formData })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Error al subir el contrato')
        return
      }
      router.push(`/workspace/${workspaceId}/contracts/${data.id}`)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          aria-label="Seleccionar PDF de contrato"
        />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">Subiendo contrato...</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrastra un <span className="font-medium">.pdf</span> aquí o{' '}
            <span className="text-primary hover:underline">elige archivo</span>
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Crear ContractList.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractList.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContractData } from '@/app/actions/contracts'
import { ContractUploadZone } from './ContractUploadZone'

interface Props {
  workspaceId: string
  initial:     ContractData[]
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:  'BORRADOR',
  SENT:   'ENVIADO',
  SIGNED: 'FIRMADO',
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT:  'bg-secondary text-secondary-foreground',
  SENT:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  SIGNED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

export function ContractList({ workspaceId, initial }: Props) {
  const [contracts, setContracts] = useState(initial)

  return (
    <div className="space-y-6">
      <ContractUploadZone workspaceId={workspaceId} />

      {contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aún no hay contratos</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/workspace/${workspaceId}/contracts/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {c.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(c.createdAt).toLocaleDateString('es-ES')}
                  {c.clientName ? ` · ${c.clientName}` : ''}
                  {c.clientEmail ? ` · ${c.clientEmail}` : ''}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-3 ${STATUS_CLASS[c.status] ?? ''}`}>
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/"
git commit -m "feat: add ContractUploadZone and ContractList components"
```

---

### Task 8: Página listado `/contracts`

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/page.tsx`

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/page.tsx
import { requireUser } from '@/lib/auth'
import { getContracts } from '@/app/actions/contracts'
import { ContractList } from './_components/ContractList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ContractsPage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const contracts = await getContracts(workspaceId)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contratos</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}
        </p>
      </div>
      <ContractList workspaceId={workspaceId} initial={contracts} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/page.tsx"
git commit -m "feat: add contracts list page"
```

---

### Task 9: SendToClientModal + ContractViewerClient

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/SendToClientModal.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/ContractViewerClient.tsx`

- [ ] **Step 1: Crear SendToClientModal.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/SendToClientModal.tsx
'use client'

import { useState } from 'react'

interface Props {
  onSend:  (clientName: string, clientEmail: string) => Promise<void>
  onClose: () => void
}

export function SendToClientModal({ onSend, onClose }: Props) {
  const [clientName,  setClientName]  = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isSending,   setIsSending]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Nombre y email son obligatorios')
      return
    }
    setIsSending(true)
    setError(null)
    try {
      await onSend(clientName.trim(), clientEmail.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h2 className="text-base font-semibold">Enviar al cliente</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Nombre del cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ana García"
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email del cliente</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="ana@empresa.com"
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSending ? 'Enviando...' : 'Enviar →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear ContractViewerClient.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/ContractViewerClient.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { ContractDetail } from '@/app/actions/contracts'
import { signInternalContract, sendContractToClient } from '@/app/actions/contracts'
import { SignatureCanvas } from '@/components/signature-canvas'
import { SendToClientModal } from './SendToClientModal'

const Document = dynamic(() => import('react-pdf').then((m) => m.Document), { ssr: false })
const Page     = dynamic(() => import('react-pdf').then((m) => m.Page),     { ssr: false })

const STATUS_LABEL: Record<string, string> = {
  DRAFT:  'BORRADOR',
  SENT:   'ENVIADO',
  SIGNED: 'FIRMADO',
}
const STATUS_CLASS: Record<string, string> = {
  DRAFT:  'bg-secondary text-secondary-foreground',
  SENT:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  SIGNED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

interface Props {
  contract:    ContractDetail
  workspaceId: string
}

export function ContractViewerClient({ contract, workspaceId }: Props) {
  const router = useRouter()
  const [numPages,       setNumPages]       = useState<number | null>(null)
  const [pageNumber,     setPageNumber]     = useState(1)
  const [showSendModal,  setShowSendModal]  = useState(false)
  const [isSaving,       setIsSaving]       = useState(false)

  const pdfData = new Uint8Array(contract.pdfDataArray)

  const internalSigUrl = contract.internalSignatureArray
    ? `data:image/png;base64,${Buffer.from(contract.internalSignatureArray).toString('base64')}`
    : null
  const clientSigUrl = contract.clientSignatureArray
    ? `data:image/png;base64,${Buffer.from(contract.clientSignatureArray).toString('base64')}`
    : null

  async function handleSaveInternalSignature(dataUrl: string) {
    setIsSaving(true)
    try {
      await signInternalContract(contract.id, workspaceId, dataUrl, true)
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSend(clientName: string, clientEmail: string) {
    await sendContractToClient(contract.id, workspaceId, clientName, clientEmail)
    router.refresh()
  }

  const canSend = contract.status === 'DRAFT' && !!contract.internalSignedAt

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold truncate">{contract.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_CLASS[contract.status] ?? ''}`}>
            {STATUS_LABEL[contract.status] ?? contract.status}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {contract.status === 'SIGNED' && (
            <a
              href={`/api/contracts/${contract.id}/sign-pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              ↓ PDF firmado
            </a>
          )}
          {canSend && (
            <button
              onClick={() => setShowSendModal(true)}
              className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enviar al cliente →
            </button>
          )}
        </div>
      </div>

      {/* Main: PDF + panel firmas */}
      <div className="flex gap-4 items-start">
        {/* PDF viewer */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="text-sm disabled:opacity-40"
            >
              ←
            </button>
            <span className="text-xs text-muted-foreground">
              {pageNumber} / {numPages ?? '—'}
            </span>
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages ?? p, p + 1))}
              disabled={pageNumber >= (numPages ?? 1)}
              className="text-sm disabled:opacity-40"
            >
              →
            </button>
          </div>
          <div className="border border-border rounded-lg overflow-hidden flex justify-center bg-muted/20">
            <Document
              file={{ data: pdfData }}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            >
              <Page pageNumber={pageNumber} width={600} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          </div>
        </div>

        {/* Panel firmas */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Firma interna */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tu firma</p>
            {isSaving ? (
              <p className="text-xs text-muted-foreground">Guardando...</p>
            ) : (
              <SignatureCanvas
                onSave={handleSaveInternalSignature}
                existingSignature={internalSigUrl}
                disabled={!!contract.internalSignedAt}
              />
            )}
            {contract.internalSignedAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(contract.internalSignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Firma cliente */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Firma cliente</p>
            {contract.status === 'DRAFT' && (
              <p className="text-xs text-muted-foreground">Pendiente de envío</p>
            )}
            {contract.status === 'SENT' && (
              <p className="text-xs text-muted-foreground">
                Enviado a <span className="font-medium">{contract.clientEmail}</span>, pendiente de firma
              </p>
            )}
            {contract.status === 'SIGNED' && (
              <>
                <SignatureCanvas
                  onSave={() => {}}
                  existingSignature={clientSigUrl}
                  disabled
                />
                {contract.clientSignedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(contract.clientSignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showSendModal && (
        <SendToClientModal
          onSend={handleSend}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/"
git commit -m "feat: add SendToClientModal and ContractViewerClient"
```

---

### Task 10: Página visor interno `/contracts/[contractId]`

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/page.tsx`

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/page.tsx
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getContract } from '@/app/actions/contracts'
import { ContractViewerClient } from './_components/ContractViewerClient'

interface Props {
  params: Promise<{ workspaceId: string; contractId: string }>
}

export default async function ContractPage({ params }: Props) {
  const [{ workspaceId, contractId }, user] = await Promise.all([params, requireUser()])
  const contract = await getContract(contractId, workspaceId)
  if (!contract) notFound()

  return <ContractViewerClient contract={contract} workspaceId={workspaceId} />
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/page.tsx"
git commit -m "feat: add contract viewer page"
```

---

### Task 11: Página pública de firma `/contracts/sign/[token]`

**Files:**
- Create: `apps/web/src/app/contracts/sign/[token]/page.tsx`
- Create: `apps/web/src/app/contracts/sign/[token]/_components/PublicSignClient.tsx`

- [ ] **Step 1: Crear PublicSignClient.tsx**

```typescript
// apps/web/src/app/contracts/sign/[token]/_components/PublicSignClient.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { signClientContract } from '@/app/actions/contracts'
import { SignatureCanvas } from '@/components/signature-canvas'

const Document = dynamic(() => import('react-pdf').then((m) => m.Document), { ssr: false })
const Page     = dynamic(() => import('react-pdf').then((m) => m.Page),     { ssr: false })

interface Props {
  shareToken:   string
  title:        string
  pdfDataArray: number[]
}

export function PublicSignClient({ shareToken, title, pdfDataArray }: Props) {
  const [numPages,   setNumPages]   = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [isSigning,  setIsSigning]  = useState(false)
  const [signed,     setSigned]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const pdfData = new Uint8Array(pdfDataArray)

  async function handleSave(dataUrl: string) {
    setIsSigning(true)
    setError(null)
    try {
      await signClientContract(shareToken, dataUrl, true, '')
      setSigned(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al firmar')
    } finally {
      setIsSigning(false)
    }
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-semibold">Contrato firmado</h2>
          <p className="text-sm text-muted-foreground">
            Has firmado <strong>{title}</strong>. Recibirás una copia por email cuando ambas partes hayan firmado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header público */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-label="MITIKUS">
          <defs>
            <linearGradient id="mg" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFD040"/><stop offset="50%" stopColor="#FF2878"/><stop offset="100%" stopColor="#1820B8"/>
            </linearGradient>
            <clipPath id="mc"><circle cx="100" cy="100" r="87"/></clipPath>
          </defs>
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#mg)" strokeWidth="5.5"/>
          <g clipPath="url(#mc)">
            <polygon points="-10,0 192,95 192,100 -10,98" fill="url(#mg)"/>
            <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#mg)"/>
          </g>
        </svg>
        <span className="text-sm text-muted-foreground">MITIKUS · Contrato para firmar</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold mb-6">{title}</h1>

        <div className="flex gap-6 items-start flex-wrap">
          {/* PDF */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="text-sm disabled:opacity-40"
              >←</button>
              <span className="text-xs text-muted-foreground">{pageNumber} / {numPages ?? '—'}</span>
              <button
                onClick={() => setPageNumber((p) => Math.min(numPages ?? p, p + 1))}
                disabled={pageNumber >= (numPages ?? 1)}
                className="text-sm disabled:opacity-40"
              >→</button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden flex justify-center bg-muted/20">
              <Document
                file={{ data: pdfData }}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              >
                <Page pageNumber={pageNumber} width={560} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          </div>

          {/* Panel firma */}
          <div className="w-64 shrink-0 border border-border rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold">Tu firma</h2>
            {isSigning ? (
              <p className="text-xs text-muted-foreground">Procesando firma...</p>
            ) : (
              <SignatureCanvas onSave={handleSave} />
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              Al firmar quedará registrado tu nombre, IP y timestamp como prueba de aceptación.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear la página Server Component**

```typescript
// apps/web/src/app/contracts/sign/[token]/page.tsx
import { getContractByToken } from '@/app/actions/contracts'
import { PublicSignClient } from './_components/PublicSignClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicSignPage({ params }: Props) {
  const { token } = await params
  const contract  = await getContractByToken(token)

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold">Contrato no encontrado</h1>
          <p className="text-sm text-muted-foreground">El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    )
  }

  if (contract.status === 'SIGNED') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h1 className="text-lg font-semibold">Contrato ya firmado</h1>
          <p className="text-sm text-muted-foreground">Este contrato ya ha sido firmado por ambas partes.</p>
        </div>
      </div>
    )
  }

  if (contract.status === 'DRAFT') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold">Contrato no disponible</h1>
          <p className="text-sm text-muted-foreground">Este contrato aún no ha sido enviado para firma.</p>
        </div>
      </div>
    )
  }

  return (
    <PublicSignClient
      shareToken={token}
      title={contract.title}
      pdfDataArray={contract.pdfDataArray}
    />
  )
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/contracts/"
git commit -m "feat: add public contract signing page"
```

---

### Task 12: Integración Mi Office (icono + card + topbar)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx`

- [ ] **Step 1: Añadir icono `contracts` a WorkspaceIcons.tsx**

En el objeto `Icons`, justo antes del cierre `}`, añade:

```tsx
  contracts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
```

- [ ] **Step 2: Añadir `/contracts` a SECTION_LABELS en WorkspaceTopbar.tsx**

Localiza el array `SECTION_LABELS` y añade esta línea junto a las demás:

```typescript
  { segment: '/contracts', label: 'Contratos' },
```

- [ ] **Step 3: Añadir card Contratos en office/page.tsx**

Lee el archivo actual y añade el cuarto objeto al array `TOOLS`:

```typescript
  {
    href:     (base: string) => `${base}/contracts`,
    emoji:    '📝',
    title:    'Contratos',
    subtitle: 'Firma y gestiona contratos con clientes',
  },
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx"
git commit -m "feat: add Contratos card to Mi Office hub"
```

---

### Task 13: TypeScript check + build + deploy

**Files:** ninguno

- [ ] **Step 1: TypeScript check completo**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 30
```

Expected: sin errores nuevos (puede haber pre-existentes no relacionados con contratos).

- [ ] **Step 2: Build**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx next build 2>&1 | Select-Object -Last 15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub
npx vercel --prod --scope mitikus 2>&1 | Select-Object -Last 8
```

Expected: `"message": "Deployment ... ready."`

- [ ] **Step 4: Verificación manual**

1. Ir a Mi Office → debe aparecer card "Contratos 📝"
2. Hacer clic → listado de contratos (vacío)
3. Subir un PDF → redirige al visor
4. Firmar internamente con canvas → guardar firma → aparece imagen
5. Clic "Enviar al cliente →" → modal nombre/email → confirmar → estado cambia a ENVIADO
6. Abrir el link `/contracts/sign/[token]` → visor PDF + canvas firma
7. Firmar → estado cambia a FIRMADO + emails enviados
