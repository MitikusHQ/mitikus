/**
 * Runtime environment validation.
 * Import this module early (e.g. in db.ts, stripe-provider.ts) so missing
 * vars surface immediately at startup rather than in the middle of a request.
 *
 * Variables marked OPTIONAL won't crash the server but log a warning.
 */

const REQUIRED = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CRON_SECRET',
] as const

const OPTIONAL = [
  'ANTHROPIC_API_KEY',        // Brain / AI features
  'UPSTASH_REDIS_REST_URL',   // Rate limiting
  'UPSTASH_REDIS_REST_TOKEN', // Rate limiting
  'SENTRY_DSN',               // Error monitoring
  'RESEND_API_KEY',           // Transactional email
  'MITIKUS_ENCRYPTION_KEY',   // SMTP/IMAP password encryption
] as const

function validateEnv() {
  if (process.env.NODE_ENV === 'test') return

  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `[MITIKUS] Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n` +
      'Set them in your .env file or Vercel project settings.',
    )
  }

  const missingOptional = OPTIONAL.filter((key) => !process.env[key])
  if (missingOptional.length > 0) {
    console.warn(
      `[MITIKUS] Optional env vars not set (some features will be disabled):\n` +
      missingOptional.map((k) => `  - ${k}`).join('\n'),
    )
  }
}

// Run once on module load
validateEnv()

export const env = {
  DATABASE_URL:                        process.env.DATABASE_URL!,
  CLERK_SECRET_KEY:                    process.env.CLERK_SECRET_KEY!,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:   process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  STRIPE_SECRET_KEY:                   process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET:               process.env.STRIPE_WEBHOOK_SECRET!,
  CRON_SECRET:                         process.env.CRON_SECRET!,

  ANTHROPIC_API_KEY:        process.env.ANTHROPIC_API_KEY,
  UPSTASH_REDIS_REST_URL:   process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  SENTRY_DSN:               process.env.SENTRY_DSN,
  RESEND_API_KEY:           process.env.RESEND_API_KEY,
  MITIKUS_ENCRYPTION_KEY:   process.env.MITIKUS_ENCRYPTION_KEY,
} as const
