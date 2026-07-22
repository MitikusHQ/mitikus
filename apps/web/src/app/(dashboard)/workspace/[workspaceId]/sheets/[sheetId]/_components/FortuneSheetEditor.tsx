'use client'

import dynamic from 'next/dynamic'

const Workbook = dynamic(
  () => import('@fortune-sheet/react').then((m) => m.Workbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Cargando editor…
      </div>
    ),
  }
)

interface Props {
  data:     object[]
  onChange: (data: object[]) => void
}

export function FortuneSheetEditor({ data, onChange }: Props) {
  return (
    <div className="h-full w-full">
      <Workbook
        data={data as any}
        onChange={(updatedData: any) => onChange(updatedData as object[])}
        showToolbar={true}
        showFormulaBar={true}
      />
    </div>
  )
}
