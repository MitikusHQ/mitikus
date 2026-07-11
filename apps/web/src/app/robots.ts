import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/workspace/', '/onboarding'] },
    sitemap: 'https://www.mitikus.com/sitemap.xml',
  }
}
