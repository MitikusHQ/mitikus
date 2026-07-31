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

interface Props {
  year: number
  save?: SaveProps
}

function parseNum(v: string) { const n = parseFloat(v.replace(',', '.')); return isNaN(n) ? 0 : n }
function fmt(n: number) { return Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' }

export function Modelo390Client({ year, save }: Props) {
  const p = save?.initialData ?? {}
  const [ivaRep21, setIvaRep21] = useState(p['ivaRep21'] ?? '')
  const [ivaRep10, setIvaRep10] = useState(p['ivaRep10'] ?? '')
  const [ivaRep4,  setIvaRep4 ] = useState(p['ivaRep4']  ?? '')
  const [ivaSop21, setIvaSop21] = useState(p['ivaSop21'] ?? '')
  const [ivaSop10, setIvaSop10] = useState(p['ivaSop10'] ?? '')
  const [ivaSop4,  setIvaSop4 ] = useState(p['ivaSop4']  ?? '')
  const [compensar, setCompensar] = useState(p['compensar'] ?? '')
  const [pagosT, setPagosT] = useState(p['pagosT'] ?? '')

  const totalRep = parseNum(ivaRep21) + parseNum(ivaRep10) + parseNum(ivaRep4)
  const totalSop = parseNum(ivaSop21) + parseNum(ivaSop10) + parseNum(ivaSop4)
  const cuotaNeta = totalRep - totalSop
  const resultado = cuotaNeta - parseNum(compensar) - parseNum(pagosT)

  const getData = useCallback(() => ({
    ivaRep21, ivaRep10, ivaRep4,
    ivaSop21, ivaSop10, ivaSop4,
    compensar, pagosT,
  }), [ivaRep21, ivaRep10, ivaRep4, ivaSop21, ivaSop10, ivaSop4, compensar, pagosT])

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">IVA repercutido acumulado anual</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '21%', val: ivaRep21, set: setIvaRep21 },
            { label: '10%', val: ivaRep10, set: setIvaRep10 },
            { label:  '4%', val: ivaRep4,  set: setIvaRep4  },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} placeholder="0,00"
                className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums" />
            </div>
          ))}
        </div>
        <h3 className="text-sm font-semibold">IVA soportado deducible acumulado anual</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '21%', val: ivaSop21, set: setIvaSop21 },
            { label: '10%', val: ivaSop10, set: setIvaSop10 },
            { label:  '4%', val: ivaSop4,  set: setIvaSop4  },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} placeholder="0,00"
                className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Compensación de ejercicios anteriores</label>
            <input type="text" inputMode="decimal" value={compensar} onChange={(e) => setCompensar(e.target.value)} placeholder="0,00"
              className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Pagos fraccionados realizados (303 x4)</label>
            <input type="text" inputMode="decimal" value={pagosT} onChange={(e) => setPagosT(e.target.value)} placeholder="0,00"
              className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm bg-background text-right tabular-nums" />
          </div>
        </div>
      </section>

      <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">IVA repercutido total</span><span className="tabular-nums font-medium">{fmt(totalRep)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">− IVA soportado total</span><span className="tabular-nums font-medium">− {fmt(totalSop)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Cuota neta</span><span className="tabular-nums font-medium">{fmt(cuotaNeta)}</span></div>
        <div className="border-t pt-2 flex justify-between font-bold text-base">
          <span>{resultado >= 0 ? 'A ingresar' : 'A devolver'}</span>
          <span className={resultado > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>{fmt(resultado)}</span>
        </div>
      </div>

      {save && (
        <DeclarationSaveBar
          workspaceId={save.workspaceId}
          modelo="390"
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
