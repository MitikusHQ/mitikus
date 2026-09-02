import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// Security headers aplicados a todas las rutas.
// La CSP se limita a frame-ancestors para evitar clickjacking sin interferir
// con Clerk/Next.js, que requieren scripts inline durante la hidratación.
const securityHeaders = [
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy',  value: "frame-ancestors 'none'" },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
]

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  transpilePackages: ['@protools/schema', '@protools/ui', '@protools/import-engine'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  typedRoutes: false,
  serverExternalPackages: ['pdf-parse'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  webpack: (config) => {
    // @react-pdf/renderer requires this alias to work in Next.js
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, unknown>),
      canvas: false,
    }

    // @protools/import-engine usa module: "NodeNext" y extensiones .js en imports TypeScript.
    // Webpack no resuelve .js → .ts automáticamente, así que lo habilitamos aquí.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }

    return config
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: false,
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: false,
})
