import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { newsCache } from './cache'
import type { NewsArticle } from './cache'

const cache = newsCache
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const CITY_TO_COMMUNITY: Record<string, string> = {
  madrid: 'Comunidad de Madrid',
  barcelona: 'Cataluña',
  valencia: 'Valencia',
  sevilla: 'Andalucía',
  bilbao: 'País Vasco',
  zaragoza: 'Aragón',
  malaga: 'Andalucía',
  palma: 'Islas Baleares',
  murcia: 'Murcia',
  alicante: 'Valencia',
  valladolid: 'Castilla y León',
  vigo: 'Galicia',
  gijon: 'Asturias',
  cordoba: 'Andalucía',
  granada: 'Andalucía',
  santander: 'Cantabria',
  oviedo: 'Asturias',
  pamplona: 'Navarra',
  logrono: 'La Rioja',
  toledo: 'Castilla-La Mancha',
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function cityToCommunity(city: string | null): string | null {
  if (!city) return null
  return CITY_TO_COMMUNITY[normalize(city)] ?? null
}

interface Rss2JsonItem {
  title: string
  link: string
  pubDate: string
  author?: string
  description?: string
}

interface Rss2JsonResponse {
  status: string
  items: Rss2JsonItem[]
}

async function fetchGoogleNewsRSS(
  query: string,
  options: { hl?: string; gl?: string; pageSize?: number },
): Promise<NewsArticle[]> {
  const hl = options.hl ?? 'es'
  const gl = options.gl ?? 'ES'
  const ceid = `${gl}:${hl}`
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`
  // rss2json proxea el RSS a través de sus servidores (evita bloqueo de IPs de datacenter)
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`

  try {
    const res = await fetch(proxyUrl, { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json() as Rss2JsonResponse
    if (data.status !== 'ok' || !Array.isArray(data.items)) return []
    const pageSize = options.pageSize ?? 8
    return data.items
      .filter((i) => i.title && !String(i.title).startsWith('[Removed]'))
      .slice(0, pageSize)
      .map((i) => {
        let publishedAt = new Date().toISOString()
        const d = new Date(i.pubDate)
        if (!isNaN(d.getTime())) publishedAt = d.toISOString()
        return {
          title: String(i.title).replace(/ - [^-]+$/, ''),
          description: null,
          url: String(i.link),
          source: String(i.author ?? ''),
          publishedAt,
          scope: 'sector' as const,
        }
      })
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })

  const cached = cache.get(workspaceId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    const scopes = new Set(cached.articles.map((a) => a.scope))
    if (scopes.size > 1) {
      return NextResponse.json({ articles: cached.articles })
    }
    cache.delete(workspaceId)
  }

  const profile = await db.companyProfile.findUnique({
    where: { workspaceId },
    select: { sector: true, subsector: true, city: true, country: true },
  })

  if (!profile?.sector) {
    return NextResponse.json({ articles: [], noSector: true })
  }

  // Usar solo el sector como query principal — combinar con subsector da consultas demasiado específicas
  const sectorQuery = profile.sector!
  const community = cityToCommunity(profile.city)
  const glCode = normalize(profile.country ?? 'es') === 'espana' || normalize(profile.country ?? '') === 'spain' || (profile.country?.toUpperCase() ?? 'ES') === 'ES'
    ? 'ES'
    : (profile.country?.toUpperCase().slice(0, 2) ?? 'ES')

  const [sectorNews, nationalNews, autonomicNews, localNews, intlNews] = await Promise.all([
    // Sector — artículos del sector específico
    fetchGoogleNewsRSS(sectorQuery, { hl: 'es', gl: glCode, pageSize: 8 }),
    // Nacional — noticias destacadas de España (sin filtro de sector)
    fetchGoogleNewsRSS('noticias España', { hl: 'es', gl: glCode, pageSize: 8 }),
    // Autonómico — noticias destacadas de la comunidad (sin filtro de sector)
    community
      ? fetchGoogleNewsRSS(`noticias ${community}`, { hl: 'es', gl: glCode, pageSize: 8 })
      : Promise.resolve([] as NewsArticle[]),
    // Local — noticias destacadas de la ciudad (sin filtro de sector)
    profile.city
      ? fetchGoogleNewsRSS(`noticias ${profile.city}`, { hl: 'es', gl: glCode, pageSize: 8 })
      : Promise.resolve([] as NewsArticle[]),
    // Internacional — noticias del mundo en español
    fetchGoogleNewsRSS('noticias mundo internacional', { hl: 'es', gl: glCode, pageSize: 8 }),
  ])

  const tagged: NewsArticle[] = [
    ...sectorNews.map((a) => ({ ...a, scope: 'sector' as const })),
    ...nationalNews.map((a) => ({ ...a, scope: 'national' as const })),
    ...autonomicNews.map((a) => ({ ...a, scope: 'autonomic' as const })),
    ...localNews.map((a) => ({ ...a, scope: 'local' as const })),
    ...intlNews.map((a) => ({ ...a, scope: 'international' as const })),
  ]

  const seen = new Set<string>()
  const articles = tagged.filter((a) => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  cache.set(workspaceId, { articles, fetchedAt: Date.now() })
  return NextResponse.json({ articles })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
  cache.delete(workspaceId)
  return NextResponse.json({ ok: true })
}
