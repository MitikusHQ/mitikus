'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { AuditAction, AuditEntityType, AuditResult } from '@/lib/audit'
import type { AuditFilterOptions } from '@/app/actions/audit'

interface Props {
  options: AuditFilterOptions
}

const ACTION_OPTIONS: Array<{ value: AuditAction; label: string }> = [
  { value: 'tool.install',      label: 'Instalar herramienta' },
  { value: 'tool.configure',    label: 'Configurar herramienta' },
  { value: 'tool.execute',      label: 'Ejecutar herramienta' },
  { value: 'workflow.create',   label: 'Crear workflow' },
  { value: 'workflow.update',   label: 'Actualizar workflow' },
  { value: 'workflow.delete',   label: 'Eliminar workflow' },
  { value: 'workflow.execute',  label: 'Ejecutar workflow' },
  { value: 'workflow.graph_save', label: 'Guardar grafo' },
  { value: 'record.create',     label: 'Crear registro' },
  { value: 'record.update',     label: 'Actualizar registro' },
  { value: 'record.delete',     label: 'Eliminar registro' },
  { value: 'favorite.add',      label: 'Añadir favorito' },
  { value: 'favorite.remove',   label: 'Quitar favorito' },
  { value: 'access.denied',     label: 'Acceso denegado' },
]

const ENTITY_OPTIONS: Array<{ value: AuditEntityType; label: string }> = [
  { value: 'tool_instance',   label: 'Herramienta' },
  { value: 'tool_definition', label: 'Definición' },
  { value: 'workflow',        label: 'Workflow' },
  { value: 'record',          label: 'Registro' },
]

const RESULT_OPTIONS: Array<{ value: AuditResult; label: string }> = [
  { value: 'success', label: 'Éxito' },
  { value: 'failure', label: 'Error' },
  { value: 'denied',  label: 'Denegado' },
]

export function AuditFilters({ options }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('offset')  // reset pagination on filter change
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const current = (key: string) => searchParams.get(key) ?? ''

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Acción */}
      <div className="flex flex-col gap-1 min-w-[170px]">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Acción</label>
        <select
          value={current('action')}
          onChange={(e) => setParam('action', e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas</option>
          {ACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Entidad */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entidad</label>
        <select
          value={current('entityType')}
          onChange={(e) => setParam('entityType', e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas</option>
          {ENTITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Resultado */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</label>
        <select
          value={current('result')}
          onChange={(e) => setParam('result', e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos</option>
          {RESULT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Actor */}
      {options.actors.length > 0 && (
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Usuario</label>
          <select
            value={current('actorUserId')}
            onChange={(e) => setParam('actorUserId', e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {options.actors.map((a) => (
              <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
            ))}
          </select>
        </div>
      )}

      {/* Desde */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desde</label>
        <input
          type="date"
          value={current('from')}
          onChange={(e) => setParam('from', e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Hasta */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hasta</label>
        <input
          type="date"
          value={current('to')}
          onChange={(e) => setParam('to', e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Limpiar */}
      {['action', 'entityType', 'result', 'actorUserId', 'from', 'to'].some((k) => searchParams.has(k)) && (
        <button
          type="button"
          onClick={() => router.replace(pathname)}
          className="h-9 self-end px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  )
}
