import type { CSSProperties } from 'react'

export interface LogoCropSettings {
  x: number
  y: number
  zoom: number
}

export interface LogoTextSettings {
  x: number
  y: number
  size: number
  color: string
  font: string
}

export const LOGO_CROP_REFERENCE_FRAME = { width: 320, height: 62 }

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getLogoImageStyle(
  imageSize: { width: number; height: number } | null,
  crop: LogoCropSettings,
  frame: { width: number; height: number },
): CSSProperties {
  const safeZoom = clamp(crop.zoom, 1, 2)
  const baseScale = imageSize
    ? Math.max(frame.width / imageSize.width, frame.height / imageSize.height)
    : 1
  const displayWidth = imageSize ? imageSize.width * baseScale * safeZoom : frame.width
  const displayHeight = imageSize ? imageSize.height * baseScale * safeZoom : frame.height
  const maxX = Math.max(0, (displayWidth - frame.width) / 2)
  const maxY = Math.max(0, (displayHeight - frame.height) / 2)
  const scaledX = crop.x * (frame.width / LOGO_CROP_REFERENCE_FRAME.width)
  const scaledY = crop.y * (frame.height / LOGO_CROP_REFERENCE_FRAME.height)
  const safeX = clamp(scaledX, -maxX, maxX)
  const safeY = clamp(scaledY, -maxY, maxY)

  return {
    left: (frame.width - displayWidth) / 2 + safeX,
    top: (frame.height - displayHeight) / 2 + safeY,
    width: displayWidth,
    height: displayHeight,
  }
}

export function getLogoTextStyle(
  text: LogoTextSettings,
  frame: { width: number; height: number },
): CSSProperties {
  const scaleX = frame.width / LOGO_CROP_REFERENCE_FRAME.width
  const scaleY = frame.height / LOGO_CROP_REFERENCE_FRAME.height
  const fontSize = clamp(text.size * scaleY, 10, 26)

  return {
    left: clamp(text.x * scaleX, 0, Math.max(0, frame.width - 20)),
    top: clamp(text.y * scaleY, 2, Math.max(2, frame.height - fontSize - 2)),
    fontSize,
    color: text.color,
    fontFamily: text.font,
    lineHeight: '1',
  }
}
