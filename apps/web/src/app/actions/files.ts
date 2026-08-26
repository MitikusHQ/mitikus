'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { assertCan } from '@/lib/permissions'

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

async function assertWorkspace(workspaceId: string, orgId: string) {
  const ws = await db.workspace.findFirst({ where: { id: workspaceId, orgId } })
  if (!ws) throw new Error('Workspace not found')
  return ws
}

async function getAuthUserCanManage() {
  const user = await getAuthUser()
  assertCan(user, 'manage_files')
  return user
}

async function getAuthUserCanDelete() {
  const user = await getAuthUser()
  assertCan(user, 'delete_file')
  return user
}

// ── CARPETAS ──────────────────────────────────────────────

export interface FolderData {
  id: string
  name: string
  parentId: string | null
  children: FolderData[]
}

export async function getFolderTree(workspaceId: string): Promise<FolderData[]> {
  await getAuthUser()
  const folders = await db.folder.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, parentId: true },
  })
  return buildTree(folders, null)
}

function buildTree(
  folders: { id: string; name: string; parentId: string | null }[],
  parentId: string | null,
): FolderData[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({ ...f, children: buildTree(folders, f.id) }))
}

export async function createFolder(workspaceId: string, name: string, parentId: string | null) {
  const user = await getAuthUserCanManage()
  await assertWorkspace(workspaceId, user.orgId)
  const folder = await db.folder.create({
    data: { workspaceId, name: name.trim(), parentId },
  })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
  return folder
}

export async function renameFolder(workspaceId: string, folderId: string, name: string) {
  const user = await getAuthUserCanManage()
  await assertWorkspace(workspaceId, user.orgId)
  await db.folder.update({ where: { id: folderId }, data: { name: name.trim() } })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}

export async function deleteFolder(workspaceId: string, folderId: string) {
  const user = await getAuthUserCanDelete()
  await assertWorkspace(workspaceId, user.orgId)
  const files = await db.workspaceFile.findMany({ where: { folderId } })
  await Promise.all(files.map((f) => del(f.url).catch(() => {})))
  await db.folder.delete({ where: { id: folderId } })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}

// ── ARCHIVOS ──────────────────────────────────────────────

export interface FileData {
  id: string
  name: string
  type: 'DOC' | 'SHEET' | 'PDF' | 'IMAGE' | 'OTHER'
  url: string
  size: number
  mimeType: string
  folderId: string | null
  clientId: string | null
  createdAt: string
}

export async function getFiles(workspaceId: string, folderId: string | null): Promise<FileData[]> {
  await getAuthUser()
  const files = await db.workspaceFile.findMany({
    where: { workspaceId, folderId: folderId ?? null },
    orderBy: { createdAt: 'desc' },
  })
  return files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))
}

export async function moveFile(workspaceId: string, fileId: string, targetFolderId: string | null) {
  const user = await getAuthUserCanManage()
  await assertWorkspace(workspaceId, user.orgId)
  await db.workspaceFile.update({
    where: { id: fileId },
    data: { folderId: targetFolderId },
  })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}

export async function deleteFile(workspaceId: string, fileId: string) {
  const user = await getAuthUserCanDelete()
  await assertWorkspace(workspaceId, user.orgId)
  const file = await db.workspaceFile.findFirst({ where: { id: fileId, workspaceId } })
  if (!file) throw new Error('File not found')
  await del(file.url).catch(() => {})
  await db.workspaceFile.delete({ where: { id: fileId } })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}
