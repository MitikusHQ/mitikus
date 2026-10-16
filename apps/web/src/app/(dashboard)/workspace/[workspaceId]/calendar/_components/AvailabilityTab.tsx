'use client'

import { useState, useTransition } from 'react'
import type { AvailabilitySettings } from '@prisma/client'
import {
  upsertAvailabilitySettings,
  getOrCreateBookingPage,
  rotateBookingToken,
  setBookingPageActive,
} from '@/app/actions/availability'

type BookingPageData = { token: string; active: boolean }

interface Props {
  workspaceId: string
  initialSettings: AvailabilitySettings | null
  initialBookingPage: BookingPageData | null
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 0]

const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'UTC',
]

export function AvailabilityTab({ workspaceId, initialSettings, initialBookingPage }: Props) {
  const [settings, setSettings] = useState<AvailabilitySettings | null>(initialSettings)
  const [page, setPage] = useState<BookingPageData | null>(initialBookingPage)
  const [isPending, startTransition] = useTransition()
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [rotateConfirm, setRotateConfirm] = useState(false)

  const [form, setForm] = useState({
    timezone: initialSettings?.timezone ?? 'Europe/Madrid',
    workDays: initialSettings?.workDays ?? [1, 2, 3, 4, 5],
    workStart: initialSettings?.workStart ?? '09:00',
    workEnd: initialSettings?.workEnd ?? '18:00',
    slotDuration: initialSettings?.slotDuration ?? 30,
    bufferMinutes: initialSettings?.bufferMinutes ?? 0,
    minNotice: initialSettings?.minNotice ?? 60,
    maxHorizon: initialSettings?.maxHorizon ?? 30,
    publicEnabled: initialSettings?.publicEnabled ?? false,
  })

  function toggleDay(dayNum: number) {
    setForm((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(dayNum)
        ? prev.workDays.filter((d) => d !== dayNum)
        : [...prev.workDays, dayNum].sort((a, b) => a - b),
    }))
  }

  function handleSave() {
    setSaveMsg(null)
    startTransition(async () => {
      const updated = await upsertAvailabilitySettings(workspaceId, form)
      setSettings(updated)
      setSaveMsg('Guardado correctamente')
      setTimeout(() => setSaveMsg(null), 3000)
      if (!page) {
        const bp = await getOrCreateBookingPage(workspaceId)
        setPage({ token: bp.token, active: bp.active })
      }
    })
  }

  function handleTogglePageActive(active: boolean) {
    startTransition(async () => {
      const updated = await setBookingPageActive(workspaceId, active)
      setPage({ token: updated.token, active: updated.active })
    })
  }

  function handleRotateToken() {
    if (!rotateConfirm) {
      setRotateConfirm(true)
      return
    }
    setRotateConfirm(false)
    startTransition(async () => {
      const updated = await rotateBookingToken(workspaceId)
      setPage({ token: updated.token, active: updated.active })
    })
  }

  const bookingUrl = page
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${page.token}`
    : null

  return (
    <div className="space-y-8">
      {/* Horario de trabajo */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold">Horario de disponibilidad</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            <span>Zona horaria</span>
            <select
              value={form.timezone}
              onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </label>

          <div className="space-y-1 text-sm font-medium">
            <span>Días laborables</span>
            <div className="flex gap-1.5 pt-1">
              {DAYS.map((label, i) => {
                const dayNum = DAY_NUMBERS[i]!
                const active = form.workDays.includes(dayNum)
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => toggleDay(dayNum)}
                    className={`flex h-8 w-10 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="space-y-1 text-sm font-medium">
            <span>Hora de inicio</span>
            <input
              type="time"
              value={form.workStart}
              onChange={(e) => setForm((p) => ({ ...p, workStart: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Hora de fin</span>
            <input
              type="time"
              value={form.workEnd}
              onChange={(e) => setForm((p) => ({ ...p, workEnd: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Duración de slot (minutos)</span>
            <select
              value={form.slotDuration}
              onChange={(e) => setForm((p) => ({ ...p, slotDuration: Number(e.target.value) }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {[15, 30, 45, 60].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Buffer entre reuniones (minutos)</span>
            <select
              value={form.bufferMinutes}
              onChange={(e) => setForm((p) => ({ ...p, bufferMinutes: Number(e.target.value) }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {[0, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Aviso mínimo previo</span>
            <select
              value={form.minNotice}
              onChange={(e) => setForm((p) => ({ ...p, minNotice: Number(e.target.value) }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {[0, 30, 60, 120, 240, 480, 1440].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? 'Sin mínimo' : m < 60 ? `${m} min` : `${m / 60}h`}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Horizonte máximo (días)</span>
            <select
              value={form.maxHorizon}
              onChange={(e) => setForm((p) => ({ ...p, maxHorizon: Number(e.target.value) }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d} días</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {saveMsg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{saveMsg}</p>}
        </div>
      </section>

      {/* Página de reservas pública */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Página de reservas pública</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Habilitada para el exterior</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.publicEnabled}
              onClick={() => setForm((p) => ({ ...p, publicEnabled: !p.publicEnabled }))}
              className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                form.publicEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                  form.publicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        {!settings ? (
          <p className="text-sm text-muted-foreground">Guarda la configuración de horario para activar la página de reservas.</p>
        ) : !page ? (
          <p className="text-sm text-muted-foreground">Generando página de reservas…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Enlace de reservas</p>
                <p className="truncate font-mono text-sm">{bookingUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => bookingUrl && navigator.clipboard.writeText(bookingUrl)}
                className="ml-3 shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Copiar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <button
                  type="button"
                  role="switch"
                  aria-checked={page.active}
                  onClick={() => handleTogglePageActive(!page.active)}
                  disabled={isPending}
                  className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-60 ${
                    page.active ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                      page.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span>{page.active ? 'Activa' : 'Inactiva'}</span>
              </label>

              <button
                type="button"
                onClick={handleRotateToken}
                disabled={isPending}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                  rotateConfirm
                    ? 'border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {rotateConfirm ? '¿Confirmar? El enlace anterior dejará de funcionar' : 'Rotar enlace'}
              </button>
              {rotateConfirm && (
                <button
                  type="button"
                  onClick={() => setRotateConfirm(false)}
                  className="text-xs text-muted-foreground underline"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
