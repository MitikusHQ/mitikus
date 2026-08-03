import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { cookies } from 'next/headers'
import { getLocale } from '@/i18n/locale'
import { LOCALE_COOKIE } from '@/i18n/config'
import { LocaleProvider } from '@/i18n/locale-context'
import { LocalePickerModal } from './(dashboard)/_components/LocalePickerModal'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mitikus.com'),
  title: {
    default: 'MITIKUS — Tu negocio, all in one!',
    template: '%s · MITIKUS',
  },
  description:
    'El hub de productividad para profesionales, pymes y equipos. Gestiona clientes, documentos, facturas, contratos y tu equipo desde un único lugar.',
  openGraph: {
    title: 'MITIKUS — Tu negocio, all in one!',
    description:
      'El hub de productividad para profesionales, pymes y equipos. Gestiona clientes, documentos, facturas, contratos y tu equipo desde un único lugar.',
    url: 'https://www.mitikus.com',
    siteName: 'MITIKUS',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MITIKUS — Tu negocio, all in one!',
    description:
      'El hub de productividad para profesionales, pymes y equipos. Gestiona clientes, documentos, facturas, contratos y tu equipo desde un único lugar.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const cookieStore = await cookies()
  const hasLocaleCookie = !!cookieStore.get(LOCALE_COOKIE)?.value

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
              Acceso anticipado
            </span>
            Plazas limitadas · Únete ahora y bloquea tu precio de lanzamiento
          </div>
          <LocaleProvider locale={locale}>
            {!hasLocaleCookie && <LocalePickerModal currentLocale={locale} />}
            {children}
          </LocaleProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
