'use client'

import { useActionState, useState } from 'react'
import { createClient, updateClient, type ClientActionState } from '@/app/actions/client'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'

interface ClientData {
  id: string
  name: string
  clientType: string
  contactName: string | null
  email: string | null
  phone: string | null
  taxId: string | null
  fiscalAddress: string | null
  postalCode: string | null
  city: string | null
  province: string | null
  country: string | null
  sector: string | null
  notes: string | null
}

interface Props {
  workspaceId: string
  client?: ClientData
  locale: Locale
}

function clientTypes(t: DashboardTranslations) {
  return [
    { value: 'client', label: t.clientsTypeClient, nameLabel: t.clientsTypeClientNameLabel, namePlaceholder: t.clientsTypeClientNamePlaceholder, contactLabel: t.clientsTypeClientContactLabel, contactPlaceholder: t.clientsTypeClientContactPlaceholder },
    { value: 'company', label: t.clientsTypeCompany, nameLabel: t.clientsTypeCompanyNameLabel, namePlaceholder: t.clientsTypeCompanyNamePlaceholder, contactLabel: t.clientsTypeClientContactLabel, contactPlaceholder: t.clientsTypeCompanyContactPlaceholder },
    { value: 'freelancer', label: t.clientsTypeFreelancer, nameLabel: t.clientsTypeFreelancerNameLabel, namePlaceholder: t.clientsTypeFreelancerNamePlaceholder, contactLabel: t.clientsTypeClientContactLabel, contactPlaceholder: t.clientsTypeFreelancerContactPlaceholder },
    { value: 'individual', label: t.clientsTypeIndividual, nameLabel: t.clientsTypeIndividualNameLabel, namePlaceholder: t.clientsTypeIndividualNamePlaceholder, contactLabel: t.clientsTypeIndividualContactLabel, contactPlaceholder: t.clientsTypeIndividualContactPlaceholder },
    { value: 'patient', label: t.clientsTypePatient, nameLabel: t.clientsTypePatientNameLabel, namePlaceholder: t.clientsTypePatientNamePlaceholder, contactLabel: t.clientsTypePatientContactLabel, contactPlaceholder: t.clientsTypePatientContactPlaceholder },
    { value: 'student', label: t.clientsTypeStudent, nameLabel: t.clientsTypeStudentNameLabel, namePlaceholder: t.clientsTypeStudentNamePlaceholder, contactLabel: t.clientsTypeStudentContactLabel, contactPlaceholder: t.clientsTypeStudentContactPlaceholder },
    { value: 'athlete', label: t.clientsTypeAthlete, nameLabel: t.clientsTypeAthleteNameLabel, namePlaceholder: t.clientsTypeAthleteNamePlaceholder, contactLabel: t.clientsTypeAthleteContactLabel, contactPlaceholder: t.clientsTypeAthleteContactPlaceholder },
    { value: 'event', label: t.clientsTypeEvent, nameLabel: t.clientsTypeEventNameLabel, namePlaceholder: t.clientsTypeEventNamePlaceholder, contactLabel: t.clientsTypeClientContactLabel, contactPlaceholder: t.clientsTypeEventContactPlaceholder },
  ]
}

export function ClientForm({ workspaceId, client, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const clientTypeOptions = clientTypes(t)
  const action = client ? updateClient : createClient
  const [clientType, setClientType] = useState(client?.clientType ?? 'client')
  const selectedType = clientTypeOptions.find((type) => type.value === clientType) ?? clientTypeOptions[0]!
  const [state, formAction, isPending] = useActionState<ClientActionState, FormData>(
    action,
    null,
  )

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {client && <input type="hidden" name="clientId" value={client.id} />}

      <div className="space-y-1">
        <label htmlFor="clientType" className="text-sm font-medium text-muted-foreground">
          {t.clientsTypeLabel}
        </label>
        <select
          id="clientType"
          name="clientType"
          value={clientType}
          onChange={(e) => setClientType(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {clientTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          {selectedType.nameLabel} <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus={!client}
          defaultValue={client?.name ?? ''}
          placeholder={selectedType.namePlaceholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contactName" className="text-sm font-medium text-muted-foreground">
          {selectedType.contactLabel}
        </label>
        <input
          id="contactName"
          name="contactName"
          type="text"
          defaultValue={client?.contactName ?? ''}
          placeholder={selectedType.contactPlaceholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          {t.clientsContactHelp}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={client?.email ?? ''}
          placeholder="contacto@empresa.com"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">
          {t.clientsPhone}
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={client?.phone ?? ''}
          placeholder="+34 600 000 000"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40 p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t.clientsFiscalDataTitle}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.clientsFiscalDataDescription}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="taxId" className="text-sm font-medium text-muted-foreground">
              NIF/CIF
            </label>
            <input
              id="taxId"
              name="taxId"
              type="text"
              defaultValue={client?.taxId ?? ''}
              placeholder="12345678Z o B12345678"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="country" className="text-sm font-medium text-muted-foreground">
              {t.clientsCountry}
            </label>
            <input
              id="country"
              name="country"
              type="text"
              defaultValue={client?.country ?? t.clientsDefaultCountry}
              placeholder={t.clientsDefaultCountry}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="fiscalAddress" className="text-sm font-medium text-muted-foreground">
              {t.clientsFiscalAddress}
            </label>
            <input
              id="fiscalAddress"
              name="fiscalAddress"
              type="text"
              defaultValue={client?.fiscalAddress ?? ''}
              placeholder={t.clientsFiscalAddressPlaceholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="postalCode" className="text-sm font-medium text-muted-foreground">
              {t.clientsPostalCode}
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              defaultValue={client?.postalCode ?? ''}
              placeholder="28001"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium text-muted-foreground">
              {t.clientsCity}
            </label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={client?.city ?? ''}
              placeholder="Madrid"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="province" className="text-sm font-medium text-muted-foreground">
              {t.clientsProvince}
            </label>
            <input
              id="province"
              name="province"
              type="text"
              defaultValue={client?.province ?? ''}
              placeholder="Madrid"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="sector" className="text-sm font-medium text-muted-foreground">
          {t.clientsSector}
        </label>
        <input
          id="sector"
          name="sector"
          type="text"
          defaultValue={client?.sector ?? ''}
          placeholder={t.clientsSectorPlaceholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
          {t.clientsNotes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ''}
          placeholder={t.clientsNotesPlaceholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending
          ? client
            ? t.clientsSaving
            : t.clientsCreating
          : client
            ? t.clientsSaveChanges
            : t.clientsAdd}
      </button>
    </form>
  )
}
