import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AcceptButton } from './_components/AcceptButton'

interface Props {
  params: Promise<{ token: string }>
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Consultor',
  VIEWER: 'Lector',
  OWNER: 'Propietario',
  MEMBER: 'Miembro',
  OPERATOR: 'Operador',
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const { userId } = await auth()

  const invitation = await db.orgInvitation.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  })

  if (!invitation) {
    return <InviteError message="Este link de invitación no existe o ha sido eliminado." />
  }

  if (invitation.revokedAt) {
    return <InviteError message="Esta invitación ha sido revocada por el administrador." />
  }

  if (invitation.acceptedAt) {
    return <InviteError message="Esta invitación ya fue aceptada." />
  }

  if (invitation.expiresAt < new Date()) {
    return <InviteError message="Esta invitación ha caducado. Solicita una nueva al administrador." />
  }

  if (!userId) {
    redirect(`/sign-up?redirect_url=/invite/${token}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-sm space-y-6 text-center">
        <div className="text-4xl">🤝</div>
        <div>
          <h1 className="text-xl font-semibold">Te han invitado a {invitation.org.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Únete como{' '}
            <span className="font-medium text-foreground">
              {ROLE_LABEL[invitation.role] ?? invitation.role}
            </span>
          </p>
        </div>
        <AcceptButton token={token} />
        <p className="text-xs text-muted-foreground">
          Esta invitación caduca el{' '}
          {new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }).format(invitation.expiresAt)}
        </p>
      </div>
    </div>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-sm space-y-4 text-center">
        <div className="text-4xl">❌</div>
        <h1 className="text-xl font-semibold">Invitación no válida</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <a href="/" className="inline-block text-sm text-primary underline">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
