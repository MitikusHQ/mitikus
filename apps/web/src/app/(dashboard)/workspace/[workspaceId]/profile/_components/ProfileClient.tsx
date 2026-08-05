'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/app/_components/ImageUploader'
import { updateUserAvatar, updateUserJobTitle } from '@/app/actions/branding'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Miembro',
  VIEWER: 'Visualizador',
}

interface Props {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  role: string
}

export function ProfileClient({ name, email, avatarUrl, jobTitle, role }: Props) {
  const router = useRouter()
  const [savedAvatar, setSavedAvatar] = useState(false)
  const [title, setTitle] = useState(jobTitle ?? '')
  const [savingTitle, setSavingTitle] = useState(false)
  const [savedTitle, setSavedTitle] = useState(false)

  async function handleAvatarUploaded(url: string) {
    await updateUserAvatar(url)
    setSavedAvatar(true)
    setTimeout(() => setSavedAvatar(false), 2000)
    router.refresh()
  }

  async function handleSaveTitle() {
    setSavingTitle(true)
    await updateUserJobTitle(title)
    setSavingTitle(false)
    setSavedTitle(true)
    setTimeout(() => setSavedTitle(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Foto de perfil */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold text-sm mb-1">Foto de perfil</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Aparece en la barra de navegación y junto a tus actividades.
        </p>
        <div className="flex items-center gap-6">
          <ImageUploader
            currentUrl={avatarUrl}
            folder="mitikus/avatars"
            shape="circle"
            size={88}
            placeholder={name.charAt(0).toUpperCase()}
            onUploaded={handleAvatarUploaded}
          />
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            {savedAvatar && <p className="text-xs text-green-600 mt-1">✓ Foto actualizada</p>}
          </div>
        </div>
      </section>

      {/* Información */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Información</h2>

        <div className="grid gap-0 text-sm divide-y divide-border">
          {/* Nombre */}
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">Nombre</span>
            <span>{name}</span>
          </div>

          {/* Email */}
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">Email</span>
            <span>{email}</span>
          </div>

          {/* Cargo editable */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Cargo</span>
              {savedTitle && <span className="text-xs text-green-600">✓ Guardado</span>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                placeholder="Ej. CEO, Diseñadora, Freelance..."
                maxLength={60}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                disabled={savingTitle}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingTitle ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Rol del sistema */}
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">Rol en el workspace</span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
