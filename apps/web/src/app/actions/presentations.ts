'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'
import type {
  SlideLayout,
  SlideContent,
  SlideData,
  PresentationData,
  PresentationDetail,
  PresentationPublic,
  SlideInput,
} from './presentations-types'

export type {
  SlideLayout,
  SlideContent,
  SlideData,
  PresentationData,
  PresentationDetail,
  PresentationPublic,
  SlideInput,
}

// ---- Helpers internos ----

function parseContent(raw: string): SlideContent {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.type === 'string') return parsed as SlideContent
  } catch {}
  return { type: 'text', value: '' }
}

function mapSlide(s: {
  id: string; order: number; layout: string; title: string; content: string; imageUrl: string | null
}): SlideData {
  return {
    id:       s.id,
    order:    s.order,
    layout:   s.layout as SlideLayout,
    title:    s.title,
    content:  parseContent(s.content),
    imageUrl: s.imageUrl,
  }
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

// ---- Actions ----

export async function getPresentations(workspaceId: string): Promise<PresentationData[]> {
  await getAuthUser()
  const rows = await db.presentation.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, accentColor: true, shareToken: true, createdAt: true,
      creator: { select: { name: true } },
      _count:  { select: { slides: true } },
    },
  })
  return rows.map((r) => ({
    id:          r.id,
    title:       r.title,
    accentColor: r.accentColor,
    shareToken:  r.shareToken,
    slideCount:  r._count.slides,
    createdAt:   r.createdAt.toISOString(),
    creatorName: r.creator.name ?? null,
  }))
}

export async function getPresentation(workspaceId: string, presentationId: string): Promise<PresentationDetail> {
  await getAuthUser()
  const p = await db.presentation.findFirst({
    where: { id: presentationId, workspaceId },
    include: {
      slides:  { orderBy: { order: 'asc' } },
      creator: { select: { name: true } },
      _count:  { select: { slides: true } },
    },
  })
  if (!p) throw new Error('Presentation not found')
  return {
    id:          p.id,
    title:       p.title,
    accentColor: p.accentColor,
    shareToken:  p.shareToken,
    slideCount:  p._count.slides,
    createdAt:   p.createdAt.toISOString(),
    creatorName: p.creator.name ?? null,
    slides:      p.slides.map(mapSlide),
  }
}

export async function createPresentation(
  workspaceId: string,
  title: string,
  accentColor: string,
  templateSlides?: Omit<SlideData, 'id' | 'order'>[]
): Promise<{ id: string }> {
  const user = await getAuthUser()
  const slides = templateSlides ?? []
  const p = await db.presentation.create({
    data: {
      workspaceId,
      title,
      accentColor,
      createdBy: user.id,
      slides: {
        create: slides.map((s, i) => ({
          order:    i,
          layout:   s.layout,
          title:    s.title,
          content:  JSON.stringify(s.content),
          imageUrl: s.imageUrl,
        })),
      },
    },
  })
  await logActivity(workspaceId, 'presentation', p.id, user.id, 'created')
  revalidatePath(`/workspace/${workspaceId}/presentations`)
  return { id: p.id }
}

export async function updatePresentation(
  presentationId: string,
  data: { title?: string; accentColor?: string }
): Promise<void> {
  await getAuthUser()
  await db.presentation.update({ where: { id: presentationId }, data })
}

export async function addSlide(presentationId: string): Promise<{ id: string; order: number }> {
  const user = await getAuthUser()
  const last = await db.slide.findFirst({
    where:   { presentationId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  })
  const order = (last?.order ?? -1) + 1
  const slide = await db.slide.create({
    data: {
      presentationId,
      order,
      layout:  'title-body',
      title:   '',
      content: JSON.stringify({ type: 'text', value: '' }),
    },
  })
  const pres = await db.presentation.findUnique({ where: { id: presentationId }, select: { workspaceId: true } })
  if (pres) await logActivity(pres.workspaceId, 'presentation', presentationId, user.id, 'slide_added')
  return { id: slide.id, order: slide.order }
}

export async function updateSlide(slideId: string, data: SlideInput): Promise<void> {
  await getAuthUser()
  await db.slide.update({
    where: { id: slideId },
    data: {
      ...(data.layout   !== undefined && { layout: data.layout }),
      ...(data.title    !== undefined && { title: data.title }),
      ...(data.content  !== undefined && { content: JSON.stringify(data.content) }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  })
}

export async function deleteSlide(slideId: string): Promise<void> {
  await getAuthUser()
  await db.slide.delete({ where: { id: slideId } })
}

export async function deletePresentation(presentationId: string): Promise<void> {
  await getAuthUser()
  const p = await db.presentation.findUnique({ where: { id: presentationId }, select: { workspaceId: true } })
  if (!p) return
  await db.presentation.delete({ where: { id: presentationId } })
  revalidatePath(`/workspace/${p.workspaceId}/presentations`)
}

export async function getPresentationByToken(shareToken: string): Promise<PresentationPublic | null> {
  const p = await db.presentation.findUnique({
    where:   { shareToken },
    include: { slides: { orderBy: { order: 'asc' } } },
  })
  if (!p) return null
  return {
    id:          p.id,
    title:       p.title,
    accentColor: p.accentColor,
    slides:      p.slides.map(mapSlide),
  }
}
