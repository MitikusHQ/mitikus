'use client'

import { cn } from '@/lib/utils'
import type { FolderData } from '@/app/actions/files'
import { useState } from 'react'

interface Props {
  folders: FolderData[]
  activeFolderId: string | null
  onSelect: (folderId: string | null) => void
  onNewFolder: (parentId: string | null) => void
}

function FolderNode({
  folder,
  depth,
  activeFolderId,
  onSelect,
  onNewFolder,
}: {
  folder: FolderData
  depth: number
  activeFolderId: string | null
  onSelect: (id: string | null) => void
  onNewFolder: (parentId: string | null) => void
}) {
  const [open, setOpen] = useState(true)
  const hasChildren = folder.children.length > 0

  return (
    <li>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md py-1 text-sm cursor-pointer hover:bg-muted transition-colors',
          activeFolderId === folder.id && 'bg-muted font-medium',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '8px' }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}
            </svg>
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span onClick={() => onSelect(folder.id)} className="flex-1 truncate flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 text-muted-foreground">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {folder.name}
        </span>
        <button
          type="button"
          title="Nueva subcarpeta"
          onClick={(e) => { e.stopPropagation(); onNewFolder(folder.id) }}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {open && hasChildren && (
        <ul>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              onSelect={onSelect}
              onNewFolder={onNewFolder}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function FolderTree({ folders, activeFolderId, onSelect, onNewFolder }: Props) {
  return (
    <nav className="w-56 shrink-0 border-r border-border overflow-y-auto py-2">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer hover:bg-muted transition-colors mb-1',
          activeFolderId === null && 'bg-muted font-medium',
        )}
        onClick={() => onSelect(null)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-muted-foreground shrink-0">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        Raíz
      </div>
      <ul>
        {folders.map((f) => (
          <FolderNode
            key={f.id}
            folder={f}
            depth={0}
            activeFolderId={activeFolderId}
            onSelect={onSelect}
            onNewFolder={onNewFolder}
          />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onNewFolder(null)}
        className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors w-full"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva carpeta
      </button>
    </nav>
  )
}
