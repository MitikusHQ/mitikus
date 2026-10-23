import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-smoke' }),
}))
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => { throw new Error(`Redirect: ${path}`) }),
}))
const mockDb = {
  user: { findUnique: vi.fn() },
  workspace: { findFirst: vi.fn() },
  availabilitySettings: { findUnique: vi.fn() },
}
vi.mock('@/lib/db', () => ({ db: mockDb }))
const { getAvailabilitySettings } = await import('@/app/actions/availability')

// requireWorkspace is private: exercise its real auth/DB path through this action.
// Its internal { user, workspace } return cannot be asserted via the public API.
describe('workspace access smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-smoke', orgId: 'org-a' })
    mockDb.workspace.findFirst.mockReset()
    mockDb.availabilitySettings.findUnique.mockResolvedValue(null)
  })

  it('rejects an unknown workspace before reading settings', async () => {
    mockDb.workspace.findFirst.mockResolvedValue(null)
    await expect(getAvailabilitySettings('missing')).rejects.toThrow('Workspace not found')
    expect(mockDb.availabilitySettings.findUnique).not.toHaveBeenCalled()
  })

  it('scopes the lookup to the authenticated organisation', async () => {
    // Unlike the existing unconditional-null mock, this catches a missing org filter.
    const foreign = { id: 'foreign', orgId: 'org-b', name: 'Foreign' }
    mockDb.workspace.findFirst.mockImplementation(
      ({ where }: { where: { id: string; orgId?: string } }) =>
        Promise.resolve(where.id === foreign.id && (!where.orgId || where.orgId === foreign.orgId)
          ? foreign : null),
    )
    await expect(getAvailabilitySettings('foreign')).rejects.toThrow('Workspace not found')
    expect(mockDb.workspace.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign', orgId: 'org-a' }, select: { id: true, name: true },
    })
    expect(mockDb.availabilitySettings.findUnique).not.toHaveBeenCalled()
  })

  it('passes the authenticated user and workspace to the settings lookup', async () => {
    mockDb.workspace.findFirst.mockResolvedValue({ id: 'ws', name: 'Smoke' })
    await expect(getAvailabilitySettings('ws')).resolves.toBeNull()
    expect(mockDb.availabilitySettings.findUnique).toHaveBeenCalledWith({
      where: { userId_workspaceId: { userId: 'user-smoke', workspaceId: 'ws' } },
      include: { bookingPage: { select: { token: true, active: true } } },
    })
  })
})
