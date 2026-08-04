import { requireUser } from '@/lib/auth'
import Link from 'next/link'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function MyOfficePage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const base = `/workspace/${workspaceId}`

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Mi Office</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tus herramientas de documento y gestión
        </p>
      </div>

      {/* ── Documentos — uso frecuente, tarjetas grandes ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: `${base}/docs`,          emoji: '📄', title: 'Documentos',       subtitle: 'Redacta y edita con IA' },
            { href: `${base}/contracts`,     emoji: '✍️', title: 'Contratos',        subtitle: 'Firma electrónica' },
            { href: `${base}/invoices`,      emoji: '🧾', title: 'Facturas',         subtitle: 'PDF descargable' },
            { href: `${base}/sheets`,        emoji: '📊', title: 'Hojas de cálculo', subtitle: 'Datos y presupuestos' },
            { href: `${base}/pdfs`,          emoji: '📑', title: 'PDFs',             subtitle: 'Visor y búsqueda' },
            { href: `${base}/presentations`, emoji: '🖥️', title: 'Presentaciones',   subtitle: 'Crea y comparte' },
            { href: `${base}/notebooks`,     emoji: '🧠', title: 'Notebooks',        subtitle: 'Sintetiza con IA' },
            { href: `${base}/receipts`,      emoji: '📷', title: 'Gastos',           subtitle: 'OCR por cámara' },
            { href: `${base}/office/files`, emoji: '🗂️', title: 'Archivos',          subtitle: 'Carpetas y ficheros' },
          ].map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="flex flex-col gap-2 rounded-xl border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <span className="text-2xl">{tool.emoji}</span>
              <div>
                <p className="text-sm font-medium leading-tight">{tool.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tool.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Fiscal — lista compacta agrupada ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fiscal (España)</h2>
          <Link href={`${base}/fiscal`} className="text-xs text-primary hover:underline">
            Ver calendario →
          </Link>
        </div>

        <div className="rounded-xl border bg-card divide-y">
          {/* Trimestral */}
          <div className="px-4 py-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Trimestral</p>
            <div className="space-y-1">
              {[
                { href: `${base}/fiscal/303`, emoji: '🧮', title: 'Modelo 303', subtitle: 'IVA trimestral' },
                { href: `${base}/fiscal/130`, emoji: '💰', title: 'Modelo 130', subtitle: 'IRPF fraccionado (autónomos)' },
                { href: `${base}/fiscal/111`, emoji: '👥', title: 'Modelo 111', subtitle: 'Retenciones IRPF' },
                { href: `${base}/fiscal/115`, emoji: '🏢', title: 'Modelo 115', subtitle: 'Retenciones alquileres' },
                { href: `${base}/fiscal/resumen`, emoji: '📋', title: 'Resumen gestor', subtitle: 'Exporta para tu asesor' },
              ].map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span className="text-base w-5 text-center shrink-0">{m.emoji}</span>
                  <span className="text-sm font-medium">{m.title}</span>
                  <span className="text-xs text-muted-foreground ml-1">{m.subtitle}</span>
                  <svg className="ml-auto w-3.5 h-3.5 text-muted-foreground/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Anual */}
          <div className="px-4 py-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Anual</p>
            <div className="space-y-1">
              {[
                { href: `${base}/fiscal/390`, emoji: '📊', title: 'Modelo 390', subtitle: 'IVA resumen anual' },
                { href: `${base}/fiscal/190`, emoji: '🗂️', title: 'Modelo 190', subtitle: 'Retenciones resumen anual' },
                { href: `${base}/fiscal/100`, emoji: '🧾', title: 'Modelo 100', subtitle: 'Renta (IRPF autónomos)' },
                { href: `${base}/fiscal/200`, emoji: '🏛️', title: 'Modelo 200', subtitle: 'Impuesto sobre Sociedades' },
              ].map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span className="text-base w-5 text-center shrink-0">{m.emoji}</span>
                  <span className="text-sm font-medium">{m.title}</span>
                  <span className="text-xs text-muted-foreground ml-1">{m.subtitle}</span>
                  <svg className="ml-auto w-3.5 h-3.5 text-muted-foreground/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
