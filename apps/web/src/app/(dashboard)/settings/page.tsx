import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { getLocale } from '@/i18n/locale'
import Link from 'next/link'
import { LocaleSelector } from './_components/LocaleSelector'
import { BillingPortalButton } from './_components/BillingPortalButton'
import { getEntitlements } from '@/lib/billing/entitlements'

const TIER_LABEL: Record<string, string> = {
  AUTONOMO: 'Autónomo', STARTER: 'Starter', PROFESSIONAL: 'Professional',
  BUSINESS: 'Business', ENTERPRISE: 'Enterprise',
}
const STATUS_LABEL: Record<string, string> = {
  TRIALING: 'Periodo de prueba', ACTIVE: 'Activa', PAST_DUE: 'Pago pendiente',
  CANCELLED: 'Cancelada', EXPIRED: 'Expirada', BLOCKED: 'Bloqueada',
}
const STATUS_COLOR: Record<string, string> = {
  TRIALING: 'text-amber-600', ACTIVE: 'text-emerald-600', PAST_DUE: 'text-orange-600',
  CANCELLED: 'text-muted-foreground', EXPIRED: 'text-muted-foreground', BLOCKED: 'text-destructive',
}

export default async function SettingsPage() {
  const user = await requireUser()
  const [locale, entitlements] = await Promise.all([getLocale(), getEntitlements(user.orgId)])
  const workspaceId = user.org?.workspaces?.[0]?.id

  const sections = [
    {
      href: '/settings/team',
      title: 'Equipo',
      description: 'Gestiona los miembros de tu organización e invita nuevos colaboradores.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      visible: can(user, 'manage_members'),
    },
    {
      href: '/settings/categories',
      title: 'Categorías',
      description: 'Activa o desactiva los tipos de herramientas disponibles en tu organización.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      visible: user.role === 'OWNER',
    },
  ].filter((s) => s.visible)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {workspaceId && (
        <Link href={`/workspace/${workspaceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Mi espacio
        </Link>
      )}
      <div>
        <h1 className="text-xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configura tu organización y equipo.</p>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-start gap-4 rounded-xl border bg-card p-5 hover:bg-muted/30 transition-colors group"
          >
            <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
              {s.icon}
            </div>
            <div>
              <div className="font-medium text-sm">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
            </div>
            <svg
              className="ml-auto mt-0.5 w-4 h-4 text-muted-foreground/50 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}

        {sections.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">No tienes acceso a ninguna sección de ajustes.</p>
          </div>
        )}
      </div>

      {/* Sección suscripción */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 shrink-0 text-muted-foreground">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Suscripción</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold">{TIER_LABEL[entitlements.tier] ?? entitlements.tier}</span>
              <span className={`text-xs ${STATUS_COLOR[entitlements.status] ?? 'text-muted-foreground'}`}>
                · {STATUS_LABEL[entitlements.status] ?? entitlements.status}
              </span>
            </div>
            {entitlements.isTrial && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Periodo de prueba activo. Activa un plan para continuar cuando termine.
              </p>
            )}
          </div>
        </div>
        <BillingPortalButton />
        <p className="text-xs text-muted-foreground">
          Aquí puedes cambiar de plan, actualizar tu método de pago, cancelar la suscripción y descargar tus facturas de Stripe.
        </p>
      </div>

      {/* Idioma */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 shrink-0 text-muted-foreground">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-sm">Language</div>
            <div className="text-xs text-muted-foreground mt-0.5">Choose the language used throughout MITIKUS.</div>
          </div>
        </div>
        <LocaleSelector currentLocale={locale} />
      </div>
    </div>
  )
}
