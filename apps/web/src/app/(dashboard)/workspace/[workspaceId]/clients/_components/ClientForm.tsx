'use client'

import { useActionState, useState } from 'react'
import { createClient, updateClient, type ClientActionState } from '@/app/actions/client'

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
}

const CLIENT_TYPES = [
  { value: 'client', label: 'Cliente', nameLabel: 'Cliente', namePlaceholder: 'Empresa, autónomo o persona', contactLabel: 'Persona de contacto', contactPlaceholder: 'Solo si es distinta del cliente' },
  { value: 'company', label: 'Empresa', nameLabel: 'Empresa', namePlaceholder: 'Nombre de la empresa', contactLabel: 'Persona de contacto', contactPlaceholder: 'Nombre de la persona con la que tratas' },
  { value: 'freelancer', label: 'Autónomo', nameLabel: 'Nombre profesional', namePlaceholder: 'Nombre del profesional o marca', contactLabel: 'Persona de contacto', contactPlaceholder: 'Opcional, si no coincide' },
  { value: 'individual', label: 'Particular', nameLabel: 'Nombre completo', namePlaceholder: 'Nombre de la persona', contactLabel: 'Contacto alternativo', contactPlaceholder: 'Opcional' },
  { value: 'patient', label: 'Paciente', nameLabel: 'Paciente', namePlaceholder: 'Nombre del paciente', contactLabel: 'Contacto/tutor', contactPlaceholder: 'Opcional, útil si es menor o dependiente' },
  { value: 'student', label: 'Alumno', nameLabel: 'Alumno', namePlaceholder: 'Nombre del alumno', contactLabel: 'Tutor/contacto', contactPlaceholder: 'Padre, madre o tutor si aplica' },
  { value: 'athlete', label: 'Deportista', nameLabel: 'Deportista', namePlaceholder: 'Nombre del deportista', contactLabel: 'Contacto/entrenador', contactPlaceholder: 'Opcional' },
  { value: 'event', label: 'Evento', nameLabel: 'Evento', namePlaceholder: 'Boda Laura y Andrés, sesión familiar...', contactLabel: 'Persona de contacto', contactPlaceholder: 'Quién coordina el evento' },
]
const DEFAULT_CLIENT_TYPE = CLIENT_TYPES[0]!

export function ClientForm({ workspaceId, client }: Props) {
  const action = client ? updateClient : createClient
  const [clientType, setClientType] = useState(client?.clientType ?? 'client')
  const selectedType = CLIENT_TYPES.find((type) => type.value === clientType) ?? DEFAULT_CLIENT_TYPE
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
          Tipo
        </label>
        <select
          id="clientType"
          name="clientType"
          value={clientType}
          onChange={(e) => setClientType(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CLIENT_TYPES.map((type) => (
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
          Para autónomos o particulares puedes dejarlo vacío.
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
          Teléfono
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
          <h2 className="text-sm font-semibold">Datos fiscales para facturas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Se mostrarán como datos del destinatario cuando emitas una factura a este cliente.
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
              País
            </label>
            <input
              id="country"
              name="country"
              type="text"
              defaultValue={client?.country ?? 'España'}
              placeholder="España"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="fiscalAddress" className="text-sm font-medium text-muted-foreground">
              Domicilio fiscal
            </label>
            <input
              id="fiscalAddress"
              name="fiscalAddress"
              type="text"
              defaultValue={client?.fiscalAddress ?? ''}
              placeholder="Calle, número, piso..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="postalCode" className="text-sm font-medium text-muted-foreground">
              Código postal
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
              Ciudad
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
              Provincia / región
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
          Sector
        </label>
        <input
          id="sector"
          name="sector"
          type="text"
          defaultValue={client?.sector ?? ''}
          placeholder="Tecnología, Hostelería…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ''}
          placeholder="Información adicional…"
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
            ? 'Guardando…'
            : 'Creando…'
          : client
            ? 'Guardar cambios'
            : 'Crear cliente'}
      </button>
    </form>
  )
}
