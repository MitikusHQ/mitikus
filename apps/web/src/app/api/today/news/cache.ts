export interface NewsArticle {
  title: string
  description: string | null
  url: string
  source: string
  publishedAt: string
  scope: 'sector' | 'national' | 'autonomic' | 'local' | 'international'
}

export const newsCache = new Map<string, { articles: NewsArticle[]; fetchedAt: number }>()
