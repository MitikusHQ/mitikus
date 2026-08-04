'use client'

import { useState } from 'react'
import { createFolder } from '@/app/actions/files'

interface Props {
  workspaceId: string
  parentId: string | null
  onCreated: () => void
  onClose: () => void
}

export function NewFolderModal({ workspaceId, parentId, onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await createFolder(workspaceId, name.trim(), parentId)
    setLoading(false)
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-lg p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-sm mb-4">Nueva carpeta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            placeholder="Nombre de la carpeta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
