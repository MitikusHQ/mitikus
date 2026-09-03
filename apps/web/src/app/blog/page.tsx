import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — MITIKUS',
  description: 'Recursos, guías y consejos para profesionales, pymes y equipos que quieren trabajar mejor.',
}

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  readingTime: number
  image?: string
  imageAlt?: string
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_BLOG_OWNER}/${process.env.GITHUB_BLOG_REPO}/contents/blog`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_BLOG_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 },
      },
    )

    if (!res.ok) return []

    const files = (await res.json()) as Array<{ name: string; download_url: string }>
    const mdxFiles = files.filter((f) => f.name.endsWith('.mdx')).reverse()

    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const slug = file.name.replace('.mdx', '')
        const content = await fetch(file.download_url, { next: { revalidate: 3600 } }).then((r) =>
          r.text(),
        )
        const title: string = content.match(/^#\s+(.+)$/m)?.[1] ?? slug
        const excerpt: string = content.match(/^> (.+)$/m)?.[1] ?? ''
        const dateMatch = content.match(/publishedAt:\s*(.+)/)
        const now = new Date()
        const publishedAt: string = dateMatch?.[1]?.trim() ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const image = content.match(/^image:\s*(.+)$/m)?.[1]?.trim()
        const imageAlt = content.match(/^imageAlt:\s*(.+)$/m)?.[1]?.trim()
        const words = content.split(/\s+/).length
        const readingTime = Math.max(1, Math.round(words / 200))
        return { slug, title, excerpt, publishedAt, readingTime, image, imageAlt }
      }),
    )

    return posts
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold hover:opacity-80 transition-opacity">
            MITIKUS
          </Link>
          <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Empieza gratis →
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground mb-12">
          Recursos, guías y consejos para profesionales que quieren trabajar mejor.
        </p>

        {posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Próximamente — los primeros artículos están en camino.</p>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <article key={post.slug} className="py-8 group">
                <Link href={`/blog/${post.slug}`} className="flex gap-6 items-start">
                  {post.image && (
                    <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={post.image}
                        alt={post.imageAlt ?? post.title}
                        width={128}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <time className="text-xs text-muted-foreground">{post.publishedAt} · {post.readingTime} min de lectura</time>
                    <h2 className="text-xl font-semibold mt-1 mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t mt-20">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MITIKUS.{' '}
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
          {' · '}
          <Link href="/sign-up" className="hover:text-foreground transition-colors">Empieza gratis</Link>
        </div>
      </footer>
    </main>
  )
}

