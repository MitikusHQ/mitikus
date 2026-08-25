'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import { FolderTree } from './FolderTree'
import { FilePanel } from './FilePanel'
import { UploadZone } from './UploadZone'
import { NewFolderModal } from './NewFolderModal'
import { MoveFileModal } from './MoveFileModal'
import { getFiles, type FolderData, type FileData } from '@/app/actions/files'

interface Props {
  workspaceId: string
  initialFolders: FolderData[]
  initialFiles: FileData[]
  usedBytes: number
  limitGB: number
}

function findFolderName(folders: FolderData[], id: string): string | null {
  for (const f of folders) {
    if (f.id === id) return f.name
    const child = findFolderName(f.children, id)
    if (child) return child
  }
  return null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function FilesClient({ workspaceId, initialFolders, initialFiles, usedBytes, limitGB }: Props) {
  const [folders] = useState<FolderData[]>(initialFolders)
  const [files, setFiles] = useState<FileData[]>(initialFiles)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  // undefined = modal cerrado; null | string = modal abierto con ese parentId
  const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined)
  const [moveFileId, setMoveFileId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)
  const exportLinkRef = useRef<HTMLAnchorElement>(null)

  const refresh = useCallback(() => {
    startTransition(async () => {
      const fresh = await getFiles(workspaceId, activeFolderId)
      setFiles(fresh)
    })
  }, [workspaceId, activeFolderId])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/files/export`)
      if (!res.ok) { setIsExporting(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = exportLinkRef.current
      if (a) {
        a.href = url
        a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'archivos.zip'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
    } finally {
      setIsExporting(false)
    }
  }, [workspaceId])

  const handleSelectFolder = useCallback(async (folderId: string | null) => {
    setActiveFolderId(folderId)
    const fresh = await getFiles(workspaceId, folderId)
    setFiles(fresh)
  }, [workspaceId])

  const breadcrumb = activeFolderId === null
    ? 'Raíz'
    : (findFolderName(folders, activeFolderId) ?? 'Raíz')

  const limitBytes = limitGB * 1024 * 1024 * 1024
  const usedPct = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0
  const isNearLimit = usedPct >= 80
  const isAtLimit = usedPct >= 100

  return (
    <div className="flex flex-1 overflow-hidden">
      <FolderTree
        folders={folders}
        activeFolderId={activeFolderId}
        onSelect={handleSelectFolder}
        onNewFolder={(parentId) => setNewFolderParentId(parentId)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {breadcrumb}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
              title="Descargar todos los archivos como ZIP"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {isExporting ? 'Preparando…' : 'Descargar ZIP'}
            </button>
            <button
              type="button"
              onClick={() => setNewFolderParentId(activeFolderId)}
              className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              Nueva carpeta
            </button>
          </div>
          {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
          <a ref={exportLinkRef} className="hidden" aria-hidden />
        </div>

        {/* Upload zone */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <UploadZone workspaceId={workspaceId} folderId={activeFolderId} onUploaded={refresh} />
        </div>

        {/* Storage bar */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              Almacenamiento: <span className={isNearLimit ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>{formatBytes(usedBytes)}</span>
              {' '}/ {limitGB >= Number.MAX_SAFE_INTEGER ? '∞' : `${limitGB} GB`}
            </span>
            {isAtLimit && (
              <span className="text-xs font-medium text-destructive">Límite alcanzado</span>
            )}
            {isNearLimit && !isAtLimit && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Casi lleno</span>
            )}
          </div>
          {limitGB < Number.MAX_SAFE_INTEGER && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          )}
        </div>

        {/* File list */}
        <FilePanel
          workspaceId={workspaceId}
          files={files}
          folders={folders}
          onRequestMove={(fileId) => setMoveFileId(fileId)}
          onRefresh={refresh}
        />
      </div>

      {/* Modals */}
      {newFolderParentId !== undefined && (
        <NewFolderModal
          workspaceId={workspaceId}
          parentId={newFolderParentId}
          onCreated={() => window.location.reload()}
          onClose={() => setNewFolderParentId(undefined)}
        />
      )}
      {moveFileId && (
        <MoveFileModal
          workspaceId={workspaceId}
          fileId={moveFileId}
          folders={folders}
          onMoved={refresh}
          onClose={() => setMoveFileId(null)}
        />
      )}
    </div>
  )
}
