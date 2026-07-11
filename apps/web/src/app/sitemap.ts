import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.mitikus.com'
  const now = new Date()
  return [
    { url: base,                   lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/tools`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/sign-in`,      lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/sign-up`,      lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
