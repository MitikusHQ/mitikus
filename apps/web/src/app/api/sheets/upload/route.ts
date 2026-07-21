import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

function parseAddr(addr: string): { r: number; c: number } {
  const col = addr.replace(/\d/g, '')
  const row = parseInt(addr.replace(/\D/g, ''), 10) - 1
  const c = col.split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1
  return { r: row, c }
}

function xlsxToFortuneSheet(buffer: ArrayBuffer): { data: object[]; rawText: string } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]!
    const celldata: object[] = []
    Object.entries(ws).forEach(([addr, cell]) => {
      if (addr.startsWith('!')) return
      const c = cell as XLSX.CellObject
      const { r, c: col } = parseAddr(addr)
      celldata.push({
        r,
        c: col,
        v: { v: c.v, m: String(c.v ?? ''), ct: { fa: 'General' } },
      })
    })
    return { name, celldata, config: {} }
  })
  const rawText = wb.SheetNames
    .map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name]!))
    .join('\n\n')
  return { data: sheets, rawText }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file        = formData.get('file') as File | null
  const workspaceId = formData.get('workspaceId') as string | null

  if (!file || !workspaceId) {
    return NextResponse.json({ error: 'Missing file or workspaceId' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Only .xlsx files are supported' }, { status: 400 })
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const buffer = await file.arrayBuffer()

  let data: object[], rawText: string
  try {
    ;({ data, rawText } = xlsxToFortuneSheet(buffer))
  } catch {
    return NextResponse.json({ error: 'Failed to convert spreadsheet' }, { status: 422 })
  }

  const title = file.name
    .replace(/\.xlsx$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()

  const sheet = await db.spreadsheet.create({
    data: { workspaceId, title, data, rawText, uploadedBy: user.id },
  })

  return NextResponse.json({ id: sheet.id, title: sheet.title })
}
