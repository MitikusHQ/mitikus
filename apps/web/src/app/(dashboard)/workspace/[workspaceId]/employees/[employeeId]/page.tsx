import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEmployee } from '@/app/actions/employees'
import { EmployeeActions } from './_components/EmployeeActions'

interface Props {
  params: Promise<{ workspaceId: string; employeeId: string }>
}

const contractLabels: Record<string, string> = {
  INDEFINIDO: 'Indefinido',
  TEMPORAL: 'Temporal',
  PRACTICAS: 'Prácticas',
  FORMACION: 'Formación',
  TIEMPO_PARCIAL: 'Tiempo parcial',
  OBRA_SERVICIO: 'Obra y servicio',
}

const maritalLabels: Record<string, string> = {
  SOLTERO: 'Soltero/a',
  CASADO: 'Casado/a',
  DIVORCIADO: 'Divorciado/a',
  VIUDO: 'Viudo/a',
  SEPARADO: 'Separado/a',
  PAREJA_HECHO: 'Pareja de hecho',
}

const payrollStatusLabels: Record<string, string> = {
  BORRADOR: 'Borrador',
  GENERADA: 'Generada',
  PAGADA: 'Pagada',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function EmployeePage({ params }: Props) {
  const { workspaceId, employeeId } = await params
  const employee = await getEmployee(employeeId, workspaceId).catch(() => null)
  if (!employee) notFound()

  const base = `/workspace/${workspaceId}`
  const monthlyGross = employee.annualGrossSalary / 12

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`${base}/employees`} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
            <p className="text-muted-foreground text-sm">{employee.jobTitle ?? '—'}{employee.department ? ` · ${employee.department}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!employee.active && (
            <span className="text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 px-2 py-1 rounded-full">Baja</span>
          )}
          <Link
            href={`${base}/employees/${employeeId}/edit`}
            className="inline-flex items-center gap-2 border border-input px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </Link>
          <EmployeeActions employeeId={employeeId} workspaceId={workspaceId} active={employee.active} />
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Datos personales */}
        <section className="border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos personales</h2>
          <Row label="Email" value={employee.email} />
          <Row label="NIF" value={employee.nif} />
          <Row label="Teléfono" value={employee.phone} />
          <Row label="Estado civil" value={maritalLabels[employee.maritalStatus] ?? employee.maritalStatus} />
        </section>

        {/* Contrato */}
        <section className="border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contrato</h2>
          <Row label="Tipo" value={contractLabels[employee.contractType] ?? employee.contractType} />
          <Row label="Fecha de alta" value={fmtDate(employee.startDate)} />
          <Row label="Fecha de baja" value={fmtDate(employee.endDate)} />
          <Row label="Horas semanales" value={`${employee.workingHours}h`} />
        </section>

        {/* Retribución */}
        <section className="border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Retribución</h2>
          <Row label="Bruto anual" value={fmt(employee.annualGrossSalary)} />
          <Row label="Bruto mensual aprox." value={fmt(monthlyGross)} />
          <Row label="Pagas extra" value={`${employee.extraPayments} pagas${employee.extraPaymentsProrrated ? ' (prorrateadas)' : ''}`} />
          <Row label="IRPF" value={employee.irpfManual && employee.irpfPct !== null ? `${employee.irpfPct}% (manual)` : 'Calculado automáticamente'} />
        </section>

        {/* IRPF / cargas familiares */}
        <section className="border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Situación familiar (IRPF)</h2>
          <Row label="Hijos a cargo" value={String(employee.childrenCount)} />
          <Row label="Hijos &lt;3 años" value={String(employee.childrenUnder3)} />
          <Row label="Ascendientes &gt;65 años" value={String(employee.ascendantsOver65)} />
          <Row label="Discapacidad trabajador" value={employee.workerDisabilityPct ? `${employee.workerDisabilityPct}%` : 'No'} />
        </section>
      </div>

      {/* Historial de nóminas */}
      {employee.payrolls.length > 0 && (
        <section className="border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Nóminas recientes</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Periodo</th>
                <th className="text-right px-5 py-2 font-medium text-muted-foreground">Bruto</th>
                <th className="text-right px-5 py-2 font-medium text-muted-foreground">Neto</th>
                <th className="text-right px-5 py-2 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employee.payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">{p.month}/{p.year}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmt(p.grossTotal)}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">{fmt(p.netSalary)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === 'PAGADA' ? 'bg-emerald-500/10 text-emerald-600' :
                      p.status === 'GENERADA' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {payrollStatusLabels[p.status] ?? p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t">
            <Link href={`${base}/payroll`} className="text-sm text-primary hover:underline">Ver todas las nóminas →</Link>
          </div>
        </section>
      )}

      {/* Historial de ausencias */}
      {employee.leaveRequests.length > 0 && (
        <section className="border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Ausencias recientes</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Desde</th>
                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Hasta</th>
                <th className="text-right px-5 py-2 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employee.leaveRequests.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">{l.type}</td>
                  <td className="px-5 py-3">{fmtDate(l.startDate)}</td>
                  <td className="px-5 py-3">{fmtDate(l.endDate)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      l.status === 'APROBADA' ? 'bg-emerald-500/10 text-emerald-600' :
                      l.status === 'DENEGADA' ? 'bg-destructive/10 text-destructive' :
                      l.status === 'CANCELADA' ? 'bg-muted text-muted-foreground' :
                      'bg-amber-500/10 text-amber-600'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t">
            <Link href={`${base}/leaves`} className="text-sm text-primary hover:underline">Ver todas las ausencias →</Link>
          </div>
        </section>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  )
}
