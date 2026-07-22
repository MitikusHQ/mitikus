'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { SpreadsheetDetail } from '@/app/actions/spreadsheets'
import { updateSpreadsheetContent } from '@/app/actions/spreadsheets'
import { FortuneSheetEditor } from './FortuneSheetEditor'
import { SheetHeader } from './SheetHeader'
import { DeleteSheetButton } from './DeleteSheetButton'

interface Props {
  sheet:       SpreadsheetDetail
  workspaceId: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SheetEditorClient({ sheet, workspaceId }: Props) {
  const [data, setData]             = useState<object[]>(sheet.data)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveStatus === 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  const scheduleSave = useCallback((newData: object[]) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      const rawText = newData
        .map((s: any) => {
          if (!Array.isArray(s.celldata)) return ''
          const maxR = s.celldata.reduce((acc: number, c: any) => Math.max(acc, c.r ?? 0), 0)
          const maxC = s.celldata.reduce((acc: number, c: any) => Math.max(acc, c.c ?? 0), 0)
          const grid: string[][] = Array.from({ length: maxR + 1 }, () =>
            Array.from({ length: maxC + 1 }, () => '')
          )
          s.celldata.forEach((c: any) => {
            ;(grid as any)[c.r][c.c] = String(c.v?.m ?? c.v?.v ?? '')
          })
          return grid.map((row) => row.join(',')).join('\n')
        })
        .join('\n\n')

      try {
        await updateSpreadsheetContent(sheet.id, workspaceId, { data: newData, rawText })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
  }, [sheet.id, workspaceId])

  function handleChange(newData: object[]) {
    setData(newData)
    scheduleSave(newData)
  }

  function handleExport() {
    const wb = XLSX.utils.book_new()
    data.forEach((s: any) => {
      if (!Array.isArray(s.celldata)) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), s.name ?? 'Hoja1')
        return
      }
      const maxR = s.celldata.reduce((acc: number, c: any) => Math.max(acc, c.r ?? 0), 0)
      const maxC = s.celldata.reduce((acc: number, c: any) => Math.max(acc, c.c ?? 0), 0)
      const aoa: string[][] = Array.from({ length: maxR + 1 }, () =>
        Array.from({ length: maxC + 1 }, () => '')
      )
      s.celldata.forEach((c: any) => {
        ;(aoa as any)[c.r][c.c] = String(c.v?.m ?? c.v?.v ?? '')
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), s.name ?? 'Hoja1')
    })
    XLSX.writeFile(wb, `${sheet.title}.xlsx`)
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader
        sheetId={sheet.id}
        workspaceId={workspaceId}
        title={sheet.title}
        category={sheet.category}
        saveStatus={saveStatus}
        onExport={handleExport}
      />
      <div className="flex-1 min-h-0">
        <FortuneSheetEditor data={data} onChange={handleChange} />
      </div>
      <div className="flex justify-end px-4 py-2 border-t bg-background">
        <DeleteSheetButton sheetId={sheet.id} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
