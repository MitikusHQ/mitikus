import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers, cookies } from 'next/headers'
import { ClerkProvider } from '@clerk/nextjs'
import { getLocale } from '@/i18n/locale'
import { sanitizeLocale, SUGGESTED_LOCALE_HEADER } from '@/i18n/config'
import { LocaleProvider } from '@/i18n/locale-context'
import { LocaleBanner } from './(dashboard)/_components/LocaleBanner'
import { CookieBanner } from './_components/CookieBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MITIKUS',
  description: 'El sistema operativo de tu empresa.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const headersList = await headers()
  const rawSuggested = headersList.get(SUGGESTED_LOCALE_HEADER)
  const cookieStore = await cookies()
  const hasConsentCookie = !!cookieStore.get('mitikus-cookie-consent')
  const suggestedLocale = rawSuggested ? sanitizeLocale(rawSuggested) : null

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang={locale} suppressHydrationWarning>
        {/* Anti-FOUC: sets dark class before React hydrates */}
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('protools-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
            }}
          />
        </head>
        <body className={inter.className} suppressHydrationWarning>
          <div role="status" aria-label="Estado de la aplicación" className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-center text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 tracking-wide shadow-sm">
            <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
              Beta
            </span>
            Acceso limitado · Estamos en fase de pruebas con usuarios seleccionados
          </div>
          <LocaleProvider locale={locale}>
            {suggestedLocale && (
              <LocaleBanner suggestedLocale={suggestedLocale} currentLocale={locale} />
            )}
            {children}
          </LocaleProvider>
          <CookieBanner initialShow={!hasConsentCookie} />
        </body>
      </html>
    </ClerkProvider>
  )
}
