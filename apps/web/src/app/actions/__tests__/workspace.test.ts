import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    bookingRequest: { deleteMany: vi.fn() },
    bookingPage: { deleteMany: vi.fn() },
    availabilitySettings: { deleteMany: vi.fn() },
    aIUsage: { deleteMany: vi.fn() },
    registrySearch: { deleteMany: vi.fn() },
    auditLog: { deleteMany: vi.fn() },
    productEvent: { deleteMany: vi.fn() },
    businessMemoryLog: { deleteMany: vi.fn() },
    guestRoom: { findMany: vi.fn() },
    guestEvent: { deleteMany: vi.fn() },
    folder: { updateMany: vi.fn() },
    workspace: { delete: vi.fn() },
  }
  return {
    tx,
    db: {
      workspace: { findFirst: vi.fn() },
      availabilitySettings: { findMany: vi.fn() },
      $transaction: vi.fn(),
    },
    requireUser: vi.fn(),
    deleteAvailabilityData: vi.fn(),
    revalidatePath: vi.fn(),
  }
})

vi.mock('@/lib/db', () => ({ db: mocks.db }))
vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/app/actions/availability', () => ({ deleteAvailabilityData: mocks.deleteAvailabilityData }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/billing/entitlements', () => ({ checkEntitlement: vi.fn() }))
vi.mock('@/lib/pmf-analytics', () => ({ trackWorkspaceCreated: vi.fn() }))

import { deleteWorkspace } from '../workspace'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'owner', orgId: 'org', role: 'OWNER' })
  mocks.db.workspace.findFirst.mockResolvedValue({ id: 'ws' })
  mocks.db.availabilitySettings.findMany.mockResolvedValue([{ userId: 'host-1' }, { userId: 'host-2' }])
  mocks.tx.guestRoom.findMany.mockResolvedValue([{ token: 'room-token' }])
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => Promise<void>) => callback(mocks.tx))
})

describe('deleteWorkspace', () => {
  it.each(['ADMIN', 'EDITOR', 'MEMBER', 'OPERATOR', 'VIEWER', 'EMPLOYEE'])('rejects %s before any deletion', async (role) => {
    mocks.requireUser.mockResolvedValue({ id: 'user', orgId: 'org', role })
    expect(await deleteWorkspace('ws')).toHaveProperty('error')
    expect(mocks.db.availabilitySettings.findMany).not.toHaveBeenCalled()
    expect(mocks.deleteAvailabilityData).not.toHaveBeenCalled()
    expect(mocks.db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects workspaces outside the caller organisation', async () => {
    mocks.db.workspace.findFirst.mockResolvedValue(null)
    expect(await deleteWorkspace('foreign')).toHaveProperty('error')
    expect(mocks.db.workspace.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign', orgId: 'org' }, select: { id: true },
    })
    expect(mocks.db.$transaction).not.toHaveBeenCalled()
  })

  it('cleans each host before deleting RESTRICT children and the workspace', async () => {
    expect(await deleteWorkspace('ws')).toBeNull()
    expect(mocks.deleteAvailabilityData.mock.calls).toEqual([['ws', 'host-1'], ['ws', 'host-2']])
    const ordered = [
      ...mocks.deleteAvailabilityData.mock.invocationCallOrder,
      ...mocks.db.$transaction.mock.invocationCallOrder,
      ...mocks.tx.bookingRequest.deleteMany.mock.invocationCallOrder,
      ...mocks.tx.bookingPage.deleteMany.mock.invocationCallOrder,
      ...mocks.tx.availabilitySettings.deleteMany.mock.invocationCallOrder,
      ...mocks.tx.workspace.delete.mock.invocationCallOrder,
      ...mocks.revalidatePath.mock.invocationCallOrder,
    ]
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b))
    expect(mocks.tx.bookingRequest.deleteMany).toHaveBeenCalledWith({ where: { bookingPage: { availability: { workspaceId: 'ws' } } } })
    expect(mocks.tx.guestEvent.deleteMany).toHaveBeenCalledWith({ where: { token: { in: ['room-token'] } } })
    expect(mocks.tx.folder.updateMany).toHaveBeenCalledWith({ where: { workspaceId: 'ws' }, data: { parentId: null } })
    expect(mocks.tx.workspace.delete).toHaveBeenCalledWith({ where: { id: 'ws' } })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/')
  })

  it('stops if availability cleanup fails', async () => {
    mocks.deleteAvailabilityData.mockRejectedValue(new Error('cleanup failed'))
    expect(await deleteWorkspace('ws')).toHaveProperty('error')
    expect(mocks.db.$transaction).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('returns an error without revalidation if the main transaction fails', async () => {
    mocks.tx.workspace.delete.mockRejectedValue(new Error('FK failure'))
    expect(await deleteWorkspace('ws')).toHaveProperty('error')
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
