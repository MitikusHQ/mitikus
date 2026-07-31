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
  {
    href:     (base: string) => `${base}/notebooks`,
    emoji:    '🧠',
    title:    'Notebooks',
    subtitle: 'Sintetiza y consulta documentos con IA',
  },
] as const

const FINANCIAL_TOOLS = [
  {
    href:     (base: string) => `${base}/invoices`,
    emoji:    '🧾',
    title:    'Facturas',
    subtitle: 'Crea y gestiona facturas para clientes con PDF descargable',
  },
  {
    href:     (base: string) => `${base}/receipts`,
    emoji:    '📷',
    title:    'Escáner de gastos',
    subtitle: 'Escanea tickets y facturas con IA para registrar gastos',
  },
] as const

const FISCAL_TOOLS = [
  {
    href:     (base: string) => `${base}/fiscal`,
    emoji:    '🗓️',
    title:    'Calendario Fiscal',
    subtitle: 'Obligaciones trimestrales y anuales para tu empresa',
    badge:    'España 2025',
  },
  {
    href:     (base: string) => `${base}/fiscal/303`,
    emoji:    '🧮',
    title:    'Modelo 303 — IVA',
    subtitle: 'Calcula tu declaración trimestral de IVA',
    badge:    'Calculadora',
  },
  {
    href:     (base: string) => `${base}/fiscal/130`,
    emoji:    '💰',
    title:    'Modelo 130 — IRPF',
    subtitle: 'Pago fraccionado trimestral para autónomos',
    badge:    'Calculadora',
  },
  {
    href:     (base: string) => `${base}/fiscal/111`,
    emoji:    '👥',
    title:    'Modelo 111 — Retenciones',
    subtitle: 'Retenciones IRPF sobre trabajadores y profesionales',
    badge:    'Calculadora',
  },
  {
    href:     (base: string) => `${base}/fiscal/115`,
    emoji:    '🏢',
    title:    'Modelo 115 — Alquileres',
    subtitle: 'Retenciones sobre arrendamientos de inmuebles',
    badge:    'Calculadora',
  },
  {
    href:     (base: string) => `${base}/fiscal/resumen`,
    emoji:    '📋',
    title:    'Resumen para gestor',
    subtitle: 'Genera un resumen trimestral para tu asesor fiscal',
    badge:    'PDF / Imprimir',
  },
  {
    href:     (base: string) => `${base}/fiscal/390`,
    emoji:    '📊',
    title:    'Modelo 390 — IVA anual',
    subtitle: 'Resumen anual de las cuatro declaraciones de IVA',
    badge:    'Anual',
  },
  {
    href:     (base: string) => `${base}/fiscal/190`,
    emoji:    '🗂️',
    title:    'Modelo 190 — Retenciones anual',
    subtitle: 'Resumen anual de retenciones practicadas',
    badge:    'Anual',
  },
  {
    href:     (base: string) => `${base}/fiscal/100`,
    emoji:    '🧾',
    title:    'Modelo 100 — Renta',
    subtitle: 'IRPF anual para autónomos en estimación directa',
    badge:    'Anual',
  },
  {
    href:     (base: string) => `${base}/fiscal/200`,
    emoji:    '🏛️',
    title:    'Modelo 200 — Sociedades',
    subtitle: 'Impuesto sobre Sociedades para SL / SA',
    badge:    'Anual',
  },
] as const

export default async function MyOfficePage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const base = `/workspace/${workspaceId}`

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Mi Office</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tus herramientas de documento
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos</h2>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Facturación y gastos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FINANCIAL_TOOLS.map((tool) => (
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
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fiscal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FISCAL_TOOLS.map((tool) => (
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
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{tool.badge}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
