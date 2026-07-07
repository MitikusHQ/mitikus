'use client'

import { useActionState, useState } from 'react'
import { createWorkspace, type WorkspaceActionState } from '@/app/actions/workspace'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CreateWorkspaceForm() {
  const [state, action, isPending] = useActionState<WorkspaceActionState, FormData>(
    createWorkspace,
    null,
  )
  const [slug, setSlug] = useState('')

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(toSlug(e.target.value))
  }

  return (
    <form action={action} className="w-full max-w-sm mx-auto mt-8 space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre del workspace
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Mi empresa"
          onChange={handleNameChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {slug && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Slug</label>
          <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground font-mono">
            {slug}
          </div>
          <input type="hidden" name="slug" value={slug} />
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Creando…' : 'Crear workspace'}
      </button>
    </form>
  )
}
