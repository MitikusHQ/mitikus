'use client'

import { useState, useEffect } from 'react'
import { BulletListEditor } from './BulletListEditor'
import type { SlideData, SlideLayout, SlideContent } from '@/app/actions/presentations'

const LAYOUTS: { value: SlideLayout; label: string; icon: string }[] = [
  { value: 'title-body',    label: 'Título + texto',   icon: '📄' },
  { value: 'title-bullets', label: 'Título + bullets',  icon: '📋' },
  { value: 'title-image',   label: 'Título + imagen',   icon: '🖼️' },
  { value: 'blank',         label: 'Solo título',       icon: '⬜' },
]

function getDefaultContent(layout: SlideLayout): SlideContent {
  if (layout === 'title-body')    return { type: 'text',    value: '' }
  if (layout === 'title-bullets') return { type: 'bullets', value: [''] }
  if (layout === 'title-image')   return { type: 'image',   value: '' }
  return { type: 'blank', value: null }
}

interface Props {
  slide:          SlideData
  accentColor:    string
  onBlur:         (field: 'title' | 'content' | 'imageUrl', value: string | string[]) => void
  saveStatus:     'saved' | 'saving' | 'idle'
  onLayoutChange: (layout: SlideLayout) => void
}

export function SlideEditor({ slide, accentColor, onBlur, saveStatus, onLayoutChange }: Props) {
  const [localTitle,   setLocalTitle]   = useState(slide.title)
  const [localContent, setLocalContent] = useState(slide.content)
  const [localImage,   setLocalImage]   = useState(slide.imageUrl ?? '')

  useEffect(() => {
    setLocalTitle(slide.title)
    setLocalContent(slide.content)
    setLocalImage(slide.imageUrl ?? '')
  }, [slide.id])

  function handleLayoutChange(layout: SlideLayout) {
    onLayoutChange(layout)
    setLocalContent(getDefaultContent(layout))
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Save status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Editor</span>
        {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Guardando...</span>}
        {saveStatus === 'saved'  && <span className="text-xs text-green-600 dark:text-green-400">✓ Guardado</span>}
      </div>

      {/* Layout selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">Layout</label>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLayoutChange(l.value)}
              className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
                slide.layout === l.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Título</label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => onBlur('title', localTitle)}
          placeholder="Título del slide"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Content by layout */}
      {slide.layout === 'title-body' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Contenido</label>
          <textarea
            value={localContent.type === 'text' ? localContent.value : ''}
            onChange={(e) => setLocalContent({ type: 'text', value: e.target.value })}
            onBlur={() => localContent.type === 'text' && onBlur('content', localContent.value)}
            placeholder="Escribe el contenido del slide..."
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}

      {slide.layout === 'title-bullets' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Bullets</label>
          <BulletListEditor
            bullets={localContent.type === 'bullets' ? localContent.value : ['']}
            onChange={(bullets) => setLocalContent({ type: 'bullets', value: bullets })}
            onBlur={() => localContent.type === 'bullets' && onBlur('content', localContent.value)}
          />
        </div>
      )}

      {slide.layout === 'title-image' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">URL de imagen</label>
          <input
            type="url"
            value={localImage}
            onChange={(e) => setLocalImage(e.target.value)}
            onBlur={() => onBlur('imageUrl', localImage)}
            placeholder="https://..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {localImage && (
            <img
              src={localImage}
              alt="Preview"
              className="mt-2 max-h-32 w-full object-contain rounded border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      )}

      {slide.layout === 'blank' && (
        <p className="text-xs text-muted-foreground italic">Slide en blanco — solo se muestra el título.</p>
      )}
    </div>
  )
}
