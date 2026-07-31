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

interface Inmueble {
  id: number
  descripcion: string
  importe: string
  retencion: string
}

interface SaveProps { workspaceId: string; periodoLabel: string; initialStatus?: string; initialId?: string; initialData?: Record<string, string> }

export function Modelo115Client({ periodo, save }: { periodo: string; save?: SaveProps }) {
  const d = save?.initialData
  const [inmuebles, setInmuebles] = useState<Inmueble[]>(
    d?.rows ? JSON.parse(d.rows) : [{ id: 1, descripcion: '', importe: '', retencion: '' }],
  )

  const getData = useCallback(() =>
    ({ rows: JSON.stringify(inmuebles) }),
  [inmuebles])

  function handleField(id: number, field: keyof Omit<Inmueble, 'id'>, val: string) {
    setInmuebles((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (field === 'importe') {
          const base = val
          const ret  = val === '' ? '' : (parseNum(val) * 0.19).toFixed(2)
          return { ...item, importe: base, retencion: ret }
        }
        return { ...item, [field]: val }
      }),
    )
  }

  function addRow() {
    setInmuebles((prev) => [...prev, { id: Date.now(), descripcion: '', importe: '', retencion: '' }])
  }

  function removeRow(id: number) {
    setInmuebles((prev) => prev.filter((i) => i.id !== id))
  }

  const totalImporte   = inmuebles.reduce((acc, i) => acc + parseNum(i.importe), 0)
  const totalRetencion = inmuebles.reduce((acc, i) => acc + parseNum(i.retencion), 0)

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Arrendamientos del trimestre
        </h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Inmueble / descripción</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-36">Importe alquiler</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-36">Retención (19%)</th>
                <th className="w-10"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inmuebles.map((item) => (
                <tr key={item.id} className="bg-card">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => handleField(item.id, 'descripcion', e.target.value)}
                      placeholder="Ej: Oficina c/ Gran Vía 12"
                      className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text" inputMode="decimal"
                      value={item.importe}
                      onChange={(e) => handleField(item.id, 'importe', e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text" inputMode="decimal"
                      value={item.retencion}
                      onChange={(e) => handleField(item.id, 'retencion', e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {inmuebles.length > 1 && (
                      <button
                        onClick={() => removeRow(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none"
                        aria-label="Eliminar fila"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-4 py-2.5 text-right text-muted-foreground">Totales</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totalImporte)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totalRetencion)}</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          onClick={addRow}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          + Añadir inmueble
        </button>
      </section>

      <section className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resultado</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total arrendamientos</span>
            <span className="tabular-nums font-medium">{fmt(totalImporte)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-base font-bold">
            <span>A ingresar (Mod. 115) {periodo}</span>
            <span className={totalRetencion > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
              {fmt(totalRetencion)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Retención del 19% sobre el importe bruto del alquiler. Presentación en la{' '}
          <a href="https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-115.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            sede electrónica de la AEAT
          </a>.
        </p>
        {save && (
          <DeclarationSaveBar
            workspaceId={save.workspaceId} modelo="115"
            periodo={save.periodoLabel.split(' ')[0]!} year={Number(save.periodoLabel.split(' ')[1])}
            resultado={totalRetencion} getData={getData}
            initialStatus={save.initialStatus} initialId={save.initialId}
          />
        )}
      </section>
    </div>
  )
}
