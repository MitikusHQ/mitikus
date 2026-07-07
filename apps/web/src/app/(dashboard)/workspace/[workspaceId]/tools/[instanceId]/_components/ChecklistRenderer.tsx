'use client'

import { useState, useTransition } from 'react'
import type { ChecklistConfig, DataSchema } from '@protools/schema'
import { saveChecklistRecord } from '@/app/actions/record'

interface Props {
  instanceId: string
  workspaceId: string
  dataSchema: DataSchema
  checklistConfig: ChecklistConfig
  defaultValues?: Record<string, unknown>
  defaultItems?: Record<string, boolean>
  recordId?: string
}

const INPUT_BASE =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

export function ChecklistRenderer({
  instanceId,
  workspaceId,
  dataSchema,
  checklistConfig,
  defaultValues = {},
  defaultItems = {},
  recordId,
}: Props) {
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>(
    () => {
      const init: Record<string, string | boolean> = {}
      for (const [id, field] of Object.entries(dataSchema.fields)) {
        const v = defaultValues[id]
        init[id] = field.type === 'boolean' ? Boolean(v) : v != null ? String(v) : ''
      }
      return init
    },
  )

  const [items, setItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const item of checklistConfig.items) {
      init[item.id] = defaultItems[item.id] ?? false
    }
    return init
  })

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const totalItems = checklistConfig.items.length
  const checkedCount = Object.values(items).filter(Boolean).length
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  const hasFormFields = Object.keys(dataSchema.fields).length > 0

  // Build category groups for checklist items
  const orderedCategories: string[] = checklistConfig.categories
    ? checklistConfig.categories
    : [...new Set(checklistConfig.items.map((i) => i.category).filter((c): c is string => !!c))]

  const grouped: Array<{ name: string; items: typeof checklistConfig.items }> = []
  for (const cat of orderedCategories) {
    const catItems = checklistConfig.items.filter((i) => i.category === cat)
    if (catItems.length > 0) grouped.push({ name: cat, items: catItems })
  }
  const uncategorized = checklistConfig.items.filter((i) => !i.category)
  if (uncategorized.length > 0) grouped.push({ name: '', items: uncategorized })

  function setField(id: string, value: string | boolean) {
    setFormValues((prev) => ({ ...prev, [id]: value }))
  }

  function toggleItem(itemId: string) {
    setItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  function handleSave() {
    // Validate required fields
    for (const [id, field] of Object.entries(dataSchema.fields)) {
      if (field.required && field.type !== 'boolean') {
        const v = formValues[id]
        if (!v || v === '') {
          setError(`El campo "${field.label}" es obligatorio.`)
          return
        }
      }
    }

    // Validate required checklist items
    for (const item of checklistConfig.items) {
      if (item.required && !items[item.id]) {
        setError(`El ítem "${item.label}" es obligatorio.`)
        return
      }
    }

    setError(null)

    const formFields: Record<string, unknown> = {}
    for (const [id, field] of Object.entries(dataSchema.fields)) {
      const v = formValues[id]
      if (field.type === 'boolean') {
        formFields[id] = Boolean(v)
      } else if (field.type === 'number') {
        formFields[id] = v !== '' ? Number(v) : null
      } else {
        formFields[id] = v !== '' ? v : null
      }
    }

    startTransition(async () => {
      const result = await saveChecklistRecord(instanceId, formFields, items, recordId)
      if (result?.error) {
        setError(result.error)
      } else {
        window.location.href = `/workspace/${workspaceId}/tools/${instanceId}`
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Form fields section */}
      {hasFormFields && (
        <section className="space-y-4">
          {Object.entries(dataSchema.fields).map(([fieldId, field]) => (
            <div key={fieldId} className="space-y-1">
              <label htmlFor={fieldId} className="text-sm font-medium">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-destructive" aria-hidden>*</span>
                )}
              </label>
              {field.type === 'boolean' ? (
                <div className="flex items-center gap-2 py-1">
                  <input
                    id={fieldId}
                    type="checkbox"
                    checked={Boolean(formValues[fieldId])}
                    onChange={(e) => setField(fieldId, e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">Sí</span>
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={fieldId}
                  rows={3}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={String(formValues[fieldId] ?? '')}
                  onChange={(e) => setField(fieldId, e.target.value)}
                  className={`${INPUT_BASE} resize-none`}
                />
              ) : field.type === 'select' && field.options ? (
                <select
                  id={fieldId}
                  required={field.required}
                  value={String(formValues[fieldId] ?? '')}
                  onChange={(e) => setField(fieldId, e.target.value)}
                  className={INPUT_BASE}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={fieldId}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  required={field.required}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  value={
                    field.type === 'date'
                      ? String(formValues[fieldId] ?? '').substring(0, 10)
                      : String(formValues[fieldId] ?? '')
                  }
                  onChange={(e) => setField(fieldId, e.target.value)}
                  className={INPUT_BASE}
                />
              )}
              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Checklist section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {checklistConfig.items.length > 0 ? 'Checklist' : ''}
          </h2>
        </div>

        {/* Progress bar */}
        {checklistConfig.showProgress !== false && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {checkedCount} de {totalItems} completados
              </span>
              <span className="font-semibold">{percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        {grouped.map((group) => (
          <div key={group.name || '__all__'} className="space-y-2">
            {group.name && (
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">
                {group.name}
              </h3>
            )}
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                    items[item.id]
                      ? 'bg-primary/5 border-primary/30'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={items[item.id] ?? false}
                    onChange={() => toggleItem(item.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span
                      className={`text-sm ${
                        items[item.id] ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.label}
                      {item.required && !items[item.id] && (
                        <span className="ml-1.5 text-xs text-destructive font-normal">
                          Obligatorio
                        </span>
                      )}
                    </span>
                    {item.helpText && (
                      <p className="text-xs text-muted-foreground">{item.helpText}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending
          ? 'Guardando…'
          : recordId
          ? 'Actualizar checklist'
          : 'Guardar checklist'}
      </button>
    </div>
  )
}
