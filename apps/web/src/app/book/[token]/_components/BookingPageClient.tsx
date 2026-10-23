'use client'

import { useState, useTransition } from 'react'

interface Props {
  token: string
  hostName: string
  slotDuration: number
  timezone: string
}

interface Slot {
  startsAt: string
  endsAt: string
}

type Step = 'pick-date' | 'pick-slot' | 'fill-form' | 'confirmed'

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatDateLong(dateStr: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function getNext14Days(): Date[] {
  const days: Date[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i < 30; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function BookingPageClient({ token, hostName, slotDuration, timezone }: Props) {
  const [step, setStep] = useState<Step>('pick-date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loadingSlots, startSlotTransition] = useTransition()

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestNote, setGuestNote] = useState('')
  const [submitting, startSubmitTransition] = useTransition()
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmedSlot, setConfirmedSlot] = useState<Slot | null>(null)

  const days = getNext14Days()

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr)
    setSlots([])
    setSelectedSlot(null)
    startSlotTransition(async () => {
      const from = new Date(dateStr + 'T00:00:00').toISOString()
      const to = new Date(dateStr + 'T23:59:59').toISOString()
      const res = await fetch(`/api/booking/${token}/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (!res.ok) {
        setSlots([])
        setStep('pick-slot')
        return
      }
      const data = await res.json() as { slots: Slot[] }
      setSlots(data.slots ?? [])
      setStep('pick-slot')
    })
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setStep('fill-form')
  }

  function submitBooking() {
    if (!selectedSlot || !guestName.trim() || !guestEmail.trim()) return
    setConfirmError(null)
    startSubmitTransition(async () => {
      const res = await fetch(`/api/booking/${token}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestNote: guestNote.trim() || undefined,
          startsAt: selectedSlot.startsAt,
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; startsAt?: string; endsAt?: string }
      if (data.ok) {
        setConfirmedSlot({ startsAt: data.startsAt!, endsAt: data.endsAt! })
        setStep('confirmed')
      } else {
        if (data.error === 'slot_taken') {
          setConfirmError('Este horario ya no está disponible. Por favor, elige otro.')
          setStep('pick-slot')
          // Refresh slots
          selectDate(selectedDate!)
        } else {
          setConfirmError(data.error ?? 'Error al reservar. Inténtalo de nuevo.')
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
            📅
          </div>
          <h1 className="text-2xl font-bold">Reservar una reunión</h1>
          <p className="mt-1 text-muted-foreground">con {hostName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{slotDuration} min · {timezone}</p>
        </div>

        {/* Step: Confirmed */}
        {step === 'confirmed' && confirmedSlot && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">¡Reserva confirmada!</h2>
            <p className="mt-2 text-muted-foreground">
              {new Intl.DateTimeFormat('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(confirmedSlot.startsAt))}
              {' – '}
              {formatTime(confirmedSlot.endsAt)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Recibirás un email de confirmación en breve.</p>
          </div>
        )}

        {/* Step: Pick date */}
        {step === 'pick-date' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Selecciona un día</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {days.map((day) => {
                const dateStr = toDateInputValue(day)
                const label = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric' }).format(day)
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => selectDate(dateStr)}
                    className="flex flex-col items-center rounded-lg border border-border px-2 py-3 text-xs hover:border-primary hover:bg-primary/5"
                  >
                    <span className="capitalize font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step: Pick slot */}
        {step === 'pick-slot' && selectedDate && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('pick-date')}
                className="text-sm text-muted-foreground underline"
              >
                ← Cambiar día
              </button>
              <h2 className="text-base font-semibold capitalize">{formatDateLong(selectedDate)}</h2>
            </div>

            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Cargando horarios disponibles…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay horarios disponibles para este día. Prueba con otro.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSlot(slot)}
                    className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:border-primary hover:bg-primary/5"
                  >
                    {formatTime(slot.startsAt)}
                  </button>
                ))}
              </div>
            )}

            {confirmError && (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                {confirmError}
              </p>
            )}
          </div>
        )}

        {/* Step: Fill form */}
        {step === 'fill-form' && selectedSlot && selectedDate && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('pick-slot')}
                className="text-sm text-muted-foreground underline"
              >
                ← Cambiar horario
              </button>
              <div>
                <p className="text-sm font-semibold capitalize">{formatDateLong(selectedDate)}</p>
                <p className="text-sm text-muted-foreground">{formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1 text-sm font-medium">
                <span>Tu nombre <span className="text-red-500">*</span></span>
                <input
                  autoFocus
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Ana García"
                />
              </label>

              <label className="block space-y-1 text-sm font-medium">
                <span>Tu email <span className="text-red-500">*</span></span>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="ana@empresa.com"
                />
              </label>

              <label className="block space-y-1 text-sm font-medium">
                <span>Mensaje (opcional)</span>
                <textarea
                  value={guestNote}
                  onChange={(e) => setGuestNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Comparte cualquier detalle relevante…"
                />
              </label>
            </div>

            {confirmError && (
              <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {confirmError}
              </p>
            )}

            <button
              type="button"
              onClick={submitBooking}
              disabled={submitting || !guestName.trim() || !guestEmail.trim()}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {submitting ? 'Confirmando reserva…' : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
