'use client'

import { type FileData } from '@/app/actions/files'
import { deleteFile } from '@/app/actions/files'
import { useState } from 'react'
import type { FolderData } from '@/app/actions/files'

const TYPE_ICON: Record<string, string> = {
  PDF: '📑',
  DOC: '📄',
  SHEET: '📊',
  IMAGE: '🖼',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  workspaceId: string
  files: FileData[]
  folders: FolderData[]
  onRequestMove: (fileId: string) => void
  onRefresh: () => void
}

export function FilePanel({ workspaceId, files, onRequestMove, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(fileId: string) {
    if (!confirm('¿Eliminar este archivo? Esta acción no se puede deshacer.')) return
    setDeleting(fileId)
    await deleteFile(workspaceId, fileId)
    setDeleting(null)
    onRefresh()
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-16">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
        <p className="text-sm">Sin archivos en esta ubicación</p>
        <p className="text-xs text-muted-foreground/60">Arrastra archivos arriba para subirlos</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <ul className="space-y-0.5">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <span className="text-xl shrink-0">{TYPE_ICON[file.type] ?? '📁'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={file.url}
                download={file.name}
                className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Descargar"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => onRequestMove(file.id)}
                className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Mover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="5 9 2 12 5 15" />
                  <polyline points="9 5 12 2 15 5" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                </svg>
              </button>
              <button
                type="button"
                disabled={deleting === file.id}
                onClick={() => handleDelete(file.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
