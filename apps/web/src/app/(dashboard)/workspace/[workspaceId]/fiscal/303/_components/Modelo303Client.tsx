'use client'

import { useState, useCallback } from 'react'
import { DeclarationSaveBar } from '../../_components/DeclarationSaveBar'

interface Section {
  id: string
  label: string
  tipo: 'repercutido' | 'soportado'
  tipo_iva: number
  base: string
  cuota: string
}

const INITIAL_SECTIONS: Section[] = [
  { id: 'rep-21', label: 'Ventas / servicios tipo general',     tipo: 'repercutido', tipo_iva: 21, base: '', cuota: '' },
  { id: 'rep-10', label: 'Ventas / servicios tipo reducido',    tipo: 'repercutido', tipo_iva: 10, base: '', cuota: '' },
  { id: 'rep-4',  label: 'Ventas / servicios tipo superred.',   tipo: 'repercutido', tipo_iva: 4,  base: '', cuota: '' },
  { id: 'sop-21', label: 'Compras / gastos tipo general',       tipo: 'soportado',   tipo_iva: 21, base: '', cuota: '' },
  { id: 'sop-10', label: 'Compras / gastos tipo reducido',      tipo: 'soportado',   tipo_iva: 10, base: '', cuota: '' },
  { id: 'sop-4',  label: 'Compras / gastos tipo superred.',     tipo: 'soportado',   tipo_iva: 4,  base: '', cuota: '' },
]

function parseNum(val: string): number {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

interface SaveProps {
  workspaceId: string
  periodoLabel: string // "T2 2025"
  initialStatus?: string
  initialId?: string
  initialData?: Record<string, string>
}

export function Modelo303Client({ periodo, save }: { periodo: string; save?: SaveProps }) {
  const initData = save?.initialData
  const [sections, setSections] = useState<Section[]>(
    initData
      ? INITIAL_SECTIONS.map((s) => ({
          ...s,
          base:  (initData[`base_${s.id}`] ?? '') as string,
          cuota: (initData[`cuota_${s.id}`] ?? '') as string,
        }))
      : INITIAL_SECTIONS,
  )
  const [compensar, setCompensar] = useState(initData?.compensar as string ?? '')

  const getData = useCallback(() => {
    const d: Record<string, string> = { compensar }
    sections.forEach((s) => { d[`base_${s.id}`] = s.base; d[`cuota_${s.id}`] = s.cuota })
    return d
  }, [sections, compensar])

  function handleBase(id: string, val: string) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const base = val
        const cuota = val === '' ? '' : (parseNum(val) * s.tipo_iva / 100).toFixed(2)
        return { ...s, base, cuota }
      }),
    )
  }

  function handleCuota(id: string, val: string) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, cuota: val } : s))
  }

  const repercutido = sections
    .filter((s) => s.tipo === 'repercutido')
    .reduce((acc, s) => acc + parseNum(s.cuota), 0)

  const soportado = sections
    .filter((s) => s.tipo === 'soportado')
    .reduce((acc, s) => acc + parseNum(s.cuota), 0)

  const compensacion = parseNum(compensar)
  const resultado = repercutido - soportado - compensacion

  const resultadoLabel = resultado > 0
    ? `A ingresar: ${fmt(resultado)}`
    : resultado < 0
      ? `A compensar: ${fmt(Math.abs(resultado))}`
      : 'Resultado: 0,00 €'

  const resultadoColor = resultado > 0
    ? 'text-red-600 dark:text-red-400'
    : resultado < 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-muted-foreground'

  return (
    <div className="space-y-8">
      {/* IVA repercutido */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          IVA repercutido (ventas / ingresos)
        </h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Concepto</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground w-28">Tipo</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-36">Base imponible</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-36">Cuota IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sections.filter((s) => s.tipo === 'repercutido').map((s) => (
                <tr key={s.id} className="bg-card">
                  <td className="px-4 py-2">{s.label}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.tipo_iva}%</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.base}
                      onChange={(e) => handleBase(s.id, e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.cuota}
                      onChange={(e) => handleCuota(s.id, e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-medium">
                <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Total IVA repercutido</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmt(repercutido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* IVA soportado */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          IVA soportado deducible (compras / gastos)
        </h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Concepto</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground w-28">Tipo</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-36">Base imponible</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-36">Cuota IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sections.filter((s) => s.tipo === 'soportado').map((s) => (
                <tr key={s.id} className="bg-card">
                  <td className="px-4 py-2">{s.label}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.tipo_iva}%</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.base}
                      onChange={(e) => handleBase(s.id, e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.cuota}
                      onChange={(e) => handleCuota(s.id, e.target.value)}
                      placeholder="0,00"
                      className="w-full text-right bg-transparent border-b border-transparent focus:border-primary outline-none py-0.5 tabular-nums"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-medium">
                <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Total IVA soportado</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmt(soportado)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Compensación de períodos anteriores */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Compensación de períodos anteriores
        </h2>
        <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3">
          <label className="text-sm text-muted-foreground flex-1">
            Cuotas a compensar de declaraciones anteriores
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={compensar}
            onChange={(e) => setCompensar(e.target.value)}
            placeholder="0,00"
            className="w-36 text-right bg-transparent border-b border-muted focus:border-primary outline-none py-0.5 text-sm tabular-nums"
          />
        </div>
      </section>

      {/* Resultado */}
      <section className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resultado</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA repercutido</span>
            <span className="tabular-nums font-medium">{fmt(repercutido)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">− IVA soportado deducible</span>
            <span className="tabular-nums font-medium">− {fmt(soportado)}</span>
          </div>
          {compensacion > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">− Compensación anterior</span>
              <span className="tabular-nums font-medium">− {fmt(compensacion)}</span>
            </div>
          )}
          <div className="border-t pt-3 flex justify-between text-base font-semibold">
            <span>Resultado {periodo}</span>
            <span className={resultadoColor}>{resultadoLabel}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Este cálculo es orientativo. Consulta con tu asesor antes de presentar. La presentación oficial se realiza en la{' '}
          <a href="https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            sede electrónica de la AEAT
          </a>.
        </p>
        {save && (
          <DeclarationSaveBar
            workspaceId={save.workspaceId}
            modelo="303"
            periodo={save.periodoLabel.split(' ')[0]!}
            year={Number(save.periodoLabel.split(' ')[1])}
            resultado={resultado}
            getData={getData}
            initialStatus={save.initialStatus}
            initialId={save.initialId}
          />
        )}
      </section>
    </div>
  )
}
