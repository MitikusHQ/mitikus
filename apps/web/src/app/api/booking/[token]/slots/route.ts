import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getAvailableSlots } from '@/app/actions/availability'

// Public route — no Clerk auth required
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // Rate limit: 60 requests per minute per IP
  const limited = await rateLimit(req, 'booking:slots', 60, 60)
  if (limited) return limited

  // Resolve booking page — never reveal workspace/user IDs in the response
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
        },
      },
    },
  })

  if (!page || !page.active || !page.availability.publicEnabled) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const searchParams = req.nextUrl.searchParams
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: 'Missing from/to params' }, { status: 400 })
  }

  const from = new Date(fromParam)
  const to = new Date(toParam)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Invalid dates' }, { status: 400 })
  }

  // Limit range to 31 days max to avoid scraping
  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays > 31) {
    return NextResponse.json({ error: 'Range too large' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlots(
      page.availability.workspaceId,
      page.availability.userId,
      from,
      to,
    )

    return NextResponse.json({
      slotDuration: page.availability.slotDuration,
      timezone: page.availability.timezone,
      slots,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
