import { requireUser } from '@/lib/auth'
import Link from 'next/link'

interface Props {
  params: Promise<{ workspaceId: string }>
}

const TOOLS = [
  {
    href:     (base: string) => `${base}/docs`,
    emoji:    '📄',
    title:    'Documentos',
    subtitle: 'Base de conocimiento del workspace',
  },
  {
    href:     (base: string) => `${base}/sheets`,
    emoji:    '📊',
    title:    'Hojas de cálculo',
    subtitle: 'Datos, presupuestos y análisis',
  },
  {
    href:     (base: string) => `${base}/pdfs`,
    emoji:    '📑',
    title:    'PDFs',
    subtitle: 'Visor, búsqueda y conversión a Doc',
  },
  {
    href:     (base: string) => `${base}/contracts`,
    emoji:    '📝',
    title:    'Contratos',
    subtitle: 'Firma y gestiona contratos con clientes',
  },
  {
    href:     (base: string) => `${base}/presentations`,
    emoji:    '🎯',
    title:    'Presentaciones',
    subtitle: 'Crea y gestiona presentaciones del workspace',
  },
] as const

export default async function MyOfficePage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const base = `/workspace/${workspaceId}`

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mi Office</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tus herramientas de documento
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href(base)}
            className="flex flex-col gap-3 rounded-lg border p-5 hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <span className="text-3xl">{tool.emoji}</span>
            <div>
              <p className="text-sm font-medium">{tool.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.subtitle}</p>
            </div>
            <span className="text-xs text-primary font-medium">BUILT-IN</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
