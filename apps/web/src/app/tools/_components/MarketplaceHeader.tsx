import Link from 'next/link'

interface StatCard {
  value: string | number
  label: string
  icon: string
}

interface Props {
  totalTools: number
  totalCategories: number
  officialCount: number
  backHref?: string
}

function Stat({ value, label, icon }: StatCard) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function MarketplaceHeader({ totalTools, totalCategories, officialCount, backHref }: Props) {
  return (
    <header className="border-b bg-card">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        {backHref && (
          <div className="mb-4">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Volver al workspace
            </Link>
          </div>
        )}

        {/* Title block */}
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                Marketplace
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Catálogo de herramientas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalTools} herramientas disponibles en {totalCategories} categorías
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat value={totalTools} label="Herramientas" icon="📦" />
          <Stat value={totalCategories} label="Categorías" icon="🗂️" />
          <Stat
            value={officialCount === totalTools ? 'Todas' : officialCount}
            label="Oficiales"
            icon="✓"
          />
        </div>
      </div>
    </header>
  )
}
