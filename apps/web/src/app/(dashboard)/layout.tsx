import { DesktopLicenseSync } from './_components/DesktopLicenseSync'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const t = getDashboardTranslations(locale)
  return (
    <div className="grid h-dvh min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background">
      <DesktopLicenseSync />
      <div role="status" aria-label="app status" className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-center text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 tracking-wide shadow-sm">
        <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
          {t.bannerEarlyAccess}
        </span>
        {t.bannerCta}
      </div>
      <div className="min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
