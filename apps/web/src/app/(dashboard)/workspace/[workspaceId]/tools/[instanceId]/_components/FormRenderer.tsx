'use client'

import { useActionState } from 'react'
import type { DataSchema, FormConfig } from '@protools/schema'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { localizeText } from '@/lib/localized-content'

type FormState = { error: string } | null
type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>

interface Props {
  action: FormAction
  instanceId: string
  dataSchema: DataSchema
  formConfig: FormConfig
  defaultValues?: Record<string, unknown>
  recordId?: string
  locale: Locale
}

function FieldInput({
  fieldId,
  field,
  defaultValue,
  locale,
}: {
  fieldId: string
  field: DataSchema['fields'][string]
  defaultValue?: unknown
  locale: Locale
}) {
  const t = getDashboardTranslations(locale)
  const base =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  if (field.type === 'textarea') {
    return (
      <textarea
        id={fieldId}
        name={fieldId}
        rows={field.rows ?? 3}
        required={field.required}
        placeholder={localizeText(field.placeholder, locale)}
        defaultValue={defaultValue != null ? String(defaultValue) : ''}
        className={`${base} resize-y`}
      />
    )
  }

  if (field.type === 'multiselect' && field.options) {
    const current = defaultValue != null ? String(defaultValue) : ''
    const selected = current ? current.split(',').map((v) => v.trim()).filter(Boolean) : []
    return (
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name={`${fieldId}[]`}
              value={opt}
              defaultChecked={selected.includes(opt)}
              className="h-4 w-4 rounded border-input accent-primary shrink-0"
            />
            <span className="text-sm leading-snug">{localizeText(opt, locale) ?? opt}</span>
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        id={fieldId}
        name={fieldId}
        required={field.required}
        defaultValue={defaultValue != null ? String(defaultValue) : ''}
        className={base}
      >
        <option value="">{t.toolSelectPlaceholder}</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {localizeText(opt, locale) ?? opt}
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
          name={fieldId}
          type="checkbox"
          defaultChecked={Boolean(defaultValue)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-sm text-muted-foreground">{t.toolYes}</span>
      </div>
    )
  }

  const inputType: React.HTMLInputTypeAttribute =
    field.type === 'number' ? 'number'
    : field.type === 'date' ? 'date'
    : field.type === 'email' ? 'email'
    : field.type === 'phone' ? 'tel'
    : field.type === 'url' ? 'url'
    : 'text'

  const dateValue =
    field.type === 'date' && defaultValue
      ? String(defaultValue).substring(0, 10)
      : undefined

  return (
    <input
      id={fieldId}
      name={fieldId}
      type={inputType}
      required={field.required}
      placeholder={localizeText(field.placeholder, locale)}
      min={field.min}
      max={field.max}
      defaultValue={dateValue ?? (defaultValue != null ? String(defaultValue) : '')}
      className={base}
    />
  )
}

export function FormRenderer({
  action,
  instanceId,
  dataSchema,
  formConfig,
  defaultValues = {},
  recordId,
  locale,
}: Props) {
  const t = getDashboardTranslations(locale)
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, null)

  const submitLabel = localizeText(formConfig.submitLabel, locale) ?? t.toolSettingsSave

  // Obtener la lista de secciones o crear una sección virtual con todos los campos
  const sections =
    formConfig.layout === 'sections' && formConfig.sections?.length
      ? formConfig.sections
      : [
          {
            id: '__all__',
            title: '',
            fieldIds: Object.keys(dataSchema.fields),
          },
        ]

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="instanceId" value={instanceId} />
      {recordId && <input type="hidden" name="recordId" value={recordId} />}

      {sections.map((section) => (
        <fieldset key={section.id} className="space-y-4">
          {section.title && (
            <legend className="text-sm font-semibold text-foreground pb-1 border-b w-full">
              {localizeText(section.title, locale)}
            </legend>
          )}

          {section.fieldIds.map((fieldId) => {
            const field = dataSchema.fields[fieldId]
            if (!field) return null
            return (
              <div key={fieldId} className="space-y-1">
                <label
                  htmlFor={fieldId}
                  className={`text-sm font-medium ${field.required ? '' : 'text-muted-foreground'}`}
                >
                  {localizeText(field.label, locale) ?? field.label}
                  {field.required && (
                    <span className="ml-1 text-destructive" aria-hidden>
                      *
                    </span>
                  )}
                </label>
                <FieldInput
                  fieldId={fieldId}
                  field={field}
                  defaultValue={defaultValues[fieldId]}
                  locale={locale}
                />
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{localizeText(field.helpText, locale)}</p>
                )}
              </div>
            )
          })}
        </fieldset>
      ))}

      {state?.error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? `${t.toolApprovalSaving.replace('...', '')}…` : submitLabel}
      </button>
    </form>
  )
}
