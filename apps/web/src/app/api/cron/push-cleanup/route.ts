import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

// Remove push subscriptions not updated in 90 days — likely expired or uninstalled browsers
const STALE_DAYS = 90

export async function GET(req: Request): Promise<NextResponse> {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)

  const { count } = await db.pushSubscription.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  })

  return NextResponse.json({ deleted: count, cutoff })
}
