'use client'

import { useState } from 'react'
import { updateMemberNavPermissions } from '@/app/actions/org'
import { NAV_SECTIONS, NAV_DEFAULTS, type NavSection } from '@/lib/nav-permissions'
import type { OrgRole } from '@prisma/client'

const SECTION_LABELS: Record<NavSection, string> = {
  today:     'Mi día',
  arkos:     'Arkos',
  brain:     'Brain',
  mail:      'Correo',
  clients:   'Clientes',
  leads:     'Leads',
  tasks:     'Tareas',
  tools:     'Herramientas',
  workflows: 'Flujos',
  studio:    'Studio',
  files:     'Archivos',
  missions:  'Misiones',
  employees: 'Empleados',
  payroll:   'Nóminas',
  leaves:    'Permisos',
  fiscal:    'Fiscal',
  invoices:  'Facturas',
  receipts:  'Gastos',
  analytics: 'Analítica',
  admin:     'Admin Org',
  settings:  'Ajustes',
}

interface Props {
  memberId: string
  memberRole: OrgRole
  navPermissions: string[]
  onClose: () => void
}

export function NavPermissionsEditor({ memberId, memberRole, navPermissions: initial, onClose }: Props) {
  const defaults = NAV_DEFAULTS[memberRole] ?? []
  const active = initial.length > 0 ? initial : defaults
  const [selected, setSelected] = useState<Set<string>>(new Set(active))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(section: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(section) ? next.delete(section) : next.add(section)
      return next
    })
  }

  function resetToDefaults() {
    setSelected(new Set(defaults))
  }

  async function save() {
    setSaving(true)
    setError(null)
    const result = await updateMemberNavPermissions(memberId, [...selected])
    setSaving(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Secciones visibles</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Marca las secciones que este miembro podrá ver en el menú lateral. Las no marcadas quedan ocultas.
        </p>

        <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
          {NAV_SECTIONS.map((section) => (
            <label key={section} className="flex items-center gap-2 text-sm cursor-pointer select-none rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={selected.has(section)}
                onChange={() => toggle(section)}
                className="rounded"
              />
              {SECTION_LABELS[section]}
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Restablecer por defecto
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
