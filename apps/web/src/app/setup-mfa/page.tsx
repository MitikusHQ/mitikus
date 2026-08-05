import type { Metadata } from 'next'
import { UserProfile } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Verificación en dos pasos — MITIKUS',
  description: 'Activa la verificación en dos pasos para proteger tu cuenta.',
}

export default function SetupMfaPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Activa la verificación en dos pasos</h1>
        <p className="text-muted-foreground text-sm">
          MITIKUS requiere un segundo factor para proteger tu cuenta y los datos de tu equipo.
          Abre la app de autenticación (Google Authenticator, Authy…) y escanea el código QR.
        </p>
      </div>
      <UserProfile routing="hash">
        <UserProfile.Page label="security" />
      </UserProfile>
    </main>
  )
}
