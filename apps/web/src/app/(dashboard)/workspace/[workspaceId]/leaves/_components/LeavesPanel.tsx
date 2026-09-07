'use client'

import { useState, useTransition } from 'react'
import { createLeaveRequest, approveLeave, rejectLeave } from '@/app/actions/leaves'

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface LeaveRow {
  id: string
  employeeId: string
  type: string
  startDate: Date
  endDate: Date
  workingDays: number
  reason: string | null
  status: string
  employee: { firstName: string; lastName: string; jobTitle: string | null }
}

interface Props {
  workspaceId: string
  leaves: LeaveRow[]
  employees: Employee[]
}

const leaveTypeLabels: Record<string, string> = {
  VACACIONES: 'Vacaciones',
  ENFERMEDAD: 'Enfermedad',
  ACCIDENTE: 'Accidente laboral',
  MATERNIDAD: 'Maternidad',
  PATERNIDAD: 'Paternidad',
  MATRIMONIO: 'Matrimonio',
  DEFUNCION_FAMILIAR: 'Fallecimiento familiar',
  EXAMEN_PRENATAL: 'Examen prenatal',
  LACTANCIA: 'Lactancia',
  HOSPITALIZACION_FAMILIAR: 'Hospitalización familiar',
  MUDANZA: 'Mudanza',
  FUNCIONES_SINDICALES: 'Funciones sindicales',
  ASUNTOS_PROPIOS: 'Asuntos propios',
  CONCILIACION: 'Conciliación familiar',
  PERMISO_NO_RETRIBUIDO: 'Permiso no retribuido',
  OTROS: 'Otros',
}

const statusColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  APROBADA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  RECHAZADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  CANCELADA: 'bg-muted text-muted-foreground',
}

export function LeavesPanel({ workspaceId, leaves, employees }: Props) {
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [form, setForm] = useState({
    employeeId: '',
    leaveType: 'VACACIONES',
    startDate: '',
    endDate: '',
    reason: '',
  })

  function handleSubmit() {
    if (!form.employeeId || !form.startDate || !form.endDate) {
      setError('Completa todos los campos obligatorios')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await createLeaveRequest({ workspaceId, ...form })
        setShowForm(false)
        setForm({ employeeId: '', leaveType: 'VACACIONES', startDate: '', endDate: '', reason: '' })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear solicitud')
      }
    })
  }

  function handleApprove(id: string) {
    startTransition(() => approveLeave(id, workspaceId))
  }

  function handleReject() {
    if (!rejectId) return
    startTransition(async () => {
      await rejectLeave(rejectId, workspaceId, rejectReason)
      setRejectId(null)
      setRejectReason('')
    })
  }

  return (
    <div className="space-y-6">
      {/* Botón nueva solicitud */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva solicitud
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="border rounded-xl p-5 bg-muted/20 space-y-4">
          <h2 className="font-semibold text-sm">Nueva solicitud de ausencia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Empleado *</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              >
                <option value="">— seleccionar —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo de ausencia *</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              >
                {Object.entries(leaveTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fecha inicio *</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fecha fin *</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Motivo (opcional)</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.reason}
                placeholder="Descripción adicional…"
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={pending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pending ? 'Guardando…' : 'Solicitar ausencia'}
            </button>
          </div>
        </div>
      )}

      {/* Modal rechazo */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border rounded-xl p-6 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-semibold">Rechazar solicitud</h3>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Motivo del rechazo</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indica el motivo…"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setRejectId(null)} className="text-sm text-muted-foreground">Cancelar</button>
              <button
                onClick={handleReject}
                disabled={pending}
                className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {leaves.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-muted-foreground text-sm">
          No hay solicitudes de ausencia registradas.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fechas</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Días</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="w-32"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{leave.employee.firstName} {leave.employee.lastName}</div>
                    <div className="text-xs text-muted-foreground">{leave.employee.jobTitle}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {leaveTypeLabels[leave.type] ?? leave.type}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {leave.startDate instanceof Date
                      ? leave.startDate.toLocaleDateString('es-ES')
                      : new Date(leave.startDate).toLocaleDateString('es-ES')}
                    {' → '}
                    {leave.endDate instanceof Date
                      ? leave.endDate.toLocaleDateString('es-ES')
                      : new Date(leave.endDate).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{leave.workingDays}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[leave.status] ?? ''}`}>
                      {leave.status === 'PENDIENTE' ? 'Pendiente' :
                       leave.status === 'APROBADA' ? 'Aprobada' :
                       leave.status === 'RECHAZADA' ? 'Rechazada' : leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === 'PENDIENTE' && (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleApprove(leave.id)}
                          disabled={pending}
                          className="text-xs px-2 py-1 border rounded hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => setRejectId(leave.id)}
                          disabled={pending}
                          className="text-xs px-2 py-1 border rounded text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
