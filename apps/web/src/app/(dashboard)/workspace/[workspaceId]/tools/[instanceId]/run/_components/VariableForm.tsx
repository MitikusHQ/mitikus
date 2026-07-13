'use client'

import type { DataSchema, FormConfig } from '@protools/schema'
import { ImportButton } from './ImportButton'

interface Props {
  fields: DataSchema['fields']
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  contextFields?: Set<string>
  formSections?: FormConfig['sections']
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
        rows={field.rows ?? 3}
        required={field.required}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} resize-y`}
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

  if (field.type === 'multiselect' && field.options) {
    const selected = value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []
    function toggle(opt: string) {
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt]
      onChange(next.join(', '))
    }
    return (
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="h-4 w-4 rounded border-input accent-primary shrink-0"
            />
            <span className="text-sm text-foreground group-hover:text-primary leading-snug">{opt}</span>
          </label>
        ))}
      </div>
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

function FieldBlock({
  fieldId,
  field,
  value,
  contextFields,
  onChange,
}: {
  fieldId: string
  field: DataSchema['fields'][string]
  value: string
  contextFields?: Set<string>
  onChange: (fieldId: string, value: string) => void
}) {
  return (
    <div key={fieldId} className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium flex items-center gap-1.5 flex-wrap"
      >
        {field.label}
        {field.required && (
          <span className="text-destructive text-xs" aria-hidden>
            *
          </span>
        )}
        {contextFields?.has(fieldId) && (
          <span className="text-[10px] font-normal text-primary/60 bg-primary/8 border border-primary/20 rounded px-1.5 py-0.5 leading-none">
            📎 contexto
          </span>
        )}
        {field.type === 'textarea' && (
          <ImportButton onImport={(text) => onChange(fieldId, text)} />
        )}
      </label>
      <VariableFieldInput
        fieldId={fieldId}
        field={field}
        value={value}
        onChange={(v) => onChange(fieldId, v)}
      />
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  )
}

export function VariableForm({ fields, values, onChange, onSubmit, isLoading, contextFields, formSections }: Props) {
  function handleFieldChange(fieldId: string, value: string) {
    onChange({ ...values, [fieldId]: value })
  }

  const hasSections = formSections && formSections.length > 0

  // Campos que no pertenecen a ninguna sección (siempre renderizados al final)
  const sectionFieldIds = new Set(hasSections ? formSections.flatMap((s) => s.fieldIds) : [])
  const orphanFields = Object.entries(fields).filter(([id]) => !sectionFieldIds.has(id))

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {Object.keys(fields).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta herramienta no requiere variables. Ejecuta directamente.
        </p>
      ) : hasSections ? (
        <>
          {formSections!.map((section) => (
            <fieldset key={section.id} className="space-y-4">
              <legend className="text-xs font-semibold text-foreground/60 uppercase tracking-wider pb-1 border-b border-border/60 w-full">
                {section.title}
              </legend>
              {section.fieldIds.map((fieldId) => {
                const field = fields[fieldId]
                if (!field) return null
                return (
                  <FieldBlock
                    key={fieldId}
                    fieldId={fieldId}
                    field={field}
                    value={values[fieldId] ?? ''}
                    contextFields={contextFields}
                    onChange={handleFieldChange}
                  />
                )
              })}
            </fieldset>
          ))}
          {orphanFields.map(([fieldId, field]) => (
            <FieldBlock
              key={fieldId}
              fieldId={fieldId}
              field={field}
              value={values[fieldId] ?? ''}
              contextFields={contextFields}
              onChange={handleFieldChange}
            />
          ))}
        </>
      ) : (
        Object.entries(fields).map(([fieldId, field]) => (
          <FieldBlock
            key={fieldId}
            fieldId={fieldId}
            field={field}
            value={values[fieldId] ?? ''}
            contextFields={contextFields}
            onChange={handleFieldChange}
          />
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
