import { getEmployees } from '@/app/actions/employees'
import Link from 'next/link'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

const contractLabels: Record<string, string> = {
  INDEFINIDO: 'Indefinido',
  TEMPORAL: 'Temporal',
  PRACTICAS: 'Prácticas',
  FORMACION: 'Formación',
  TIEMPO_PARCIAL: 'Parcial',
  OBRA_SERVICIO: 'Obra y servicio',
}

export default async function EmployeesPage({ params }: Props) {
  const [{ workspaceId }, locale] = await Promise.all([params, getLocale()])
  const t = getDashboardTranslations(locale)
  const employees = await getEmployees(workspaceId).catch(() => [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.employeesTitle}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.employeesSubtitle}</p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/employees/new`}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo empleado
        </Link>
      </div>

      {employees.length === 0 ? (
        <div className="border rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 className="font-semibold mb-1">Sin empleados</h3>
          <p className="text-muted-foreground text-sm mb-4">Añade tu primer empleado para empezar a gestionar nóminas y ausencias.</p>
          <Link
            href={`/workspace/${workspaceId}/employees/new`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Añadir empleado
          </Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cargo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contrato</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Salario bruto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alta</th>
                <th className="w-10"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/workspace/${workspaceId}/employees/${emp.id}`} className="font-medium hover:underline">
                      {emp.firstName} {emp.lastName}
                    </Link>
                    {emp.email && <div className="text-xs text-muted-foreground">{emp.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.jobTitle}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-muted border font-medium">
                      {contractLabels[emp.contractType] ?? emp.contractType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {emp.annualGrossSalary.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {emp.startDate.toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/workspace/${workspaceId}/employees/${emp.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
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
