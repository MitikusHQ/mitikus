import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

interface PostData {
  content: string
  title: string
  publishedAt: string
  excerpt: string
  image?: string
  imageAlt?: string
}

async function getPost(slug: string): Promise<PostData | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_BLOG_OWNER}/${process.env.GITHUB_BLOG_REPO}/contents/blog/${slug}.mdx`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_BLOG_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 },
      },
    )

    if (!res.ok) return null

    const data = (await res.json()) as { content: string }
    const raw = Buffer.from(data.content, 'base64').toString('utf-8')

    const title = raw.match(/^#\s+(.+)$/m)?.[1] ?? slug
    const excerpt = raw.match(/^> (.+)$/m)?.[1] ?? ''
    const dateMatch = raw.match(/publishedAt:\s*(.+)/)
    const publishedAt = dateMatch?.[1]?.trim() ?? ''
    const image = raw.match(/^image:\s*(.+)$/m)?.[1]?.trim()
    const imageAlt = raw.match(/^imageAlt:\s*(.+)$/m)?.[1]?.trim()

    return { content: raw, title, publishedAt, excerpt, image, imageAlt }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Artículo no encontrado — MITIKUS' }
  return {
    title: `${post.title} — MITIKUS Blog`,
    description: post.excerpt,
  }
}

function mdxToHtml(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hbuaocl])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[h1-6ul])/g, '$1')
    .replace(/(<\/[h1-6ul]>)<\/p>/g, '$1')
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const html = mdxToHtml(post.content)

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold hover:opacity-80 transition-opacity">
            MITIKUS
          </Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Blog
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-14 prose prose-neutral dark:prose-invert">
        {post.publishedAt && (
          <time className="text-xs text-muted-foreground not-prose block mb-6">{post.publishedAt}</time>
        )}
        {post.image && (
          <div className="not-prose mb-10 rounded-xl overflow-hidden aspect-[1200/630]">
            <Image
              src={post.image}
              alt={post.imageAlt ?? post.title}
              width={1200}
              height={630}
              className="w-full h-full object-cover"
              priority
              unoptimized
            />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      <div className="max-w-3xl mx-auto px-6 pb-16 not-prose">
        <div className="border rounded-xl p-6 bg-muted/40">
          <p className="font-semibold mb-1">¿Quieres organizar mejor tu negocio?</p>
          <p className="text-sm text-muted-foreground mb-4">
            MITIKUS es el hub de productividad para profesionales, pymes y equipos. Gestiona clientes,
            documentos, facturas y contratos desde un único lugar.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Empieza gratis →
          </Link>
        </div>
      </div>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MITIKUS.{' '}
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
        </div>
      </footer>
    </main>
  )
}
