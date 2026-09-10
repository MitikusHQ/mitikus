'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deactivateEmployee, inviteEmployee } from '@/app/actions/employees'

interface Props {
  employeeId: string
  workspaceId: string
  active: boolean
  email?: string | null
}

export function EmployeeActions({ employeeId, workspaceId, active, email }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState<string | null>(null)

  if (!active) return null

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateEmployee(employeeId, workspaceId)
      router.push(`/workspace/${workspaceId}/employees`)
    })
  }

  async function handleInvite() {
    if (!email) return
    setInviteStatus('sending')
    setInviteError(null)
    const result = await inviteEmployee(employeeId, workspaceId, email)
    if (result.ok) {
      setInviteStatus('sent')
    } else {
      setInviteStatus('error')
      setInviteError(result.error)
    }
  }

  return (
    <>
      {email && inviteStatus !== 'sent' && (
        <button
          type="button"
          onClick={handleInvite}
          disabled={inviteStatus === 'sending'}
          title={`Invitar ${email} al workspace`}
          className="inline-flex items-center gap-2 border border-input px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          {inviteStatus === 'sending' ? 'Enviando...' : 'Invitar al workspace'}
        </button>
      )}
      {inviteStatus === 'sent' && (
        <span className="text-xs text-emerald-600 font-medium px-3 py-2">✓ Invitación enviada</span>
      )}
      {inviteStatus === 'error' && inviteError && (
        <span className="text-xs text-destructive px-3 py-2">{inviteError}</span>
      )}

      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-2 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <line x1="17" y1="11" x2="23" y2="11"/>
        </svg>
        Dar de baja
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-semibold text-lg">¿Dar de baja al empleado?</h3>
            <p className="text-sm text-muted-foreground">
              Se registrará la fecha de baja como hoy y el empleado dejará de aparecer en nóminas y ausencias activas. Esta acción no elimina el historial.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Procesando...' : 'Confirmar baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
