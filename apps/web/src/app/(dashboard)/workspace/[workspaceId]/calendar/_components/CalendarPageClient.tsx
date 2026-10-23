'use client'

import { useState } from 'react'
import type { AvailabilitySettings } from '@prisma/client'

type BookingPageData = { token: string; active: boolean }
import { type CalendarClientOption, type CalendarItem } from '@/app/actions/calendar'
import { CalendarClient } from './CalendarClient'
import { AvailabilityTab } from './AvailabilityTab'
import { TeamScheduleTab } from './TeamScheduleTab'

type Member = { id: string; name: string | null; email: string }

interface Props {
  workspaceId: string
  currentUserId: string
  initialItems: CalendarItem[]
  clients: CalendarClientOption[]
  initialFrom: string
  initialTo: string
  initialSettings: AvailabilitySettings | null
  initialBookingPage: BookingPageData | null
  members: Member[]
}

type Tab = 'agenda' | 'team' | 'availability'

const TABS: { key: Tab; label: string }[] = [
  { key: 'agenda', label: 'Mi agenda' },
  { key: 'team', label: 'Agenda de equipo' },
  { key: 'availability', label: 'Disponibilidad y reservas' },
]

export function CalendarPageClient({
  workspaceId,
  currentUserId,
  initialItems,
  clients,
  initialFrom,
  initialTo,
  initialSettings,
  initialBookingPage,
  members,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('agenda')

  return (
    <div>
      {/* Tab nav */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'agenda' && (
        <CalendarClient
          workspaceId={workspaceId}
          initialItems={initialItems}
          clients={clients}
          initialFrom={initialFrom}
          initialTo={initialTo}
        />
      )}

      {activeTab === 'team' && (
        <TeamScheduleTab
          workspaceId={workspaceId}
          members={members}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === 'availability' && (
        <AvailabilityTab
          workspaceId={workspaceId}
          initialSettings={initialSettings}
          initialBookingPage={initialBookingPage}
        />
      )}
    </div>
  )
}
