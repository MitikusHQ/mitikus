'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface ReceiptItem {
  description: string
  qty:         number
  unitPrice:   number
  total:       number
}

export interface ReceiptData {
  id:         string
  vendor:     string | null
  date:       string | null   // ISO string
  total:      number | null
  subtotal:   number | null
  tax:        number | null
  taxRate:    number | null
  currency:   string
  items:      ReceiptItem[]
  category:   string | null
  notes:      string | null
  status:     string
  imageData:  string | null
  createdAt:  string
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getReceipts(workspaceId: string): Promise<ReceiptData[]> {
  await getAuthUser()
  const rows = await db.receipt.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => ({
    id:        r.id,
    vendor:    r.vendor,
    date:      r.date?.toISOString() ?? null,
    total:     r.total,
    subtotal:  r.subtotal,
    tax:       r.tax,
    taxRate:   r.taxRate,
    currency:  r.currency,
    items:     (r.items as unknown as ReceiptItem[]) ?? [],
    category:  r.category,
    notes:     r.notes,
    status:    r.status,
    imageData: r.imageData,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function createReceipt(
  workspaceId: string,
  data: Omit<ReceiptData, 'id' | 'createdAt'>,
): Promise<ReceiptData> {
  await getAuthUser()
  const r = await db.receipt.create({
    data: {
      workspaceId,
      imageData: data.imageData ?? null,
      vendor:    data.vendor ?? null,
      date:      data.date ? new Date(data.date) : null,
      total:     data.total ?? null,
      subtotal:  data.subtotal ?? null,
      tax:       data.tax ?? null,
      taxRate:   data.taxRate ?? null,
      currency:  data.currency,
      items:     (data.items ?? []) as object[],
      category:  data.category ?? null,
      notes:     data.notes ?? null,
      status:    data.status ?? 'pendiente',
    },
  })
  revalidatePath(`/workspace/${workspaceId}/receipts`)
  return {
    id:        r.id,
    vendor:    r.vendor,
    date:      r.date?.toISOString() ?? null,
    total:     r.total,
    subtotal:  r.subtotal,
    tax:       r.tax,
    taxRate:   r.taxRate,
    currency:  r.currency,
    items:     (r.items as unknown as ReceiptItem[]) ?? [],
    category:  r.category,
    notes:     r.notes,
    status:    r.status,
    imageData: r.imageData,
    createdAt: r.createdAt.toISOString(),
  }
}

export async function updateReceiptStatus(
  workspaceId: string,
  receiptId: string,
  status: string,
): Promise<void> {
  await getAuthUser()
  await db.receipt.updateMany({
    where: { id: receiptId, workspaceId },
    data:  { status },
  })
  revalidatePath(`/workspace/${workspaceId}/receipts`)
}

export async function deleteReceipt(workspaceId: string, receiptId: string): Promise<void> {
  await getAuthUser()
  await db.receipt.deleteMany({ where: { id: receiptId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/receipts`)
}
