import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

type FortuneCell = {
  r: number
  c: number
  v: { v: unknown; m: string; ct: { fa: string } }
}

async function xlsxToFortuneSheet(buffer: ArrayBuffer): Promise<{ data: object[]; rawText: string }> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const sheets: object[] = []
  const csvParts: string[] = []

  wb.eachSheet((ws) => {
    const celldata: FortuneCell[] = []
    const csvRows: string[] = []

    ws.eachRow((row, rowIdx) => {
      const csvCols: string[] = []
      row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
        const v = cell.value instanceof Date ? cell.value.toISOString() : cell.value
        celldata.push({
          r: rowIdx - 1,
          c: colIdx - 1,
          v: { v, m: String(v ?? ''), ct: { fa: 'General' } },
        })
        csvCols.push(String(v ?? ''))
      })
      csvRows.push(csvCols.join(','))
    })

    sheets.push({ name: ws.name, celldata, config: {} })
    csvParts.push(csvRows.join('\n'))
  })

  return { data: sheets, rawText: csvParts.join('\n\n') }
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
    ;({ data, rawText } = await xlsxToFortuneSheet(buffer))
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
