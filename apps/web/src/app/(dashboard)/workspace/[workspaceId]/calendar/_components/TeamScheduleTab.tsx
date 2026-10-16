'use client'

import { useState, useTransition } from 'react'
import {
  getTeamFreeBusy,
  findCommonSlots,
  createMeetingWithParticipants,
  type FreeBusyEntry,
  type TimeSlot,
} from '@/app/actions/availability'

type Member = { id: string; name: string | null; email: string }

interface Props {
  workspaceId: string
  members: Member[]
  currentUserId: string
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatHour(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function TeamScheduleTab({ workspaceId, members, currentUserId }: Props) {
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([currentUserId])
  const [from, setFrom] = useState(toDateInputValue(today))
  const [to, setTo] = useState(toDateInputValue(nextWeek))
  const [freeBusy, setFreeBusy] = useState<FreeBusyEntry[]>([])
  const [isPending, startTransition] = useTransition()

  const [duration, setDuration] = useState(30)
  const [commonSlots, setCommonSlots] = useState<TimeSlot[]>([])
  const [commonPending, startCommonTransition] = useTransition()

  const [meetingSlot, setMeetingSlot] = useState<TimeSlot | null>(null)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingParticipantIds, setMeetingParticipantIds] = useState<string[]>([])
  const [createPending, startCreateTransition] = useTransition()
  const [createMsg, setCreateMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function toggleMember(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  function loadFreeBusy() {
    startTransition(async () => {
      const result = await getTeamFreeBusy(
        workspaceId,
        selectedUserIds,
        new Date(from).toISOString(),
        new Date(to + 'T23:59:59').toISOString(),
      )
      setFreeBusy(result)
    })
  }

  function findSlots() {
    startCommonTransition(async () => {
      const slots = await findCommonSlots(
        workspaceId,
        selectedUserIds,
        duration,
        new Date(from).toISOString(),
        new Date(to + 'T23:59:59').toISOString(),
      )
      setCommonSlots(slots)
    })
  }

  function openMeetingForm(slot: TimeSlot) {
    setMeetingSlot(slot)
    setMeetingParticipantIds(selectedUserIds)
    setMeetingTitle('')
    setCreateMsg(null)
  }

  function createMeeting() {
    if (!meetingSlot || !meetingTitle.trim()) return
    startCreateTransition(async () => {
      try {
        await createMeetingWithParticipants(workspaceId, {
          title: meetingTitle.trim(),
          startsAt: meetingSlot.startsAt,
          endsAt: meetingSlot.endsAt,
          participantIds: meetingParticipantIds,
        })
        setCreateMsg({ text: 'Reunión creada correctamente', ok: true })
        setMeetingSlot(null)
        loadFreeBusy()
      } catch (err) {
        setCreateMsg({
          text: err instanceof Error ? err.message : 'Error al crear la reunión',
          ok: false,
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Member selector + date range */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Miembros del equipo</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = selectedUserIds.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {m.name ?? m.email}
                {m.id === currentUserId && ' (tú)'}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm font-medium">
            <span>Desde</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>Hasta</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={loadFreeBusy}
            disabled={isPending || selectedUserIds.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isPending ? 'Cargando…' : 'Ver disponibilidad'}
          </button>
        </div>
      </section>

      {/* Free/busy grid */}
      {freeBusy.length > 0 && (
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Ocupación del equipo</h2>
          </div>
          <div className="divide-y divide-border">
            {freeBusy.map((entry) => (
              <div key={entry.userId} className="grid gap-2 px-4 py-3 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-medium">{entry.name ?? '—'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.slots.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin eventos en el período</span>
                  ) : entry.slots.map((slot, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-700 dark:text-red-300"
                    >
                      {formatDate(slot.startsAt)} {formatHour(slot.startsAt)}–{formatHour(slot.endsAt)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Common slot finder */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buscar hueco común</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm font-medium">
            <span>Duración</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={findSlots}
            disabled={commonPending || selectedUserIds.length < 2}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {commonPending ? 'Buscando…' : 'Encontrar huecos'}
          </button>
          {selectedUserIds.length < 2 && (
            <p className="text-xs text-muted-foreground">Selecciona al menos 2 miembros</p>
          )}
        </div>

        {commonSlots.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">
              {commonSlots.length} hueco{commonSlots.length !== 1 ? 's' : ''} disponible{commonSlots.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {commonSlots.slice(0, 12).map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openMeetingForm(slot)}
                  className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-left text-sm hover:bg-emerald-500/20"
                >
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">{formatDate(slot.startsAt)}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{formatHour(slot.startsAt)} – {formatHour(slot.endsAt)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {commonSlots.length === 0 && !commonPending && freeBusy.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron huecos comunes en el período.</p>
        )}
      </section>

      {/* Create meeting success message (after modal closes) */}
      {createMsg && !meetingSlot && (
        <p className={`rounded-md border px-4 py-3 text-sm ${
          createMsg.ok
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-red-500/30 bg-red-500/10 text-red-600'
        }`}>
          {createMsg.text}
        </p>
      )}

      {/* Meeting creation modal */}
      {meetingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-1 text-base font-semibold">Crear reunión</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {formatDate(meetingSlot.startsAt)} · {formatHour(meetingSlot.startsAt)} – {formatHour(meetingSlot.endsAt)}
            </p>

            <div className="space-y-3">
              <label className="space-y-1 text-sm font-medium">
                <span>Título</span>
                <input
                  autoFocus
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Ej: Revisión semanal"
                />
              </label>

              <div className="space-y-1 text-sm font-medium">
                <span>Participantes</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {members.filter((m) => selectedUserIds.includes(m.id)).map((m) => {
                    const included = meetingParticipantIds.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setMeetingParticipantIds((prev) =>
                            prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          included
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {m.name ?? m.email}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {createMsg && (
              <p className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                createMsg.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                  : 'border-red-500/30 bg-red-500/10 text-red-600'
              }`}>
                {createMsg.text}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMeetingSlot(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={createMeeting}
                disabled={createPending || !meetingTitle.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {createPending ? 'Creando…' : 'Crear reunión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
