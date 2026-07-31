'use client'

import { useState, useCallback } from 'react'
import { DeclarationSaveBar } from '../../_components/DeclarationSaveBar'

function parseNum(val: string): number {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

interface SaveProps { workspaceId: string; periodoLabel: string; initialStatus?: string; initialId?: string; initialData?: Record<string, string> }

export function Modelo130Client({ periodo, save }: { periodo: string; save?: SaveProps }) {
  const d = save?.initialData
  const [ingresos,    setIngresos   ] = useState(d?.ingresos    ?? '')
  const [gastos,      setGastos     ] = useState(d?.gastos      ?? '')
  const [cuotaSS,     setCuotaSS    ] = useState(d?.cuotaSS     ?? '')
  const [pagosAnt,    setPagosAnt   ] = useState(d?.pagosAnt    ?? '')
  const [retenciones, setRetenciones] = useState(d?.retenciones ?? '')

  const getData = useCallback(() =>
    ({ ingresos, gastos, cuotaSS, pagosAnt, retenciones }),
  [ingresos, gastos, cuotaSS, pagosAnt, retenciones])

  const ing   = parseNum(ingresos)
  const gast  = parseNum(gastos)
  const ss    = parseNum(cuotaSS)
  const ret   = parseNum(retenciones)
  const ant   = parseNum(pagosAnt)

  const rendimiento = Math.max(0, ing - gast - ss)
  const pagoBruto   = rendimiento * 0.20
  const resultado   = Math.max(0, pagoBruto - ret - ant)

  const rows: { label: string; value: string; highlight?: boolean; color?: string }[] = [
    { label: 'Ingresos del trimestre',            value: fmt(ing)         },
    { label: '− Gastos deducibles',               value: '− ' + fmt(gast) },
    { label: '− Cuotas Seguridad Social',          value: '− ' + fmt(ss)   },
    { label: 'Rendimiento neto',                   value: fmt(rendimiento), highlight: true },
    { label: 'Pago fraccionado (20%)',             value: fmt(pagoBruto)   },
    { label: '− Retenciones IRPF aplicadas',       value: '− ' + fmt(ret)  },
    { label: '− Pagos fraccionados anteriores',    value: '− ' + fmt(ant)  },
  ]

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Datos del trimestre
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Ingresos brutos (sin IVA)',         val: ingresos,    set: setIngresos,    hint: 'Total facturado en el trimestre' },
            { label: 'Gastos deducibles (sin IVA)',       val: gastos,      set: setGastos,      hint: 'Gastos de actividad con factura' },
            { label: 'Cuotas Seguridad Social',           val: cuotaSS,     set: setCuotaSS,     hint: 'Cuota de autónomo pagada este trimestre' },
            { label: 'Retenciones IRPF en facturas',      val: retenciones, set: setRetenciones, hint: 'Retenciones que te han practicado clientes' },
            { label: 'Pagos fraccionados anteriores (año)', val: pagosAnt,  set: setPagosAnt,    hint: 'Suma de Mod. 130 presentados este año' },
          ].map(({ label, val, set, hint }) => (
            <div key={label} className="space-y-1">
              <label className="text-sm font-medium">{label}</label>
              <p className="text-xs text-muted-foreground">{hint}</p>
              <input
                type="text"
                inputMode="decimal"
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder="0,00"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Resultado */}
      <section className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resultado</h2>
        <div className="space-y-2 text-sm">
          {rows.map(({ label, value, highlight }) => (
            <div key={label} className={`flex justify-between ${highlight ? 'font-semibold border-t border-b py-2 my-1' : ''}`}>
              <span className={highlight ? '' : 'text-muted-foreground'}>{label}</span>
              <span className="tabular-nums font-medium">{value}</span>
            </div>
          ))}
          <div className="border-t pt-3 flex justify-between text-base font-bold">
            <span>A ingresar {periodo}</span>
            <span className={resultado > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
              {fmt(resultado)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Este cálculo es orientativo. La presentación oficial se realiza en la{' '}
          <a href="https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            sede electrónica de la AEAT
          </a>.
        </p>
        {save && (
          <DeclarationSaveBar
            workspaceId={save.workspaceId} modelo="130"
            periodo={save.periodoLabel.split(' ')[0]!} year={Number(save.periodoLabel.split(' ')[1])}
            resultado={resultado} getData={getData}
            initialStatus={save.initialStatus} initialId={save.initialId}
          />
        )}
      </section>
    </div>
  )
}
