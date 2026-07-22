'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  updatePresentation,
  updateSlide,
  addSlide,
  deleteSlide,
} from '@/app/actions/presentations'
import { SlideEditor }   from './SlideEditor'
import { SlidePreview }  from './SlidePreview'
import type { PresentationDetail, SlideLayout } from '@/app/actions/presentations'

const PRESET_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  presentation: PresentationDetail
  workspaceId:  string
}

export function PresentationEditorClient({ presentation, workspaceId }: Props) {
  const router = useRouter()

  const [slides,         setSlides]        = useState(presentation.slides)
  const [activeSlideId,  setActiveSlideId] = useState(presentation.slides[0]?.id ?? '')
  const [title,          setTitle]         = useState(presentation.title)
  const [accentColor,    setAccentColor]   = useState(presentation.accentColor)
  const [saveStatus,     setSaveStatus]    = useState<'saved' | 'saving' | 'idle'>('idle')

  const activeSlide = slides.find((s) => s.id === activeSlideId) ?? slides[0]

  async function handleTitleBlur() {
    if (title === presentation.title) return
    setSaveStatus('saving')
    await updatePresentation(presentation.id, { title })
    setSaveStatus('saved')
    router.refresh()
  }

  async function handleColorChange(color: string) {
    setAccentColor(color)
    setSaveStatus('saving')
    await updatePresentation(presentation.id, { accentColor: color })
    setSaveStatus('saved')
  }

  const handleSlideFieldBlur = useCallback(
    async (field: 'title' | 'content' | 'imageUrl', value: string | string[]) => {
      if (!activeSlide) return
      setSaveStatus('saving')

      if (field === 'title') {
        await updateSlide(activeSlide.id, { title: value as string })
        setSlides((prev) =>
          prev.map((s) => s.id === activeSlide.id ? { ...s, title: value as string } : s)
        )
      } else if (field === 'content') {
        const content = Array.isArray(value)
          ? { type: 'bullets' as const, value }
          : activeSlide.layout === 'title-image'
            ? { type: 'image'  as const, value: value as string }
            : { type: 'text'   as const, value: value as string }
        await updateSlide(activeSlide.id, { content })
        setSlides((prev) =>
          prev.map((s) => s.id === activeSlide.id ? { ...s, content } : s)
        )
      } else if (field === 'imageUrl') {
        await updateSlide(activeSlide.id, { imageUrl: value as string })
        setSlides((prev) =>
          prev.map((s) => s.id === activeSlide.id ? { ...s, imageUrl: value as string } : s)
        )
      }

      setSaveStatus('saved')
    },
    [activeSlide],
  )

  async function handleLayoutChange(layout: SlideLayout) {
    if (!activeSlide) return
    setSaveStatus('saving')
    await updateSlide(activeSlide.id, { layout })
    setSlides((prev) =>
      prev.map((s) => s.id === activeSlide.id ? { ...s, layout } : s)
    )
    setSaveStatus('saved')
  }

  async function handleAddSlide() {
    const { id } = await addSlide(presentation.id)
    const newSlide = {
      id,
      order:    slides.length,
      layout:   'title-body' as SlideLayout,
      title:    '',
      content:  { type: 'text' as const, value: '' },
      imageUrl: null,
    }
    setSlides((prev) => [...prev, newSlide])
    setActiveSlideId(id)
  }

  async function handleDeleteSlide(slideId: string) {
    if (slides.length === 1) return
    await deleteSlide(slideId)
    const remaining = slides.filter((s) => s.id !== slideId)
    setSlides(remaining)
    if (activeSlideId === slideId) {
      const idx = slides.findIndex((s) => s.id === slideId)
      setActiveSlideId(remaining[Math.max(0, idx - 1)]?.id ?? '')
    }
  }

  function handleShare() {
    void navigator.clipboard.writeText(`https://www.mitikus.com/p/${presentation.shareToken}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
          placeholder="Título de la presentación"
        />

        {/* Color picker */}
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${accentColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border border-input"
            title="Color personalizado"
          />
        </div>

        {saveStatus === 'saving' && <span className="text-xs text-muted-foreground">Guardando...</span>}
        {saveStatus === 'saved'  && <span className="text-xs text-green-600 dark:text-green-400">✓ Guardado</span>}

        <a
          href={`/p/${presentation.shareToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-muted"
        >
          ▶ Presentar
        </a>
        <button
          onClick={handleShare}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
        >
          Compartir
        </button>
      </div>

      {/* Body: sidebar + editor + preview hint */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 border-r flex flex-col shrink-0 overflow-y-auto p-2 gap-1">
          {slides.map((slide, index) => (
            <div key={slide.id} className="group relative">
              <SlidePreview
                slide={slide}
                index={index}
                isActive={slide.id === activeSlideId}
                onClick={() => setActiveSlideId(slide.id)}
              />
              {slides.length > 1 && (
                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="absolute right-1 top-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded text-muted-foreground hover:text-destructive text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddSlide}
            className="mt-1 rounded border border-dashed border-border py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            + Slide
          </button>
        </div>

        {/* Editor central */}
        <div className="flex-1 overflow-hidden">
          {activeSlide && (
            <SlideEditor
              key={activeSlide.id}
              slide={activeSlide}
              accentColor={accentColor}
              onBlur={handleSlideFieldBlur}
              saveStatus={saveStatus}
              onLayoutChange={handleLayoutChange}
            />
          )}
        </div>

        {/* Panel derecho: info y link */}
        <div className="w-48 border-l p-4 flex flex-col gap-3 shrink-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vista previa</p>
          <p className="text-xs text-muted-foreground">
            La presentación se abre en una nueva pestaña con reveal.js.
          </p>
          <a
            href={`/p/${presentation.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-input px-3 py-2 text-xs text-center hover:bg-muted"
          >
            👁 Abrir vista previa
          </a>
          <div className="mt-auto pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">{slides.length} {slides.length === 1 ? 'slide' : 'slides'}</p>
            <button onClick={handleShare} className="text-xs text-primary hover:underline w-full text-left">
              Copiar link público
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
