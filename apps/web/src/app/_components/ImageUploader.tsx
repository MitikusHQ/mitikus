'use client'

import { useEffect, useRef, useState } from 'react'
import { LOGO_CROP_REFERENCE_FRAME, clamp, getLogoImageStyle } from '@/lib/logo-crop'

export interface ImageCropSettings {
  x: number
  y: number
  zoom: number
}

interface ImageUploaderProps {
  currentUrl?: string | null
  folder: string
  shape?: 'circle' | 'square'
  cropMode?: 'none' | 'circle' | 'wide'
  currentCrop?: ImageCropSettings
  size?: number
  placeholder?: string
  onUploaded: (url: string, crop?: ImageCropSettings) => void | Promise<void>
}

export function ImageUploader({
  currentUrl,
  folder,
  shape = 'square',
  cropMode,
  currentCrop,
  size = 80,
  placeholder = '?',
  onUploaded,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropUrl, setCropUrl] = useState<string | null>(null)
  const [cropIsObjectUrl, setCropIsObjectUrl] = useState(false)
  const [cropOriginalFile, setCropOriginalFile] = useState<File | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [previewImageSize, setPreviewImageSize] = useState<{ width: number; height: number } | null>(null)
  const [appliedCrop, setAppliedCrop] = useState<ImageCropSettings | undefined>(currentCrop)
  const [zoom, setZoom] = useState(currentCrop?.zoom ?? 1)
  const [offset, setOffset] = useState({ x: currentCrop?.x ?? 0, y: currentCrop?.y ?? 0 })
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const currentCropX = currentCrop?.x
  const currentCropY = currentCrop?.y
  const currentCropZoom = currentCrop?.zoom

  useEffect(() => {
    setPreview(currentUrl ?? null)
    if (!currentUrl) {
      setPreviewImageSize(null)
      return
    }
    const img = new Image()
    img.onload = () => setPreviewImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => setPreviewImageSize(null)
    img.src = currentUrl
  }, [currentUrl])

  useEffect(() => {
    setAppliedCrop(
      currentCropX === undefined || currentCropY === undefined || currentCropZoom === undefined
        ? undefined
        : { x: currentCropX, y: currentCropY, zoom: currentCropZoom },
    )
  }, [currentCropX, currentCropY, currentCropZoom])

  const borderRadius = shape === 'circle' ? '50%' : '10px'
  const effectiveCropMode = cropMode ?? (shape === 'circle' ? 'circle' : 'none')
  const defaultZoom = 1
  const minZoom = 1
  const maxZoom = effectiveCropMode === 'wide' ? 2 : 2.8
  const cropFrame = effectiveCropMode === 'wide'
    ? { ...LOGO_CROP_REFERENCE_FRAME, outputWidth: 1040, outputHeight: 200, className: 'rounded-lg' }
    : { width: 220, height: 220, outputWidth: 512, outputHeight: 512, className: 'rounded-full' }
  const previewWidth = effectiveCropMode === 'wide' ? size : size
  const previewHeight = effectiveCropMode === 'wide' ? Math.round(size * cropFrame.height / cropFrame.width) : size
  const previewCrop = appliedCrop ?? { x: 0, y: 0, zoom: defaultZoom }
  const safePreviewZoom = Math.min(maxZoom, Math.max(minZoom, previewCrop.zoom))
  const previewImageStyle = getLogoImageStyle(previewImageSize, { ...previewCrop, zoom: safePreviewZoom }, { width: previewWidth, height: previewHeight })
  const clampOffset = (next: { x: number; y: number }, nextZoom = Math.max(minZoom, zoom)) => {
    if (!imageSize) return next
    const baseScale = Math.max(cropFrame.width / imageSize.width, cropFrame.height / imageSize.height)
    const displayWidth = imageSize.width * baseScale * nextZoom
    const displayHeight = imageSize.height * baseScale * nextZoom
    const maxX = Math.max(0, (displayWidth - cropFrame.width) / 2)
    const maxY = Math.max(0, (displayHeight - cropFrame.height) / 2)
    return {
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    }
  }
  async function uploadFile(file: File, localPreview?: string, crop?: ImageCropSettings) {
    setError(null)
    setLoading(true)
    const local = localPreview ?? URL.createObjectURL(file)
    setPreview(local)

    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al subir la imagen')
      setPreview(currentUrl ?? null)
    } else {
      if (crop) setAppliedCrop(crop)
      await onUploaded(data.url, crop)
    }
    setLoading(false)
  }

  function handleFile(file: File) {
    if (effectiveCropMode === 'none') {
      uploadFile(file)
      return
    }

    setError(null)
    const local = URL.createObjectURL(file)
    setCropUrl(local)
    setCropIsObjectUrl(true)
    setCropOriginalFile(file)
    setImageSize(null)
    setZoom(Math.min(maxZoom, Math.max(minZoom, appliedCrop?.zoom ?? defaultZoom)))
    setOffset(effectiveCropMode === 'wide' ? { x: 0, y: 0 } : { x: appliedCrop?.x ?? 0, y: appliedCrop?.y ?? 0 })
  }

  function openCropForCurrentImage() {
    if (!preview) return
    setError(null)
    setCropUrl(preview)
    setCropIsObjectUrl(false)
    setCropOriginalFile(null)
    setImageSize(previewImageSize ?? null)
    setZoom(Math.min(maxZoom, Math.max(minZoom, appliedCrop?.zoom ?? defaultZoom)))
    setOffset({ x: appliedCrop?.x ?? 0, y: appliedCrop?.y ?? 0 })
  }

  function closeCrop() {
    if (cropUrl && cropIsObjectUrl) URL.revokeObjectURL(cropUrl)
    setCropUrl(null)
    setCropIsObjectUrl(false)
    setCropOriginalFile(null)
    setImageSize(null)
    dragStartRef.current = null
  }

  async function createCroppedAvatar(): Promise<File> {
    if (!cropUrl) throw new Error('No hay imagen seleccionada')

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = cropUrl
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('No se pudo leer la imagen'))
    })

    const baseScale = Math.max(cropFrame.width / image.naturalWidth, cropFrame.height / image.naturalHeight)
    const safeZoom = Math.min(maxZoom, Math.max(minZoom, zoom))
    const displayWidth = image.naturalWidth * baseScale * safeZoom
    const displayHeight = image.naturalHeight * baseScale * safeZoom
    const displayX = (cropFrame.width - displayWidth) / 2 + offset.x
    const displayY = (cropFrame.height - displayHeight) / 2 + offset.y
    const outputScaleX = cropFrame.outputWidth / cropFrame.width
    const outputScaleY = cropFrame.outputHeight / cropFrame.height

    const canvas = document.createElement('canvas')
    canvas.width = cropFrame.outputWidth
    canvas.height = cropFrame.outputHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo preparar la imagen')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cropFrame.outputWidth, cropFrame.outputHeight)
    ctx.drawImage(
      image,
      displayX * outputScaleX,
      displayY * outputScaleY,
      displayWidth * outputScaleX,
      displayHeight * outputScaleY,
    )

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) throw new Error('No se pudo recortar la imagen')
    return new File([blob], effectiveCropMode === 'wide' ? 'logo.jpg' : 'avatar.jpg', { type: 'image/jpeg' })
  }

  async function saveCroppedAvatar() {
    try {
      if (effectiveCropMode === 'wide') {
        const crop = { x: offset.x, y: offset.y, zoom: Math.min(maxZoom, Math.max(minZoom, zoom)) }
        if (cropOriginalFile) {
          const local = cropUrl ?? undefined
          await uploadFile(cropOriginalFile, local, crop)
          closeCrop()
        } else if (cropUrl) {
          setLoading(true)
          setPreview(cropUrl)
          setAppliedCrop(crop)
          if (imageSize) setPreviewImageSize(imageSize)
          await onUploaded(cropUrl, crop)
          closeCrop()
          setLoading(false)
        }
        return
      }

      const cropped = await createCroppedAvatar()
      const local = URL.createObjectURL(cropped)
      closeCrop()
      await uploadFile(cropped, local)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar la foto')
      setLoading(false)
    }
  }

  const editorBaseScale = imageSize
    ? Math.max(cropFrame.width / imageSize.width, cropFrame.height / imageSize.height)
    : 1
  const editorZoom = Math.min(maxZoom, Math.max(minZoom, zoom))
  const editorWidth = imageSize ? imageSize.width * editorBaseScale * editorZoom : cropFrame.width
  const editorHeight = imageSize ? imageSize.height * editorBaseScale * editorZoom : cropFrame.height
  const editorLeft = (cropFrame.width - editorWidth) / 2 + offset.x
  const editorTop = (cropFrame.height - editorHeight) / 2 + offset.y

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{ width: previewWidth, height: previewHeight, borderRadius }}
        className="relative overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-muted/40 group"
        aria-label="Cambiar imagen"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Imagen actual"
            className={effectiveCropMode === 'wide' ? 'pointer-events-none absolute max-w-none select-none' : 'w-full h-full object-cover'}
            onLoad={(e) => {
              if (effectiveCropMode !== 'wide') return
              const img = e.currentTarget
              setPreviewImageSize({ width: img.naturalWidth, height: img.naturalHeight })
            }}
            style={effectiveCropMode === 'wide' ? previewImageStyle : undefined}
          />
        ) : (
          <span className="text-2xl text-muted-foreground">{placeholder}</span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
        </div>
      </button>

      <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 5 MB</p>

      {preview && effectiveCropMode !== 'none' && (
        <button
          type="button"
          onClick={openCropForCurrentImage}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Ajustar imagen actual
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />

      {cropUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Ajustar foto</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Arrastra la imagen y usa el zoom para encajarla en el {effectiveCropMode === 'wide' ? 'rectángulo' : 'círculo'}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCrop}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="flex justify-center">
              <div
                className={`relative cursor-grab touch-none overflow-hidden border-2 border-primary/60 bg-muted active:cursor-grabbing ${cropFrame.className}`}
                style={{ width: cropFrame.width, height: cropFrame.height }}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
                }}
                onPointerMove={(e) => {
                  const dragStart = dragStartRef.current
                  if (!dragStart) return
                  e.preventDefault()
                  setOffset(clampOffset({
                    x: dragStart.ox + e.clientX - dragStart.x,
                    y: dragStart.oy + e.clientY - dragStart.y,
                  }))
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId)
                  dragStartRef.current = null
                }}
                onPointerCancel={() => {
                  dragStartRef.current = null
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropUrl}
                  alt="Vista previa"
                  draggable={false}
                  className="pointer-events-none absolute max-w-none select-none"
                  onLoad={(e) => {
                    const img = e.currentTarget
                    setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
                  }}
                  style={{
                    left: editorLeft,
                    top: editorTop,
                    width: editorWidth,
                    height: editorHeight,
                  }}
                />
              </div>
            </div>

            <label className="mt-5 block text-xs font-medium text-muted-foreground" htmlFor="avatar-zoom">
              Zoom
            </label>
            <input
              id="avatar-zoom"
              type="range"
              min={minZoom}
              max={maxZoom}
              step="0.05"
              value={zoom}
              onChange={(e) => {
                const nextZoom = Number(e.target.value)
                setZoom(nextZoom)
                setOffset((prev) => clampOffset(prev, nextZoom))
              }}
              className="mt-2 w-full"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-muted-foreground" htmlFor="avatar-offset-x">
                Horizontal
                <input
                  id="avatar-offset-x"
                  type="range"
                  min={-cropFrame.width / 2}
                  max={cropFrame.width / 2}
                  step="1"
                  value={offset.x}
                  onChange={(e) => setOffset((prev) => clampOffset({ ...prev, x: Number(e.target.value) }))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground" htmlFor="avatar-offset-y">
                Vertical
                <input
                  id="avatar-offset-y"
                  type="range"
                  min={-cropFrame.height / 2}
                  max={cropFrame.height / 2}
                  step="1"
                  value={offset.y}
                  onChange={(e) => setOffset((prev) => clampOffset({ ...prev, y: Number(e.target.value) }))}
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setOffset((prev) => clampOffset({ ...prev, x: prev.x - 12 }))}
                className="h-9 w-9 rounded-md border border-border text-sm hover:bg-muted"
                aria-label="Mover izquierda"
              >
                ←
              </button>
              <div className="grid grid-rows-2 gap-1">
                <button
                  type="button"
                  onClick={() => setOffset((prev) => clampOffset({ ...prev, y: prev.y - 12 }))}
                  className="h-8 w-9 rounded-md border border-border text-sm hover:bg-muted"
                  aria-label="Mover arriba"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => setOffset((prev) => clampOffset({ ...prev, y: prev.y + 12 }))}
                  className="h-8 w-9 rounded-md border border-border text-sm hover:bg-muted"
                  aria-label="Mover abajo"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOffset((prev) => clampOffset({ ...prev, x: prev.x + 12 }))}
                className="h-9 w-9 rounded-md border border-border text-sm hover:bg-muted"
                aria-label="Mover derecha"
              >
                →
              </button>
            </div>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setZoom(defaultZoom)
                  setOffset({ x: 0, y: 0 })
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Centrar
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCrop}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveCroppedAvatar}
                disabled={loading}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
