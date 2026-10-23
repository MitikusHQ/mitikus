import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireUser: vi.fn(() => { throw new Error('No session') }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  deleteSettings: vi.fn(),
  transaction: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ db: {
  availabilitySettings: { findMany: mocks.findMany },
  $transaction: mocks.transaction,
} }))

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { deleteAvailabilityDataForUser } from '@/lib/availability-internal'

describe('deleteAvailabilityDataForUser', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.findUnique.mockResolvedValue({ id: 'settings', bookingPage: null })
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ availabilitySettings: {
        findUnique: mocks.findUnique,
        delete: mocks.deleteSettings,
      } }),
    )
  })

  it('cleans every workspace without authentication and revalidates after commit', async () => {
    mocks.findMany.mockResolvedValue([{ workspaceId: 'ws-1' }, { workspaceId: 'ws-2' }])
    mocks.deleteSettings.mockImplementation(async () => {
      expect(revalidatePath).toHaveBeenCalledTimes(mocks.deleteSettings.mock.calls.length - 1)
    })

    await deleteAvailabilityDataForUser('internal-user')

    expect(requireUser).not.toHaveBeenCalled()
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: 'internal-user' }, select: { workspaceId: true },
    })
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
    for (const workspaceId of ['ws-1', 'ws-2']) {
      expect(mocks.deleteSettings).toHaveBeenCalledWith({
        where: { userId_workspaceId: { userId: 'internal-user', workspaceId } },
      })
      expect(revalidatePath).toHaveBeenCalledWith(`/workspace/${workspaceId}/calendar`)
    }
  })

  it('does nothing when the user has no settings', async () => {
    mocks.findMany.mockResolvedValue([])
    await deleteAvailabilityDataForUser('missing-user')
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('propagates transaction failure without revalidating the workspace', async () => {
    mocks.findMany.mockResolvedValue([{ workspaceId: 'ws-1' }])
    mocks.transaction.mockRejectedValue(new Error('cleanup failed'))
    await expect(deleteAvailabilityDataForUser('internal-user')).rejects.toThrow('cleanup failed')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
