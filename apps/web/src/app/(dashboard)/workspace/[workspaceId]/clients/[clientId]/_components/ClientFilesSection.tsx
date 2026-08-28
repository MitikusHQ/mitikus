'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { createFolder, type FolderData } from '@/app/actions/files'

type ClientFile = {
  id: string
  name: string
  type: 'DOC' | 'SHEET' | 'PDF' | 'IMAGE' | 'OTHER'
  url: string
  size: number
  mimeType: string
  folderId: string | null
  folder: { id: string; name: string } | null
  createdAt: string
}

interface Props {
  workspaceId: string
  clientId: string
  initialFiles: ClientFile[]
  initialFolders: FolderData[]
}

const TYPE_LABEL: Record<ClientFile['type'], string> = {
  DOC: 'Documento',
  SHEET: 'Hoja',
  PDF: 'PDF',
  IMAGE: 'Imagen',
  OTHER: 'Archivo',
}

const TYPE_ICON: Record<ClientFile['type'], string> = {
  DOC: '📄',
  SHEET: '📊',
  PDF: '📑',
  IMAGE: '🖼',
  OTHER: '🗂',
}

const ACCEPTED = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt,.md,.json,.zip'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function flattenFolders(folders: FolderData[], depth = 0): Array<{ id: string; name: string; label: string }> {
  return folders.flatMap((folder) => [
    { id: folder.id, name: folder.name, label: `${'— '.repeat(depth)}${folder.name}` },
    ...flattenFolders(folder.children, depth + 1),
  ])
}

export function ClientFilesSection({ workspaceId, clientId, initialFiles, initialFolders }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState(initialFiles)
  const [folders, setFolders] = useState(initialFolders)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flatFolders = flattenFolders(folders)

  async function uploadFiles(list: FileList) {
    setUploading(true)
    setError(null)

    try {
      const uploaded: ClientFile[] = []
      for (const file of Array.from(list)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('clientId', clientId)
        if (selectedFolderId) formData.append('folderId', selectedFolderId)

        const response = await fetch(`/api/workspace/${workspaceId}/files/upload`, {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? 'No se pudo subir el archivo')
        }

        uploaded.push({
          id: data.id,
          name: data.name,
          type: data.type,
          url: data.url,
          size: data.size,
          mimeType: data.mimeType,
          folderId: data.folderId,
          folder: data.folder,
          createdAt: data.createdAt,
        })
      }

      setFiles((current) => [...uploaded, ...current])
    } catch (err) {
      setError('No se pudo subir el archivo. Comprueba el tamaño y formato, e inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return

    setCreatingFolder(true)
    setError(null)
    try {
      const folder = await createFolder(workspaceId, name, null)
      const nextFolder: FolderData = { id: folder.id, name: folder.name, parentId: folder.parentId, children: [] }
      setFolders((current) => [...current, nextFolder].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedFolderId(folder.id)
      setNewFolderName('')
    } catch (err) {
      setError('No se pudo crear la carpeta. Inténtalo de nuevo.')
    } finally {
      setCreatingFolder(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Archivos</h2>
          <p className="text-xs text-muted-foreground">
            Expediente documental vinculado a este cliente. También queda guardado en Mi Office.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {uploading ? 'Subiendo...' : '+ Subir archivo'}
        </button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card/40 p-4 sm:grid-cols-[1fr_auto]">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Carpeta para nuevas subidas
          <select
            value={selectedFolderId}
            onChange={(event) => setSelectedFolderId(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sin carpeta</option>
            {flatFolders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.label}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-1 text-xs font-medium text-muted-foreground">
          Nueva carpeta
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="Contratos, Informes..."
              className="min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="shrink-0 rounded-md border border-input px-3 py-2 text-xs hover:bg-accent transition-colors disabled:opacity-60"
            >
              {creatingFolder ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </div>

      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files)
        }}
        className={cn(
          'rounded-xl border border-dashed p-5 transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-card/40',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files)
            event.currentTarget.value = ''
          }}
        />

        {files.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No hay archivos vinculados a este cliente.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Arrastra aquí contratos, PDFs, imágenes o cualquier documento relacionado.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border bg-background">
            {files.map((file) => (
              <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl shrink-0">{TYPE_ICON[file.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[file.type]} · {formatSize(file.size)} · {formatDate(file.createdAt)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    Carpeta: {file.folder?.name ?? 'Sin carpeta'}
                  </p>
                </div>
                <a
                  href={file.url}
                  download={file.name}
                  className="shrink-0 rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                >
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
