import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ToolCategory } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_CATEGORIES: ToolCategory[] = [
  'AUDIT',
  'EVALUATION',
  'CHECKLIST',
  'CRM',
  'REPORT',
  'HR',
  'OPERATIONS',
  'FINANCE',
  'CUSTOM',
]

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser()
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Solo el propietario puede modificar las categorías' },
        { status: 403 },
      )
    }

    const body: { categories?: string[] } = await req.json().catch(() => ({}))
    const categories = (body.categories ?? []).filter((c): c is ToolCategory =>
      VALID_CATEGORIES.includes(c as ToolCategory),
    )

    await db.organization.update({
      where: { id: user.orgId },
      data: { enabledCategories: categories },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
