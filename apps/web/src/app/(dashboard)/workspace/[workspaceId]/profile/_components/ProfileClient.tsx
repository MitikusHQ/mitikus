'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/app/_components/ImageUploader'
import { updateUserAvatar } from '@/app/actions/branding'

interface Props {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
}

export function ProfileClient({ name, email, avatarUrl }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  async function handleAvatarUploaded(url: string) {
    await updateUserAvatar(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
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
            {saved && <p className="text-xs text-green-600 mt-1">✓ Foto actualizada</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold text-sm">Información</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Nombre</span>
            <span>{name}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Email</span>
            <span>{email}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
