'use client'

import { useState } from 'react'

interface Prefill {
  periodo?: string; year?: number
  ivaRep21?: string; ivaRep10?: string; ivaRep4?: string
  ivaSop21?: string; ivaSop10?: string; ivaSop4?: string
  ivaComp?: string
  ingresos?: string; gastos?: string; retenciones?: string; cuotaSS?: string
}

interface Props {
  workspaceName: string
  legalForm: string
  prefill?: Prefill
}

const PERIODS = ['T1', 'T2', 'T3', 'T4'] as const
const YEARS   = [2025, 2026] as const

function parseNum(val: string): number {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function fmt(n: number, showSign = false): string {
  const abs = Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (showSign && n < 0) return `−${abs} €`
  return `${abs} €`
}

function currentPeriod(): { periodo: typeof PERIODS[number]; year: number } {
  const m = new Date().getMonth() + 1
  const y = new Date().getFullYear()
  if (m <= 4)  return { periodo: 'T1', year: y - 1 }
  if (m <= 7)  return { periodo: 'T2', year: y }
  if (m <= 10) return { periodo: 'T3', year: y }
  return { periodo: 'T4', year: y }
}

export function ResumenGestorClient({ workspaceName, legalForm, prefill }: Props) {
  const def = currentPeriod()
  const [periodo, setPeriodo] = useState<typeof PERIODS[number]>((prefill?.periodo as typeof PERIODS[number]) ?? def.periodo)
  const [year,    setYear   ] = useState<number>(prefill?.year ?? def.year)

  // IVA
  const [ivaRep21, setIvaRep21] = useState(prefill?.ivaRep21 ?? '')
  const [ivaRep10, setIvaRep10] = useState(prefill?.ivaRep10 ?? '')
  const [ivaRep4,  setIvaRep4 ] = useState(prefill?.ivaRep4  ?? '')
  const [ivaSop21, setIvaSop21] = useState(prefill?.ivaSop21 ?? '')
  const [ivaSop10, setIvaSop10] = useState(prefill?.ivaSop10 ?? '')
  const [ivaSop4,  setIvaSop4 ] = useState(prefill?.ivaSop4  ?? '')
  const [ivaComp,  setIvaComp ] = useState(prefill?.ivaComp  ?? '')

  // IRPF / ingresos
  const [ingresos,   setIngresos  ] = useState(prefill?.ingresos    ?? '')
  const [gastos,     setGastos    ] = useState(prefill?.gastos      ?? '')
  const [retenciones,setRetenciones] = useState(prefill?.retenciones ?? '')
  const [cuotaSS,    setCuotaSS   ] = useState(prefill?.cuotaSS     ?? '')

  // notas
  const [notas, setNotas] = useState('')

  const totalRep = parseNum(ivaRep21) + parseNum(ivaRep10) + parseNum(ivaRep4)
  const totalSop = parseNum(ivaSop21) + parseNum(ivaSop10) + parseNum(ivaSop4)
  const ivaNeto  = totalRep - totalSop - parseNum(ivaComp)

  const baseImponible = parseNum(ingresos) - parseNum(gastos) - parseNum(cuotaSS)
  const irpfEstimado  = baseImponible * 0.20 // estimación orientativa 20%
  const irpfRetenido  = parseNum(retenciones)
  const irpfDiff      = irpfEstimado - irpfRetenido

  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  const hasIrpf = parseNum(ingresos) > 0

  return (
    <div>
      {/* Formulario — oculto al imprimir */}
      <div className="print:hidden space-y-6 mb-8">
        {/* Selector período */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  periodo === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border rounded-md px-2 py-1.5 bg-background"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* IVA */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">IVA repercutido (ventas)</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '21%', val: ivaRep21, set: setIvaRep21 },
              { label: '10%', val: ivaRep10, set: setIvaRep10 },
              { label:  '4%', val: ivaRep4,  set: setIvaRep4  },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type="text" inputMode="decimal" value={val}
                  onChange={(e) => set(e.target.value)} placeholder="0,00"
                  className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums"
                />
              </div>
            ))}
          </div>
          <h3 className="text-sm font-semibold pt-1">IVA soportado deducible (gastos)</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '21%', val: ivaSop21, set: setIvaSop21 },
              { label: '10%', val: ivaSop10, set: setIvaSop10 },
              { label:  '4%', val: ivaSop4,  set: setIvaSop4  },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type="text" inputMode="decimal" value={val}
                  onChange={(e) => set(e.target.value)} placeholder="0,00"
                  className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums"
                />
              </div>
            ))}
          </div>
          <div className="max-w-xs">
            <label className="text-xs text-muted-foreground">Compensación de períodos anteriores</label>
            <input
              type="text" inputMode="decimal" value={ivaComp}
              onChange={(e) => setIvaComp(e.target.value)} placeholder="0,00"
              className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums"
            />
          </div>
        </section>

        {/* Ingresos / Gastos */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Ingresos y gastos (IRPF orientativo)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Ingresos brutos (sin IVA)',    val: ingresos,    set: setIngresos    },
              { label: 'Gastos deducibles (sin IVA)',  val: gastos,      set: setGastos      },
              { label: 'Retenciones IRPF aplicadas',   val: retenciones, set: setRetenciones },
              { label: 'Cuota Seguridad Social',       val: cuotaSS,     set: setCuotaSS     },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type="text" inputMode="decimal" value={val}
                  onChange={(e) => set(e.target.value)} placeholder="0,00"
                  className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notas */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Notas para el gestor</h3>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Incidencias, facturas pendientes, dudas…"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
          />
        </section>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* ── RESUMEN IMPRIMIBLE ── */}
      <div className="print:block rounded-xl border bg-card p-6 space-y-6">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold">{workspaceName}</h2>
            <p className="text-sm text-muted-foreground">{legalForm}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">Resumen trimestral {periodo} {year}</p>
            <p className="text-xs text-muted-foreground">Generado el {today}</p>
          </div>
        </div>

        {/* IVA */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">IVA — Modelo 303</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr><td className="py-1.5 text-muted-foreground">IVA repercutido (21%)</td><td className="py-1.5 text-right tabular-nums">{fmt(parseNum(ivaRep21))}</td></tr>
              <tr><td className="py-1.5 text-muted-foreground">IVA repercutido (10%)</td><td className="py-1.5 text-right tabular-nums">{fmt(parseNum(ivaRep10))}</td></tr>
              <tr><td className="py-1.5 text-muted-foreground">IVA repercutido (4%)</td><td className="py-1.5 text-right tabular-nums">{fmt(parseNum(ivaRep4))}</td></tr>
              <tr className="font-medium"><td className="py-1.5">Total IVA repercutido</td><td className="py-1.5 text-right tabular-nums">{fmt(totalRep)}</td></tr>
              <tr><td className="py-1.5 text-muted-foreground">− IVA soportado (21%)</td><td className="py-1.5 text-right tabular-nums">− {fmt(parseNum(ivaSop21))}</td></tr>
              <tr><td className="py-1.5 text-muted-foreground">− IVA soportado (10%)</td><td className="py-1.5 text-right tabular-nums">− {fmt(parseNum(ivaSop10))}</td></tr>
              <tr><td className="py-1.5 text-muted-foreground">− IVA soportado (4%)</td><td className="py-1.5 text-right tabular-nums">− {fmt(parseNum(ivaSop4))}</td></tr>
              {parseNum(ivaComp) > 0 && (
                <tr><td className="py-1.5 text-muted-foreground">− Compensación anterior</td><td className="py-1.5 text-right tabular-nums">− {fmt(parseNum(ivaComp))}</td></tr>
              )}
              <tr className="font-bold text-base border-t">
                <td className="pt-2">{ivaNeto >= 0 ? 'A ingresar (Mod. 303)' : 'A compensar (Mod. 303)'}</td>
                <td className={`pt-2 text-right tabular-nums ${ivaNeto > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {fmt(Math.abs(ivaNeto))}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* IRPF */}
        {hasIrpf && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">IRPF — Estimación directa (orientativo)</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                <tr><td className="py-1.5 text-muted-foreground">Ingresos brutos</td><td className="py-1.5 text-right tabular-nums">{fmt(parseNum(ingresos))}</td></tr>
                <tr><td className="py-1.5 text-muted-foreground">− Gastos deducibles</td><td className="py-1.5 text-right tabular-nums">− {fmt(parseNum(gastos))}</td></tr>
                {parseNum(cuotaSS) > 0 && (
                  <tr><td className="py-1.5 text-muted-foreground">− Cuota SS</td><td className="py-1.5 text-right tabular-nums">− {fmt(parseNum(cuotaSS))}</td></tr>
                )}
                <tr className="font-medium"><td className="py-1.5">Rendimiento neto</td><td className="py-1.5 text-right tabular-nums">{fmt(baseImponible)}</td></tr>
                <tr><td className="py-1.5 text-muted-foreground">IRPF estimado (20%)</td><td className="py-1.5 text-right tabular-nums">{fmt(irpfEstimado)}</td></tr>
                <tr><td className="py-1.5 text-muted-foreground">− Retenciones aplicadas</td><td className="py-1.5 text-right tabular-nums">− {fmt(irpfRetenido)}</td></tr>
                <tr className="font-bold text-base border-t">
                  <td className="pt-2">{irpfDiff >= 0 ? 'IRPF pendiente estimado' : 'IRPF a devolver estimado'}</td>
                  <td className={`pt-2 text-right tabular-nums ${irpfDiff > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {fmt(Math.abs(irpfDiff))}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground">* Estimación orientativa al 20%. El tipo real lo calcula el gestor según tramos.</p>
          </section>
        )}

        {/* Notas */}
        {notas.trim() && (
          <section className="space-y-1 border-t pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notas</h3>
            <p className="text-sm whitespace-pre-wrap">{notas}</p>
          </section>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          Este documento es orientativo. Los datos definitivos deben ser revisados y presentados por un asesor fiscal autorizado.
        </p>
      </div>
    </div>
  )
}
