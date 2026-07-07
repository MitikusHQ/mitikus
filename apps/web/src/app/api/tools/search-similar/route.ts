import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getSuggestions } from '@/lib/registry-intelligence/suggestions'
import { z } from 'zod'

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  prompt: z.string().min(3).max(2000),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { workspaceId, prompt } = parsed.data

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const result = await getSuggestions(prompt, user.orgId)

  // Record search metrics (non-blocking — failure is acceptable)
  let searchId = ''
  try {
    const record = await db.registrySearch.create({
      data: {
        userId: user.id,
        orgId: user.orgId,
        workspaceId,
        prompt,
        resultsFound: result.suggestions.length,
        topScore: result.suggestions[0]?.similarity ?? 0,
      },
    })
    searchId = record.id
  } catch {
    // metrics failure must never block the main flow
  }

  return NextResponse.json({
    suggestions: result.suggestions,
    hasStrongMatch: result.hasStrongMatch,
    searchId,
  })
}
