'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deactivateEmployee } from '@/app/actions/employees'

interface Props {
  employeeId: string
  workspaceId: string
  active: boolean
}

export function EmployeeActions({ employeeId, workspaceId, active }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!active) return null

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateEmployee(employeeId, workspaceId)
      router.push(`/workspace/${workspaceId}/employees`)
    })
  }

  return (
    <>
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
