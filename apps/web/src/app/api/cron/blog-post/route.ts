import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const TOPICS = [
  'Cómo organizar los contratos de tu negocio sin perder ninguno',
  'Por qué los freelances necesitan un sistema de gestión de clientes',
  'Gestión del tiempo para consultores: técnicas que funcionan de verdad',
  'Cómo digitalizar tu despacho jurídico en 30 días',
  'Facturación electrónica en España: todo lo que debes saber en 2026',
  'Checklist para incorporar a un nuevo cliente en tu agencia',
  'Cómo hacer seguimiento de proyectos sin perder la cabeza',
  'Gestión documental para pymes: de los papeles al cloud',
  'Por qué tus propuestas comerciales están fallando y cómo mejorarlas',
  'Automatiza tus recordatorios de pago y cobra antes',
  'Cómo estructurar tu equipo de ventas con herramientas digitales',
  'El error más común al gestionar el equipo en startups de crecimiento rápido',
  'Onboarding de clientes: el proceso que más impacta en la retención',
  'Métricas clave que toda agencia creativa debería medir',
  'Cómo preparar tu negocio para la facturación Verifactu en 2026',
  'Gestión de tareas en equipo: qué herramientas funcionan y cuáles no',
  'Cómo crear un sistema de objetivos trimestrales para tu empresa',
  'La diferencia entre un CRM y un hub de productividad',
  'Organización de archivos digitales para despachos profesionales',
  'Cómo reducir el tiempo de aprobación de documentos en tu empresa',
  'Flujo de trabajo para gestionar proyectos de consultoría',
  'Qué es la firma digital y por qué deberías usarla ya',
  'Cómo gestionar múltiples clientes sin caer en el caos',
  'Productividad para abogados: herramientas y hábitos que marcan la diferencia',
  'Cómo medir la rentabilidad por cliente en tu consultoría',
  'La guía definitiva para gestionar propuestas y presupuestos',
  'Cómo automatizar el seguimiento de proyectos con IA',
  'Gestión de equipos remotos: lo que aprendimos de los últimos años',
  'Por qué el email no es suficiente para gestionar clientes',
  'Cómo preparar informes de avance que tus clientes realmente lean',
  'Gestión fiscal para autónomos: calendario y obligaciones 2026',
  'Herramientas de colaboración que mejoran la productividad del equipo',
  'Cómo organizar una base de conocimiento para tu empresa',
  'El papel del Brain IA en la productividad moderna',
  'Cómo crear plantillas de documentos que ahoran horas cada semana',
  'Checklist de cierre de proyecto: no olvides ningún paso',
  'Cómo gestionar proveedores y subcontratistas con eficiencia',
  'La importancia del archivo documental en empresas de servicios',
  'Cómo mejorar la comunicación interna en equipos pequeños',
  'Automatización de procesos en pymes: por dónde empezar',
  'Cómo transformar reuniones de equipo en decisiones reales',
  'Gestión de contratos de larga duración: buenas prácticas',
  'Por qué la trazabilidad documental es clave para tu negocio',
  'Cómo escalar tu agencia sin perder el control',
  'Checklist mensual para la salud financiera de tu negocio',
  'Cómo digitalizar los procesos de tu consultoría paso a paso',
  'La guía del emprendedor para gestionar clientes en la nube',
  'Cómo delegar efectivamente en un equipo pequeño',
  'Productividad con IA: casos de uso reales para pymes',
  'Cómo construir un sistema de gestión que escale con tu empresa',
  'Errores comunes en la gestión de proyectos de consultoría',
  'Cómo sacar partido a las integraciones digitales en tu flujo de trabajo',
]

function pickTopic(date: Date): string {
  const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))
  const dayOfWeek = date.getDay()
  const offset = dayOfWeek === 1 ? 0 : 1
  const index = (weekNumber * 2 + offset) % TOPICS.length
  return TOPICS[index] ?? TOPICS[0]!
}

