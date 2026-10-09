'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export interface ClientSummary {
  id:          string
  name:        string
  email:       string | null
  taxId:       string | null
  contactName: string | null
}

export async function searchClients(
  workspaceId: string,
  query: string,
): Promise<ClientSummary[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  return db.client.findMany({
    where: {
      workspaceId,
      isArchived: false,
      OR: [
        { name:        { contains: query, mode: 'insensitive' } },
        { email:       { contains: query, mode: 'insensitive' } },
        { taxId:       { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
    take: 10,
    select: { id: true, name: true, email: true, taxId: true, contactName: true },
  })
}

export async function createClientQuick(
  workspaceId: string,
  data: { name: string; email?: string; taxId?: string },
): Promise<ClientSummary> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  return db.client.create({
    data: {
      workspaceId,
      name:  data.name.trim(),
      email: data.email?.trim() || null,
      taxId: data.taxId?.trim().toUpperCase() || null,
    },
    select: { id: true, name: true, email: true, taxId: true, contactName: true },
  })
}
