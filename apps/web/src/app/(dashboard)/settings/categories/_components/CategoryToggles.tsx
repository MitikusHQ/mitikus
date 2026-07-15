'use client'

import { useState } from 'react'
import type { ToolCategory } from '@prisma/client'

const ALL_CATEGORIES: ToolCategory[] = [
  'AUDIT',
  'EVALUATION',
  'CHECKLIST',
  'CRM',
  'REPORT',
  'HR',
  'OPERATIONS',
  'FINANCE',
  'CUSTOM',
]

interface Props {
  enabledCategories: ToolCategory[]
  categoryLabels: Record<ToolCategory, string>
}

export function CategoryToggles({ enabledCategories: initial, categoryLabels }: Props) {
  const [enabled, setEnabled] = useState<Set<ToolCategory>>(
    initial.length === 0 ? new Set(ALL_CATEGORIES) : new Set(initial),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(cat: ToolCategory) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        if (next.size <= 1) return prev // al menos una debe quedar activa
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const categories = enabled.size === ALL_CATEGORIES.length ? [] : Array.from(enabled)
    const res = await fetch('/api/org/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al guardar')
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {ALL_CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors"
          >
            <span className="text-sm font-medium">{categoryLabels[cat]}</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled.has(cat)}
              onClick={() => toggle(cat)}
              className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                enabled.has(cat) ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  enabled.has(cat) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-xs text-green-600 dark:text-green-400">Guardado ✓</span>}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  )
}
