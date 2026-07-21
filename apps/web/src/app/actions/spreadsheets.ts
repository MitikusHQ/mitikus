'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface SpreadsheetData {
  id:           string
  title:        string
  category:     string | null
  sheetCount:   number
  createdAt:    string
  uploaderName: string | null
}

export interface SpreadsheetDetail extends SpreadsheetData {
  data: object[]
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getSpreadsheets(workspaceId: string): Promise<SpreadsheetData[]> {
  await getAuthUser()
  const sheets = await db.spreadsheet.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      category:  true,
      data:      true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  return sheets.map((s) => ({
    id:           s.id,
    title:        s.title,
    category:     s.category,
    sheetCount:   Array.isArray(s.data) ? (s.data as object[]).length : 1,
    createdAt:    s.createdAt.toISOString(),
    uploaderName: s.uploader.name,
  }))
}

export async function getSpreadsheet(
  sheetId: string,
  workspaceId: string,
): Promise<SpreadsheetDetail | null> {
  await getAuthUser()
  const sheet = await db.spreadsheet.findFirst({
    where:  { id: sheetId, workspaceId },
    select: {
      id:        true,
      title:     true,
      category:  true,
      data:      true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  if (!sheet) return null

  const data = Array.isArray(sheet.data) ? (sheet.data as object[]) : []

  return {
    id:           sheet.id,
    title:        sheet.title,
    category:     sheet.category,
    sheetCount:   data.length,
    data,
    createdAt:    sheet.createdAt.toISOString(),
    uploaderName: sheet.uploader.name,
  }
}

export async function createSpreadsheet(
  workspaceId: string,
  input: { title: string; data: object[]; rawText: string },
): Promise<string> {
  const user = await getAuthUser()
  const sheet = await db.spreadsheet.create({
    data: {
      workspaceId,
      title:      input.title.trim() || 'Sin título',
      data:       input.data,
      rawText:    input.rawText,
      uploadedBy: user.id,
    },
  })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
  return sheet.id
}

export async function updateSpreadsheetContent(
  sheetId: string,
  workspaceId: string,
  input: { data: object[]; rawText: string },
): Promise<void> {
  await getAuthUser()
  await db.spreadsheet.updateMany({
    where: { id: sheetId, workspaceId },
    data:  { data: input.data, rawText: input.rawText },
  })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
  revalidatePath(`/workspace/${workspaceId}/sheets/${sheetId}`)
}

export async function updateSpreadsheetMeta(
  sheetId: string,
  workspaceId: string,
  input: { title: string; category: string | null },
): Promise<void> {
  await getAuthUser()
  await db.spreadsheet.updateMany({
    where: { id: sheetId, workspaceId },
    data:  { title: input.title.trim() || 'Sin título', category: input.category || null },
  })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
  revalidatePath(`/workspace/${workspaceId}/sheets/${sheetId}`)
}

export async function deleteSpreadsheet(
  sheetId: string,
  workspaceId: string,
): Promise<void> {
  await getAuthUser()
  await db.spreadsheet.deleteMany({ where: { id: sheetId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
}
