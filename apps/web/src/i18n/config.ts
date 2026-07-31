export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ro', 'sv', 'da', 'no', 'hu', 'cs', 'sk', 'el', 'fi', 'hr', 'bg', 'sl', 'ja', 'zh'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'
export const FALLBACK_LOCALE: Locale = 'es'

/** Cookie que persiste la preferencia del usuario (1 año) */
export const LOCALE_COOKIE = 'protools-locale'

/** Cookie que indica que el banner ya fue descartado */
export const BANNER_DISMISSED_COOKIE = 'protools-locale-banner-dismissed'

/** Header inyectado por el middleware — locale resuelto final */
export const LOCALE_HEADER = 'x-protools-locale'

/** Header inyectado por el middleware — locale sugerido por Accept-Language/país */
export const SUGGESTED_LOCALE_HEADER = 'x-protools-suggested-locale'

// Países cuyo idioma principal es español (ISO 3166-1 alpha-2)
export const SPANISH_SPEAKING_COUNTRIES = new Set([
  'ES', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ',
])

export function isValidLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function sanitizeLocale(value: unknown): Locale {
  return isValidLocale(value) ? value : FALLBACK_LOCALE
}

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string; nativeLabel: string }> = {
  en: { label: 'English',  flag: '🇺🇸', nativeLabel: 'English' },
  es: { label: 'Spanish',  flag: '🇪🇸', nativeLabel: 'Español' },
  fr: { label: 'French',   flag: '🇫🇷', nativeLabel: 'Français' },
  de: { label: 'German',      flag: '🇩🇪', nativeLabel: 'Deutsch'   },
  pt: { label: 'Portuguese', flag: '🇵🇹', nativeLabel: 'Português' },
  it: { label: 'Italian',    flag: '🇮🇹', nativeLabel: 'Italiano'  },
  nl: { label: 'Dutch',      flag: '🇳🇱', nativeLabel: 'Nederlands' },
  pl: { label: 'Polish',     flag: '🇵🇱', nativeLabel: 'Polski'     },
  ro: { label: 'Romanian',   flag: '🇷🇴', nativeLabel: 'Română'     },
  sv: { label: 'Swedish',    flag: '🇸🇪', nativeLabel: 'Svenska'    },
  da: { label: 'Danish',     flag: '🇩🇰', nativeLabel: 'Dansk'      },
  no: { label: 'Norwegian',  flag: '🇳🇴', nativeLabel: 'Norsk'      },
  hu: { label: 'Hungarian',  flag: '🇭🇺', nativeLabel: 'Magyar'     },
  cs: { label: 'Czech',      flag: '🇨🇿', nativeLabel: 'Čeština'    },
  sk: { label: 'Slovak',     flag: '🇸🇰', nativeLabel: 'Slovenčina' },
  el: { label: 'Greek',      flag: '🇬🇷', nativeLabel: 'Ελληνικά'  },
  fi: { label: 'Finnish',   flag: '🇫🇮', nativeLabel: 'Suomi'      },
  hr: { label: 'Croatian',  flag: '🇭🇷', nativeLabel: 'Hrvatski'   },
  bg: { label: 'Bulgarian', flag: '🇧🇬', nativeLabel: 'Български'  },
  sl: { label: 'Slovenian', flag: '🇸🇮', nativeLabel: 'Slovenščina' },
  ja: { label: 'Japanese',  flag: '🇯🇵', nativeLabel: '日本語'      },
  zh: { label: 'Chinese',   flag: '🇨🇳', nativeLabel: '中文'        },
}
