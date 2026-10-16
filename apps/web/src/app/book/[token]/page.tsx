import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { BookingPageClient } from './_components/BookingPageClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function BookPage({ params }: Props) {
  const { token } = await params

  const page = await db.bookingPage.findUnique({
    where: { token },
    select: {
      active: true,
      availability: {
        select: {
          userId: true,
          workspaceId: true,
          timezone: true,
          slotDuration: true,
          publicEnabled: true,
          user: { select: { name: true } },
        },
      },
    },
  })

  if (!page || !page.active || !page.availability.publicEnabled) {
    notFound()
  }

  return (
    <BookingPageClient
      token={token}
      hostName={page.availability.user.name ?? 'Equipo'}
      slotDuration={page.availability.slotDuration}
      timezone={page.availability.timezone}
    />
  )
}
