'use client'

import type { SlideData } from '@/app/actions/presentations'

interface Props {
  slide:    SlideData
  index:    number
  isActive: boolean
  onClick:  () => void
}

export function SlidePreview({ slide, index, isActive, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded border p-2 text-xs transition-colors ${
        isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      }`}
    >
      <span className="text-muted-foreground mr-1">{index + 1}</span>
      <span className="truncate">{slide.title || '(Sin título)'}</span>
    </button>
  )
}
