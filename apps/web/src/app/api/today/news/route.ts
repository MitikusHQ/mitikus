import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { XMLParser } from 'fast-xml-parser'

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

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

async function fetchGoogleNewsRSS(
  query: string,
  options: { hl?: string; gl?: string; pageSize?: number },
): Promise<NewsArticle[]> {
  const hl = options.hl ?? 'es'
  const gl = options.gl ?? 'ES'
  const ceid = `${gl}:${hl}`
  const q = encodeURIComponent(query)
  const url = `https://news.google.com/rss/search?q=${q}&hl=${hl}&gl=${gl}&ceid=${ceid}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MITIKUS/1.0)' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = xmlParser.parse(xml)
    const items: Array<{ title: string; link: string; pubDate?: string; source?: { '#text'?: string; '@_url'?: string } | string }> =
      parsed?.rss?.channel?.item ?? []
    const arr = Array.isArray(items) ? items : [items]
    return arr
      .slice(0, options.pageSize ?? 3)
      .filter((i) => i.title && !String(i.title).startsWith('[Removed]'))
      .map((i) => {
        let publishedAt = new Date().toISOString()
        if (i.pubDate) {
          const d = new Date(String(i.pubDate))
          if (!isNaN(d.getTime())) publishedAt = d.toISOString()
        }
        return {
          title: String(i.title).replace(/ - [^-]+$/, ''),
          description: null,
          url: String(i.link),
          source: typeof i.source === 'object' ? (i.source?.['#text'] ?? '') : String(i.source ?? ''),
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

  const sectorQuery = [profile.sector, profile.subsector].filter(Boolean).join(' ')
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
