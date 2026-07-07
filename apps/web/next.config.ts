import type { NextConfig } from 'next'

// Security headers aplicados a todas las rutas.
// Nota: HSTS se configura a nivel de proxy/CDN (Vercel/Railway lo gestiona).
// Nota: CSP se omite aquí — Clerk y Next.js requieren nonces inline; implementar en fase post-beta.
const securityHeaders = [
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig: NextConfig = {
  transpilePackages: ['@protools/schema', '@protools/ui', '@protools/import-engine'],
  typedRoutes: false,

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

export default nextConfig
