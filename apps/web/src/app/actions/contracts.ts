'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface ContractData {
  id:               string
  title:            string
  status:           'DRAFT' | 'SENT' | 'SIGNED'
  clientName:       string | null
  clientEmail:      string | null
  internalAccepted: boolean
  internalSignedAt: string | null
  clientAccepted:   boolean
  clientSignedAt:   string | null
  createdAt:        string
  creatorName:      string | null
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
  await getAuthUser()
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
    to:            clientEmail,
    clientName,
    workspaceName: workspace?.name ?? 'MITIKUS',
    contractTitle: contract.title,
    signUrl:       `https://www.mitikus.com/contracts/sign/${contract.shareToken}`,
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

export async function getContractByToken(shareToken: string): Promise<{
  id:           string
  title:        string
  status:       'DRAFT' | 'SENT' | 'SIGNED'
  clientName:   string | null
  creatorName:  string | null
  pdfDataArray: number[]
} | null> {
  const c = await db.contract.findUnique({
    where:  { shareToken },
    select: { id: true, title: true, status: true, clientName: true, pdfData: true, creator: { select: { name: true } } },
  })
  if (!c) return null
  return {
    id:           c.id,
    title:        c.title,
    status:       c.status,
    clientName:   c.clientName,
    creatorName:  c.creator.name,
    pdfDataArray: Array.from(c.pdfData),
  }
}

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
  try {
    const pdfRes = await fetch(`${baseUrl}/api/contracts/${contract.id}/sign-pdf`, {
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
      const emailTargets: string[] = [contract.creator.email]
      if (contract.clientEmail) emailTargets.push(contract.clientEmail)
      await Promise.all(
        emailTargets.map((to) =>
          sendContractSignedEmail({ to, contractTitle: contract.title, pdfBase64 })
        )
      )
    }
  } catch {
    // El PDF firmado puede generarse luego; el estado SIGNED ya está guardado
  }
}
