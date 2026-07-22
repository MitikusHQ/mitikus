import { notFound } from 'next/navigation'
import { getPresentationByToken } from '@/app/actions/presentations'
import type { SlideData } from '@/app/actions/presentations'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderSlide(slide: SlideData): string {
  const titleHtml = slide.title
    ? `<h2>${escapeHtml(slide.title)}</h2>`
    : ''

  let bodyHtml = ''
  if (slide.layout === 'title-body' && slide.content.type === 'text') {
    bodyHtml = `<p>${escapeHtml(slide.content.value)}</p>`
  } else if (slide.layout === 'title-bullets' && slide.content.type === 'bullets') {
    const items = slide.content.value.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
    bodyHtml = `<ul style="text-align:left;display:inline-block">${items}</ul>`
  } else if (slide.layout === 'title-image' && slide.imageUrl) {
    bodyHtml = `<img src="${escapeHtml(slide.imageUrl)}" style="max-height:400px;max-width:100%;object-fit:contain" alt="" />`
  }

  return `<section>${titleHtml}${bodyHtml}</section>`
}

export default async function PublicPresentationPage({ params }: Props) {
  const { token } = await params
  const presentation = await getPresentationByToken(token)
  if (!presentation) notFound()

  const slidesHtml = presentation.slides.map(renderSlide).join('\n      ')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(presentation.title)}</title>
  <link rel="stylesheet" href="/api/reveal/reveal.css">
  <link rel="stylesheet" href="/api/reveal/theme/white.css">
  <style>
    :root { --r-link-color: ${presentation.accentColor}; }
    .reveal h1, .reveal h2 { color: ${presentation.accentColor}; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHtml}
    </div>
  </div>
  <script src="/api/reveal/reveal.js"></script>
  <script>Reveal.initialize({ hash: true, slideNumber: true });</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
