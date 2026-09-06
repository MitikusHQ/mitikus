'use client'

import { useState } from 'react'
import { moveFile, type FolderData } from '@/app/actions/files'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  workspaceId: string
  fileId: string
  folders: FolderData[]
  onMoved: () => void
  onClose: () => void
  locale: Locale
}

function flattenFolders(folders: FolderData[], depth = 0): { id: string; name: string; depth: number }[] {
  return folders.flatMap((f) => [{ id: f.id, name: f.name, depth }, ...flattenFolders(f.children, depth + 1)])
}

export function MoveFileModal({ workspaceId, fileId, folders, onMoved, onClose, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const flat = flattenFolders(folders)

  async function handleMove() {
    setLoading(true)
    await moveFile(workspaceId, fileId, targetId)
    setLoading(false)
    onMoved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-lg p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-sm mb-4">{t.officeFilesMoveTitle}</h2>
        <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
          <button
            type="button"
            onClick={() => setTargetId(null)}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${targetId === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
          >
            📁 {t.officeFilesRoot}
          </button>
          {flat.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTargetId(f.id)}
              style={{ paddingLeft: `${12 + f.depth * 16}px` }}
              className={`w-full text-left text-sm py-1.5 pr-3 rounded-md transition-colors ${targetId === f.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
            >
              📁 {f.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
            {t.brainMemoryCancel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleMove}
            className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? t.officeFilesMoving : t.officeFilesMoveHere}
          </button>
        </div>
      </div>
    </div>
  )
}
