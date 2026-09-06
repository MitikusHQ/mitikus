import { MetadataRoute } from 'next'

async function getBlogSlugs(lang: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_BLOG_OWNER}/${process.env.GITHUB_BLOG_REPO}/contents/blog/${lang}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_BLOG_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 },
      },
    )
    if (!res.ok) return []
    const files = (await res.json()) as Array<{ name: string }>
    return files.filter((f) => f.name.endsWith('.mdx')).map((f) => f.name.replace('.mdx', ''))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.mitikus.com'

  const [esSlugs, enSlugs] = await Promise.all([getBlogSlugs('es'), getBlogSlugs('en')])
  const allSlugs = [...new Set([...esSlugs, ...enSlugs])]

  const postEntries: MetadataRoute.Sitemap = allSlugs.map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...postEntries,
    {
      url: `${base}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}
