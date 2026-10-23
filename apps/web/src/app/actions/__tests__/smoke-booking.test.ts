import { expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// public-api.test.ts covers successful POST response shape and past-date 422.
// Its inactive-page 404 coverage is for GET /slots, so exercise POST here.
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock('@/app/actions/availability', () => ({ getAvailableSlotsInternal: vi.fn() }))
const mockDb = {
  bookingPage: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}
vi.mock('@/lib/db', () => ({ db: mockDb }))
const { POST } = await import('@/app/api/booking/[token]/reserve/route')

it('returns 404 for an inactive booking page without starting a reservation', async () => {
  mockDb.bookingPage.findUnique.mockResolvedValue({
    id: 'page', active: false,
    availability: { publicEnabled: true, userId: 'host', workspaceId: 'ws', slotDuration: 30 },
  })
  const request = new NextRequest('http://localhost/api/booking/inactive/reserve', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guestName: 'Ana', guestEmail: 'ana@example.com',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
    }),
  })
  const response = await POST(request, { params: Promise.resolve({ token: 'inactive' }) })
  expect(response.status).toBe(404)
  expect(await response.json()).toEqual({ error: 'not_found' })
  expect(mockDb.$transaction).not.toHaveBeenCalled()
})
