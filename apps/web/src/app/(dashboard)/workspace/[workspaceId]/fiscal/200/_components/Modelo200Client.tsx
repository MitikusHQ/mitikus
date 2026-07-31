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

export function Modelo200Client({ year, save }: Props) {
  const p = save?.initialData ?? {}
  const [baseImponible,  setBaseImponible ] = useState(p['baseImponible']  ?? '')
  const [compensaciones, setCompensaciones] = useState(p['compensaciones'] ?? '')
  const [deducciones,    setDeducciones   ] = useState(p['deducciones']    ?? '')
  const [pagosACount,    setPagosACount   ] = useState(p['pagosACount']    ?? '')
  const [retenciones,    setRetenciones   ] = useState(p['retenciones']    ?? '')

  const baseReducida = parseNum(baseImponible) - parseNum(compensaciones)
  const tipo = 0.25 // tipo general IS España
  const cuotaIntegra = Math.max(0, baseReducida) * tipo
  const cuotaLiquida = cuotaIntegra - parseNum(deducciones)
  const resultado = cuotaLiquida - parseNum(pagosACount) - parseNum(retenciones)

  const getData = useCallback(() => ({ baseImponible, compensaciones, deducciones, pagosACount, retenciones }), [baseImponible, compensaciones, deducciones, pagosACount, retenciones])

  return (
    <div className="space-y-6">
      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2.5">
        Cálculo orientativo al tipo general del 25%. El resultado definitivo requiere revisión contable y liquidación oficial.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Base imponible</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Resultado contable (ingresos − gastos)',       val: baseImponible,  set: setBaseImponible  },
            { label: 'Bases imponibles negativas de ejerc. anter.', val: compensaciones, set: setCompensaciones },
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
        <h3 className="text-sm font-semibold">Deducciones y pagos previos</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Deducciones por doble imposición / I+D',     val: deducciones, set: setDeducciones  },
            { label: 'Pagos fraccionados (mod. 202)',               val: pagosACount, set: setPagosACount  },
            { label: 'Retenciones e ingresos a cuenta',            val: retenciones, set: setRetenciones  },
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
        <div className="flex justify-between"><span className="text-muted-foreground">Resultado contable</span><span className="tabular-nums font-medium">{fmt(parseNum(baseImponible))}</span></div>
        {parseNum(compensaciones) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">− BINs anteriores</span><span className="tabular-nums">− {fmt(parseNum(compensaciones))}</span></div>}
        <div className="flex justify-between font-medium border-t pt-1"><span>Base imponible</span><span className="tabular-nums">{fmt(baseReducida)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Cuota íntegra (25%)</span><span className="tabular-nums">{fmt(cuotaIntegra)}</span></div>
        {parseNum(deducciones) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">− Deducciones</span><span className="tabular-nums">− {fmt(parseNum(deducciones))}</span></div>}
        <div className="flex justify-between"><span className="text-muted-foreground">− Pagos fraccionados</span><span className="tabular-nums">− {fmt(parseNum(pagosACount))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">− Retenciones</span><span className="tabular-nums">− {fmt(parseNum(retenciones))}</span></div>
        <div className="border-t pt-2 flex justify-between font-bold text-base">
          <span>{resultado >= 0 ? 'A ingresar (estimado)' : 'A devolver (estimado)'}</span>
          <span className={resultado > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>{fmt(resultado)}</span>
        </div>
      </div>

      {save && (
        <DeclarationSaveBar
          workspaceId={save.workspaceId}
          modelo="200"
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
