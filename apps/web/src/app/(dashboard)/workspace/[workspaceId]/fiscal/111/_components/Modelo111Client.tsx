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

interface Group {
  id: string
  label: string
  hint: string
  rendimientos: string
  retenciones: string
}

const INITIAL_GROUPS: Group[] = [
  { id: 'trabajadores', label: 'Rendimientos del trabajo (empleados)',      hint: 'Nóminas brutas pagadas en el trimestre',              rendimientos: '', retenciones: '' },
  { id: 'profesionales', label: 'Rendimientos de actividades profesionales', hint: 'Facturas de profesionales con retención (abogados, consultores…)', rendimientos: '', retenciones: '' },
  { id: 'administradores', label: 'Retribuciones a administradores',         hint: 'Remuneraciones a miembros del consejo / administradores', rendimientos: '', retenciones: '' },
  { id: 'arrendamientos', label: 'Arrendamientos de inmuebles',              hint: 'Alquileres pagados sujetos a retención',                 rendimientos: '', retenciones: '' },
]

interface SaveProps { workspaceId: string; periodoLabel: string; initialStatus?: string; initialId?: string; initialData?: Record<string, string> }

export function Modelo111Client({ periodo, save }: { periodo: string; save?: SaveProps }) {
  const d = save?.initialData
  const [groups, setGroups] = useState<Group[]>(
    d ? INITIAL_GROUPS.map((g) => ({ ...g, rendimientos: d[`r_${g.id}`] ?? '', retenciones: d[`t_${g.id}`] ?? '' }))
      : INITIAL_GROUPS,
  )

  const getData = useCallback(() => {
    const out: Record<string, string> = {}
    groups.forEach((g) => { out[`r_${g.id}`] = g.rendimientos; out[`t_${g.id}`] = g.retenciones })
    return out
  }, [groups])

  function handleField(id: string, field: 'rendimientos' | 'retenciones', val: string) {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, [field]: val } : g))
  }

  const totalRendimientos = groups.reduce((acc, g) => acc + parseNum(g.rendimientos), 0)
  const totalRetenciones  = groups.reduce((acc, g) => acc + parseNum(g.retenciones), 0)

  const hasData = totalRetenciones > 0

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Retenciones practicadas en el trimestre
        </h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Concepto</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-40">Rendimientos</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-40">Retenciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g) => (
                <tr key={g.id} className="bg-card">
                  <td className="px-4 py-3">
                    <p className="font-medium">{g.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.hint}</p>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text" inputMode="decimal"
                      value={g.rendimientos}
                      onChange={(e) => handleField(g.id, 'rendimientos', e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text" inputMode="decimal"
                      value={g.retenciones}
                      onChange={(e) => handleField(g.id, 'retenciones', e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums text-sm"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-4 py-2.5 text-muted-foreground text-right">Totales</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totalRendimientos)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totalRetenciones)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resultado</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total rendimientos satisfechos</span>
            <span className="tabular-nums font-medium">{fmt(totalRendimientos)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-base font-bold">
            <span>A ingresar (Mod. 111) {periodo}</span>
            <span className={hasData ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
              {fmt(totalRetenciones)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Importe igual a la suma de retenciones practicadas. La presentación oficial en la{' '}
          <a href="https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-111.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            sede electrónica de la AEAT
          </a>.
        </p>
        {save && (
          <DeclarationSaveBar
            workspaceId={save.workspaceId} modelo="111"
            periodo={save.periodoLabel.split(' ')[0]!} year={Number(save.periodoLabel.split(' ')[1])}
            resultado={totalRetenciones} getData={getData}
            initialStatus={save.initialStatus} initialId={save.initialId}
          />
        )}
      </section>
    </div>
  )
}
