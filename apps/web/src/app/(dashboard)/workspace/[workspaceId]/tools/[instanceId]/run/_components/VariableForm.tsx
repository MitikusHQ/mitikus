'use client'

import type { DataSchema } from '@protools/schema'

interface Props {
  fields: DataSchema['fields']
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

function VariableFieldInput({
  fieldId,
  field,
  value,
  onChange,
}: {
  fieldId: string
  field: DataSchema['fields'][string]
  value: string
  onChange: (v: string) => void
}) {
  const base =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  if (field.type === 'textarea') {
    return (
      <textarea
        id={fieldId}
        rows={3}
        required={field.required}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} resize-none`}
      />
    )
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        id={fieldId}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        <option value="">Selecciona una opción</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center gap-2 py-1">
        <input
          id={fieldId}
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-sm text-muted-foreground">Sí</span>
      </div>
    )
  }

  const inputType =
    field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'

  return (
    <input
      id={fieldId}
      type={inputType}
      required={field.required}
      placeholder={field.placeholder}
      min={field.min}
      max={field.max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  )
}

export function VariableForm({ fields, values, onChange, onSubmit, isLoading }: Props) {
  const fieldEntries = Object.entries(fields)

  function handleFieldChange(fieldId: string, value: string) {
    onChange({ ...values, [fieldId]: value })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {fieldEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta herramienta no requiere variables. Ejecuta directamente.
        </p>
      ) : (
        fieldEntries.map(([fieldId, field]) => (
          <div key={fieldId} className="space-y-1.5">
            <label
              htmlFor={fieldId}
              className="text-sm font-medium flex items-center gap-1"
            >
              {field.label}
              {field.required && (
                <span className="text-destructive text-xs" aria-hidden>
                  *
                </span>
              )}
            </label>
            <VariableFieldInput
              fieldId={fieldId}
              field={field}
              value={values[fieldId] ?? ''}
              onChange={(v) => handleFieldChange(fieldId, v)}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        ))
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
            Generando…
          </>
        ) : (
          '✨ Ejecutar con IA'
        )}
      </button>
    </form>
  )
}
