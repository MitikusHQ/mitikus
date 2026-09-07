'use client'

import { useState, useTransition } from 'react'
import { generatePayroll, approvePayroll, payPayroll } from '@/app/actions/payrolls'

interface Employee {
  id: string
  firstName: string
  lastName: string
  jobTitle: string | null
}

interface PayrollRow {
  id: string
  employeeId: string
  year: number
  month: number
  grossTotal: number
  ssTotal: number
  irpfAmount: number
  netSalary: number
  notes: string | null
  status: string
  employee: { firstName: string; lastName: string; jobTitle: string | null }
}

interface Props {
  workspaceId: string
  payrolls: PayrollRow[]
  employees: Employee[]
  year: number
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const statusColors: Record<string, string> = {
  BORRADOR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  GENERADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PAGADA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

const statusLabels: Record<string, string> = {
  BORRADOR: 'Borrador',
  GENERADA: 'Aprobada',
  PAGADA: 'Pagada',
}

export function PayrollTable({ workspaceId, payrolls, employees, year }: Props) {
  const [pending, startTransition] = useTransition()
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    if (!selectedEmployee) { setError('Selecciona un empleado'); return }
    setError(null)
    startTransition(async () => {
      try {
        await generatePayroll(selectedEmployee, workspaceId, year, selectedMonth)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al generar nómina')
      }
    })
  }

  function handleApprove(payrollId: string) {
    startTransition(async () => { await approvePayroll(payrollId, workspaceId) })
  }

  function handlePay(payrollId: string) {
    startTransition(async () => { await payPayroll(payrollId, workspaceId) })
  }

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

  return (
    <div className="space-y-6">
      {/* Generador */}
      <div className="border rounded-xl p-4 bg-muted/20">
        <h2 className="font-semibold mb-3 text-sm">Generar nómina</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs text-muted-foreground block mb-1">Empleado</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
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
            <label className="text-xs text-muted-foreground block mb-1">Mes</label>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m} {year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={pending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? 'Generando…' : 'Generar'}
          </button>
        </div>
        {error && <p className="text-destructive text-xs mt-2">{error}</p>}
      </div>

      {/* Tabla */}
      {payrolls.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-muted-foreground text-sm">
          No hay nóminas generadas para {year}.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Periodo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bruto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">SS</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">IRPF</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Neto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="w-24"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.employee.firstName} {p.employee.lastName}</div>
                    <div className="text-xs text-muted-foreground">{p.employee.jobTitle}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {months[(p.month - 1)]} {p.year}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(p.grossTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmt(p.ssTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {fmt(p.irpfAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(p.netSalary)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] ?? ''}`}>
                      {statusLabels[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {p.status === 'BORRADOR' && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={pending}
                          className="text-xs px-2 py-1 border rounded hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                      )}
                      {p.status === 'GENERADA' && (
                        <button
                          onClick={() => handlePay(p.id)}
                          disabled={pending}
                          className="text-xs px-2 py-1 border rounded hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Marcar pagada
                        </button>
                      )}
                    </div>
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
