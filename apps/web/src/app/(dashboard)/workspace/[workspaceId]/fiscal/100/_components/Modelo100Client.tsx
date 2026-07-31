'use client'

import { useState, useCallback } from 'react'
import { DeclarationSaveBar } from '../../_components/DeclarationSaveBar'

interface SaveProps {
  workspaceId: string
  periodoLabel: string
  initialStatus?: string
  initialId?: string
  initialData?: Record<string, string>
}

interface Props { year: number; save?: SaveProps }

function parseNum(v: string) { const n = parseFloat(v.replace(',', '.')); return isNaN(n) ? 0 : n }
function fmt(n: number) { return Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' }

export function Modelo100Client({ year, save }: Props) {
  const p = save?.initialData ?? {}
  const [ingresos,    setIngresos   ] = useState(p['ingresos']    ?? '')
  const [gastos,      setGastos     ] = useState(p['gastos']      ?? '')
  const [cuotaSS,     setCuotaSS    ] = useState(p['cuotaSS']     ?? '')
  const [retenciones, setRetenciones] = useState(p['retenciones'] ?? '')
  const [pagosAnts,   setPagosAnts  ] = useState(p['pagosAnts']   ?? '')
  const [minviv,      setMinviv     ] = useState(p['minviv']      ?? '')

  const rendimiento = parseNum(ingresos) - parseNum(gastos) - parseNum(cuotaSS)
  const cuotaIntegra = rendimiento * 0.20 // estimación orientativa, tipo efectivo lo calcula Hacienda
  const resultado = cuotaIntegra - parseNum(retenciones) - parseNum(pagosAnts) - parseNum(minviv)

  const getData = useCallback(() => ({ ingresos, gastos, cuotaSS, retenciones, pagosAnts, minviv }), [ingresos, gastos, cuotaSS, retenciones, pagosAnts, minviv])

  return (
    <div className="space-y-6">
      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2.5">
        Estimación directa simplificada. Los cálculos son orientativos — el tipo efectivo final lo calcula la Agencia Tributaria según tramos de renta.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Rendimientos de actividades económicas</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Ingresos brutos (sin IVA)',    val: ingresos,    set: setIngresos    },
            { label: 'Gastos deducibles (sin IVA)',  val: gastos,      set: setGastos      },
            { label: 'Cuota Seguridad Social anual', val: cuotaSS,     set: setCuotaSS     },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} placeholder="0,00"
                className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Detracciones y pagos previos</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Retenciones IRPF soportadas', val: retenciones, set: setRetenciones },
            { label: 'Pagos fraccionados (130)',     val: pagosAnts,   set: setPagosAnts   },
            { label: 'Deducción vivienda habitual',  val: minviv,      set: setMinviv      },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} placeholder="0,00"
                className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums" />
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Ingresos brutos</span><span className="tabular-nums font-medium">{fmt(parseNum(ingresos))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">− Gastos deducibles</span><span className="tabular-nums font-medium">− {fmt(parseNum(gastos))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">− Cuota SS</span><span className="tabular-nums font-medium">− {fmt(parseNum(cuotaSS))}</span></div>
        <div className="flex justify-between font-medium border-t pt-1"><span>Rendimiento neto</span><span className="tabular-nums">{fmt(rendimiento)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Cuota íntegra estimada (20%)</span><span className="tabular-nums">{fmt(cuotaIntegra)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">− Retenciones</span><span className="tabular-nums">− {fmt(parseNum(retenciones))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">− Pagos fraccionados</span><span className="tabular-nums">− {fmt(parseNum(pagosAnts))}</span></div>
        {parseNum(minviv) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">− Deducción vivienda</span><span className="tabular-nums">− {fmt(parseNum(minviv))}</span></div>}
        <div className="border-t pt-2 flex justify-between font-bold text-base">
          <span>{resultado >= 0 ? 'A ingresar (estimado)' : 'A devolver (estimado)'}</span>
          <span className={resultado > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>{fmt(resultado)}</span>
        </div>
      </div>

      {save && (
        <DeclarationSaveBar
          workspaceId={save.workspaceId}
          modelo="100"
          periodo="Anual"
          year={year}
          resultado={resultado}
          getData={getData}
          initialStatus={save.initialStatus}
          initialId={save.initialId}
        />
      )}
    </div>
  )
}
