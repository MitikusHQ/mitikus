export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { BlogLangToggle } from '../_components/BlogLangToggle'

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

async function getPost(slug: string, lang = 'es'): Promise<PostData | null> {
  const paths = [`blog/${lang}/${slug}.mdx`, `blog/${slug}.mdx`]
  for (const path of paths) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_BLOG_OWNER}/${process.env.GITHUB_BLOG_REPO}/contents/${path}`,
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
    // try next path
  }
  }
  return null
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

function stripFrontmatter(raw: string): string {
  // Remove YAML fenced frontmatter (---...---)
  const fenced = raw.replace(/^---[\s\S]*?---\n?/, '')
  if (fenced !== raw) return fenced
  // Remove loose frontmatter: skip leading lines that are "key: value" or blank, stop at first #
  const lines = raw.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (/^[A-Za-z][\w]*:[ \t]/.test(line) || line.trim() === '') {
      i++
    } else {
      break
    }
  }
  return lines.slice(i).join('\n')
}

function mdxToHtml(raw: string): string {
  return stripFrontmatter(raw)
    .replace(/^# .+$/m, '')
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '\n\n<img src="$2" alt="$1" style="display:block;width:100%;border-radius:0.5rem;margin:1.5rem 0" loading="lazy" />\n\n')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hbuaocli])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<(?:h[1-6]|ul|img)[^>]*\/?>)/g, '$1')
    .replace(/(<\/(?:h[1-6]|ul)>)<\/p>/g, '$1')
}

const t = {
  es: {
    back: '← Blog',
    startFree: 'Empieza gratis →',
    ctaTitle: '¿Quieres organizar mejor tu negocio?',
    ctaBody: 'MITIKUS es el hub de productividad para profesionales, pymes y equipos. Gestiona clientes, documentos, facturas y contratos desde un único lugar.',
    privacy: 'Privacidad',
  },
  en: {
    back: '← Blog',
    startFree: 'Start free →',
    ctaTitle: 'Want to organize your business better?',
    ctaBody: 'MITIKUS is the productivity hub for professionals, SMEs and teams. Manage clients, documents, invoices and contracts from one place.',
    privacy: 'Privacy',
  },
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const hdrs = await headers()
  const locale = hdrs.get('x-protools-locale') ?? 'es'
  const lang = locale === 'en' ? 'en' : 'es'
  const tx = t[lang]
  const post = await getPost(slug, lang)
  if (!post) notFound()

  const html = mdxToHtml(post.content)

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg width="32" height="32" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="alg" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD040"/>
                  <stop offset="28%" stopColor="#FF7028"/>
                  <stop offset="50%" stopColor="#FF2878"/>
                  <stop offset="72%" stopColor="#8B28FF"/>
                  <stop offset="100%" stopColor="#1820B8"/>
                </linearGradient>
                <clipPath id="alc"><circle cx="100" cy="100" r="87"/></clipPath>
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#alg)" strokeWidth="5.5"/>
              <g clipPath="url(#alc)">
                <polygon points="-10,0   192,95  192,100 -10,98" fill="url(#alg)"/>
                <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#alg)"/>
              </g>
            </svg>
            <span className="font-bold tracking-widest text-sm" style={{ background: 'linear-gradient(100deg,#FFD040,#FF7028,#FF2878,#8B28FF,#1820B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              MITIKUS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <BlogLangToggle lang={lang} />
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {tx.back}
            </Link>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-14">
        {post.publishedAt && (
          <time className="text-xs text-muted-foreground block mb-4">{post.publishedAt}</time>
        )}
        <h1 className="text-3xl font-bold leading-tight mb-6">{post.title}</h1>
        {post.image && (
          <div className="mb-10 rounded-xl overflow-hidden aspect-[1200/630]">
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
        <div
          className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      <div className="max-w-3xl mx-auto px-6 pb-16 not-prose">
        <div className="border rounded-xl p-6 bg-muted/40">
          <p className="font-semibold mb-1">{tx.ctaTitle}</p>
          <p className="text-sm text-muted-foreground mb-4">{tx.ctaBody}</p>
          <Link
            href="/sign-up"
            className="inline-block bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            {tx.startFree}
          </Link>
        </div>
      </div>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MITIKUS.{' '}
          <Link href="/privacy" className="hover:text-foreground transition-colors">{tx.privacy}</Link>
        </div>
      </footer>
    </main>
  )
}
