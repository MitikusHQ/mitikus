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

const GROUPS = [
  { key: 'trabajadores',    label: 'Trabajadores (rendimientos trabajo)' },
  { key: 'profesionales',   label: 'Profesionales (rendimientos act. profesional)' },
  { key: 'administradores', label: 'Administradores y consejeros' },
  { key: 'arrendamientos',  label: 'Arrendamientos de inmuebles' },
] as const

export function Modelo190Client({ year, save }: Props) {
  const p = save?.initialData ?? {}
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    GROUPS.forEach((g) => { init[`r_${g.key}`] = p[`r_${g.key}`] ?? ''; init[`t_${g.key}`] = p[`t_${g.key}`] ?? '' })
    return init
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setVals((prev) => ({ ...prev, [k]: e.target.value }))

  const totalRetenciones = GROUPS.reduce((s, g) => s + parseNum(vals[`r_${g.key}`] ?? ''), 0)
  const totalRendimientos = GROUPS.reduce((s, g) => s + parseNum(vals[`t_${g.key}`] ?? ''), 0)

  const getData = useCallback(() => ({ ...vals }), [vals])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Grupo</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Rendimientos pagados (€)</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Retenciones (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {GROUPS.map((g) => (
              <tr key={g.key} className="bg-card">
                <td className="px-4 py-2.5 text-muted-foreground">{g.label}</td>
                <td className="px-4 py-2 text-right">
                  <input type="text" inputMode="decimal" value={vals[`t_${g.key}`] ?? ''} onChange={set(`t_${g.key}`)} placeholder="0,00"
                    className="w-32 border rounded-md px-2 py-1 text-sm bg-background text-right tabular-nums" />
                </td>
                <td className="px-4 py-2 text-right">
                  <input type="text" inputMode="decimal" value={vals[`r_${g.key}`] ?? ''} onChange={set(`r_${g.key}`)} placeholder="0,00"
                    className="w-32 border rounded-md px-2 py-1 text-sm bg-background text-right tabular-nums" />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/30">
            <tr>
              <td className="px-4 py-2.5 font-semibold">Total</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-medium">{fmt(totalRendimientos)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-bold">{fmt(totalRetenciones)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Rendimientos totales pagados</span><span className="tabular-nums font-medium">{fmt(totalRendimientos)}</span></div>
        <div className="border-t pt-2 flex justify-between font-bold text-base">
          <span>Retenciones totales a ingresar</span>
          <span className={totalRetenciones > 0 ? 'text-red-600 dark:text-red-400' : ''}>{fmt(totalRetenciones)}</span>
        </div>
      </div>

      {save && (
        <DeclarationSaveBar
          workspaceId={save.workspaceId}
          modelo="190"
          periodo="Anual"
          year={year}
          resultado={totalRetenciones}
          getData={getData}
          initialStatus={save.initialStatus}
          initialId={save.initialId}
        />
      )}
    </div>
  )
}
