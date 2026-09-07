'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createEmployee } from '@/app/actions/employees'

const CONTRACT_TYPES = [
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'TEMPORAL', label: 'Temporal' },
  { value: 'PRACTICAS', label: 'Prácticas' },
  { value: 'FORMACION', label: 'Formación' },
  { value: 'TIEMPO_PARCIAL', label: 'Tiempo parcial' },
  { value: 'OBRA_SERVICIO', label: 'Obra y servicio' },
]

const MARITAL_STATUS = [
  { value: 'SOLTERO', label: 'Soltero/a' },
  { value: 'CASADO', label: 'Casado/a' },
  { value: 'DIVORCIADO', label: 'Divorciado/a' },
  { value: 'VIUDO', label: 'Viudo/a' },
  { value: 'SEPARADO', label: 'Separado/a' },
  { value: 'PAREJA_HECHO', label: 'Pareja de hecho' },
]

export default function NewEmployeePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    nif: '',
    phone: '',
    position: '',
    department: '',
    startDate: new Date().toISOString().slice(0, 10),
    contractType: 'INDEFINIDO',
    workingHours: 40,
    annualGrossSalary: 0,
    extraPayments: 2,
    extraPaymentsProrrated: false,
    maritalStatus: 'SOLTERO',
    spouseEarnsOver1500: false,
    childrenCount: 0,
    childrenUnder3: 0,
    ascendantsOver65: 0,
    ascendantsOver75: 0,
    workerDisabilityPct: 0,
    workerNeedsAssistance: false,
    dependantsDisabled: 0,
    compensatoryPension: 0,
    irpfManual: false,
    irpfPct: null as number | null,
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await createEmployee({
          workspaceId,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          nif: form.nif || undefined,
          phone: form.phone || undefined,
          position: form.position,
          department: form.department || undefined,
          startDate: form.startDate,
          contractType: form.contractType as 'INDEFINIDO' | 'TEMPORAL' | 'PRACTICAS' | 'FORMACION' | 'TIEMPO_PARCIAL' | 'OBRA_SERVICIO',
          workingHours: Number(form.workingHours),
          annualGrossSalary: Number(form.annualGrossSalary),
          extraPayments: Number(form.extraPayments),
          extraPaymentsProrrated: form.extraPaymentsProrrated,
          maritalStatus: form.maritalStatus as 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'SEPARADO' | 'PAREJA_HECHO',
          spouseEarnsOver1500: form.spouseEarnsOver1500,
          childrenCount: Number(form.childrenCount),
          childrenUnder3: Number(form.childrenUnder3),
          ascendantsOver65: Number(form.ascendantsOver65),
          ascendantsOver75: Number(form.ascendantsOver75),
          workerDisabilityPct: Number(form.workerDisabilityPct),
          workerNeedsAssistance: form.workerNeedsAssistance,
          dependantsDisabled: Number(form.dependantsDisabled),
          compensatoryPension: Number(form.compensatoryPension),
          irpfManual: form.irpfManual,
          irpfPct: form.irpfManual ? Number(form.irpfPct) : null,
        })
        router.push(`/workspace/${workspaceId}/employees`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear el empleado')
      }
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo empleado</h1>
          <p className="text-muted-foreground text-sm">Rellena los datos del empleado para añadirlo al equipo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos personales */}
        <section className="border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Ana" />
            </Field>
            <Field label="Apellidos *">
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="García López" />
            </Field>
            <Field label="Email *">
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ana@empresa.com" />
            </Field>
            <Field label="NIF">
              <input value={form.nif} onChange={e => set('nif', e.target.value)} placeholder="12345678A" />
            </Field>
            <Field label="Teléfono">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000" />
            </Field>
          </div>
        </section>

        {/* Datos laborales */}
        <section className="border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Datos laborales</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cargo / Puesto *">
              <input required value={form.position} onChange={e => set('position', e.target.value)} placeholder="Desarrolladora" />
            </Field>
            <Field label="Departamento">
              <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Tecnología" />
            </Field>
            <Field label="Fecha de alta *">
              <input required type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </Field>
            <Field label="Tipo de contrato *">
              <select required value={form.contractType} onChange={e => set('contractType', e.target.value)}>
                {CONTRACT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Horas semanales">
              <input type="number" min={1} max={40} value={form.workingHours} onChange={e => set('workingHours', e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Salario */}
        <section className="border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Salario</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Salario bruto anual (€) *">
              <input required type="number" min={0} step={100} value={form.annualGrossSalary} onChange={e => set('annualGrossSalary', e.target.value)} placeholder="24000" />
            </Field>
            <Field label="Pagas extra">
              <select value={form.extraPayments} onChange={e => set('extraPayments', Number(e.target.value))}>
                <option value={0}>0 pagas</option>
                <option value={2}>2 pagas (junio y diciembre)</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.extraPaymentsProrrated} onChange={e => set('extraPaymentsProrrated', e.target.checked)} className="rounded" />
            Prorratear pagas extra en 12 mensualidades
          </label>
        </section>

        {/* IRPF */}
        <section className="border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">IRPF</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado civil">
              <select value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)}>
                {MARITAL_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Hijos/as a cargo">
              <input type="number" min={0} value={form.childrenCount} onChange={e => set('childrenCount', e.target.value)} />
            </Field>
            <Field label="Hijos menores de 3 años">
              <input type="number" min={0} value={form.childrenUnder3} onChange={e => set('childrenUnder3', e.target.value)} />
            </Field>
            <Field label="Ascendientes >65 años a cargo">
              <input type="number" min={0} value={form.ascendantsOver65} onChange={e => set('ascendantsOver65', e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.irpfManual} onChange={e => set('irpfManual', e.target.checked)} className="rounded" />
            Fijar % IRPF manualmente
          </label>
          {form.irpfManual && (
            <Field label="% IRPF">
              <input type="number" min={0} max={45} step={0.5} value={form.irpfPct ?? ''} onChange={e => set('irpfPct', e.target.value ? Number(e.target.value) : null)} placeholder="15" />
            </Field>
          )}
        </section>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Añadir empleado'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-input [&_input]:bg-background [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-input [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