function buildSlug(title: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0]
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${dateStr}-${slug}`
}

async function commitToGitHub(slug: string, content: string, lang = 'es'): Promise<void> {
  const owner = process.env.GITHUB_BLOG_OWNER!
  const repo = process.env.GITHUB_BLOG_REPO!
  const token = process.env.GITHUB_BLOG_TOKEN!
  const path = `blog/${lang}/${slug}.mdx`

  const encoded = Buffer.from(content, 'utf-8').toString('base64')

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `blog: publish ${slug}`,
      content: encoded,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub API error ${res.status}: ${body}`)
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const githubToken = process.env.GITHUB_BLOG_TOKEN
  const owner = process.env.GITHUB_BLOG_OWNER
  const repo = process.env.GITHUB_BLOG_REPO

  if (!anthropicKey || !githubToken || !owner || !repo) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const now = new Date()
  const topic = pickTopic(now)
  const publishedAt = now.toISOString().split('T')[0]

  const client = new Anthropic({ apiKey: anthropicKey })

  const systemPrompt = `Eres el editor de contenidos de MITIKUS, un hub de productividad español para profesionales, pymes y equipos.
Tu misión: escribir artículos de blog útiles, directos y en castellano de España.

MITIKUS ofrece: gestión de clientes, documentos, facturas, contratos con firma digital, tareas, fichajes, workflows y un Brain IA.

Reglas de escritura:
- Castellano de España (vosotros, no ustedes; usar "despacho" no "oficina" cuando aplique).
- Tono profesional pero cercano, sin jerga innecesaria.
- Sin relleno. Sin frases de cortesía vacías.
- Cada afirmación debe ser accionable o aportar valor real.
- Menciona MITIKUS de forma natural 1-2 veces si viene al caso, nunca de forma forzada.`

  // Pedir a Claude 3 keywords distintas para hero, imagen 1 e imagen 2
  const keywordsPrompt = `Para el tema "${topic}", dame exactamente 3 búsquedas en inglés separadas por "|" para encontrar fotos de stock profesionales relevantes. Cada búsqueda debe ser 2-3 palabras descriptivas distintas entre sí y muy relacionadas con el tema. Formato: keyword1|keyword2|keyword3. Solo eso, nada más.`
  const kwMessage = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 40,
    messages: [{ role: 'user', content: keywordsPrompt }],
  })
  const kwText = (kwMessage.content[0] as { type: 'text'; text: string }).text.trim()
  const [kwHero = 'business productivity', kwA = 'office work', kwB = 'team collaboration'] = kwText.split('|').map(k => k.trim())

  async function fetchPexelsUrl(query: string, width: number, height: number): Promise<string> {
    const pexelsKey = process.env.PEXELS_API_KEY
    if (!pexelsKey) return `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/${width}/${height}`
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
        headers: { Authorization: pexelsKey },
      })
      if (!res.ok) throw new Error('Pexels error')
      const data = await res.json() as { photos: Array<{ src: { large2x: string; large: string } }> }
      const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 3))]
      return photo?.src?.large2x ?? photo?.src?.large ?? `https://picsum.photos/${width}/${height}`
    } catch {
      return `https://picsum.photos/${width}/${height}`
    }
  }

  const [imageUrl, inlineImg1, inlineImg2] = await Promise.all([
    fetchPexelsUrl(kwHero, 1200, 630),
    fetchPexelsUrl(kwA, 800, 400),
    fetchPexelsUrl(kwB, 800, 400),
  ])

  const userPrompt = `Escribe un artículo de blog completo sobre: "${topic}"

Formato de salida — SIGUE EXACTAMENTE ESTA ESTRUCTURA:

publishedAt: ${publishedAt}
image: ${imageUrl}
imageAlt: ${topic}

# [Título del artículo]

> [Resumen de 1-2 frases que enganche al lector]

## [Introducción: el problema o contexto]

[2-3 párrafos que enganchen]

![Imagen relacionada con la introducción](${inlineImg1})

## [Sección principal 1]

[Contenido útil y accionable]

## [Sección principal 2]

[Contenido útil y accionable]

![Imagen relacionada con los consejos](${inlineImg2})

## [Sección principal 3 o consejos prácticos]

[Lista o párrafos con consejos concretos]

## Conclusión

[Cierre con llamada a la acción discreta hacia MITIKUS]

El artículo debe tener entre 600 y 900 palabras. Sin comentarios meta, sin explicaciones fuera del artículo.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const mdxContent = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const titleMatch = mdxContent.match(/^# (.+)$/m)
  const title = titleMatch?.[1] ?? topic
  const slug = buildSlug(title, now)

  await commitToGitHub(slug, mdxContent, 'es')

  // Traducir al inglés con Haiku
  const translationMessage = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Translate the following Spanish blog article MDX to English. Keep the exact same MDX structure, frontmatter fields (publishedAt, image, imageAlt), markdown headings, image tags, and formatting. Only translate the text content. Do not add any explanation.\n\n${mdxContent}`,
    }],
  })

  const enContent = translationMessage.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  await commitToGitHub(slug, enContent, 'en')

  return NextResponse.json({ ok: true, slug, topic, langs: ['es', 'en'] })
}
