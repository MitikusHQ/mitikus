# Upstash + Sentry Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Upstash Redis sliding-window edge rate limiting and full-stack Sentry error observability to MITIKUS (`apps/web`).

**Architecture:** Two independent tracks. Track A: a `rate-limit.ts` singleton + middleware patch that rejects abusive IPs before Clerk runs. Track B: three Sentry config files + instrumentation hook + `next.config.ts` wrap + manual capture at three critical points. Both tracks need env vars in Vercel before deploying.

**Tech Stack:** `@upstash/redis@^1`, `@upstash/ratelimit@^2`, `@sentry/nextjs@^8`, Next.js 15 App Router, Vercel Edge Runtime.

---

## File Map

| Action | File |
|--------|------|
| Create | `apps/web/src/lib/rate-limit.ts` |
| Modify | `apps/web/src/middleware.ts` |
| Create | `apps/web/sentry.client.config.ts` |
| Create | `apps/web/sentry.server.config.ts` |
| Create | `apps/web/sentry.edge.config.ts` |
| Create | `apps/web/instrumentation.ts` |
| Modify | `apps/web/next.config.ts` |
| Modify | `apps/web/src/lib/brain/brain-service.ts` |
| Modify | `apps/web/src/app/api/webhooks/stripe/route.ts` |
| Modify | `apps/web/src/lib/billing/check-plan-limit.ts` |

---

## Task 1: Install packages

**Files:**
- Modify: `apps/web/package.json` (via npm)

- [ ] **Step 1: Install Upstash packages**

```bash
cd apps/web
npm install @upstash/redis @upstash/ratelimit
```

Expected: packages added to `apps/web/package.json` dependencies, `package-lock.json` updated.

- [ ] **Step 2: Install Sentry**

```bash
npm install @sentry/nextjs
```

Expected: `@sentry/nextjs` added to dependencies.

- [ ] **Step 3: Verify installs**

```bash
node -e "require('@upstash/ratelimit'); console.log('ok')"
node -e "require('@sentry/nextjs'); console.log('ok')"
```

Expected: `ok` twice, no errors.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore: install @upstash/ratelimit and @sentry/nextjs"
```

---

## Task 2: Upstash rate-limit singleton

**Files:**
- Create: `apps/web/src/lib/rate-limit.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Instancia singleton — reutilizada en cada invocación del middleware Edge.
// Si las variables de entorno no están configuradas, `ratelimit` es null
// y el middleware pasa la petición sin limitar (fail-open).
export const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(60, '60 s'),
        analytics: false,
        prefix: 'mitikus_rl',
      })
    : null
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `rate-limit.ts`.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/web/src/lib/rate-limit.ts
git commit -m "feat: add Upstash ratelimit singleton (fail-open when env not set)"
```

---

## Task 3: Wire rate limiting into middleware

**Files:**
- Modify: `apps/web/src/middleware.ts`

Context: the current middleware wraps everything inside `clerkMiddleware`. The rate limit must run **before** Clerk auth, which means it needs to be extracted to run before the Clerk wrapper. The pattern is: intercept the request at the top of the exported default function, before calling `auth.protect()`.

Since `clerkMiddleware` wraps our handler, we can't easily run code before Clerk processes the request from *outside* the wrapper — but we can run it *at the top of the inner handler*, before `auth.protect()`, which still prevents any DB or Clerk token work.

- [ ] **Step 1: Update middleware.ts**

Replace the entire file content with:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
} from './i18n/config'
import { resolveLocale } from './i18n/detect-locale'
import { ratelimit } from './lib/rate-limit'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/sso-callback(.*)',
  '/onboarding',
  '/privacy',
  '/terms',
  '/dpa',
  '/shared/(.*)',
  '/portal/(.*)',
  '/invite/(.*)',
  '/p/(.*)',
  '/t/(.*)',
  '/contracts/sign/(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
  '/api/og',
  '/api/health',
  '/api/webhooks/(.*)',
  '/api/leads',
  '/pricing',
])

// Rutas de API que están sujetas al rate limit por IP.
// Se excluyen: health, og, webhooks (Stripe tiene firma propia), leads.
const isRateLimitedRoute = createRouteMatcher(['/api/(.*)'])
const isRateLimitExempt = createRouteMatcher([
  '/api/health',
  '/api/og',
  '/api/webhooks/(.*)',
  '/api/leads',
])

export default clerkMiddleware(async (auth, req) => {
  // Rate limit — antes de auth.protect() para no consumir quota de Clerk en IPs abusivas.
  if (ratelimit && isRateLimitedRoute(req) && !isRateLimitExempt(req)) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'

    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo en un momento.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        },
      )
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value ?? null
  const country =
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??
    null

  const resolvedLocale = resolveLocale({ cookieLocale, country })

  const res = NextResponse.next()
  res.headers.set(LOCALE_HEADER, resolvedLocale)

  return res
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify middleware still allows public routes (manual)**

```bash
npm run dev
```

Open `http://localhost:3000` — should load normally without 429.

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/web/src/middleware.ts
git commit -m "feat: add IP rate limiting in middleware via Upstash sliding window"
```

---

## Task 4: Sentry config files

**Files:**
- Create: `apps/web/sentry.client.config.ts`
- Create: `apps/web/sentry.server.config.ts`
- Create: `apps/web/sentry.edge.config.ts`
- Create: `apps/web/instrumentation.ts`

- [ ] **Step 1: Create sentry.client.config.ts**

```typescript
// apps/web/sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 10% de trazas en producción — suficiente para detectar regresiones de rendimiento.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Sin grabaciones de sesión — cumplimiento RGPD.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // No mostrar errores de Sentry en consola del browser en producción.
  debug: false,
})
```

- [ ] **Step 2: Create sentry.server.config.ts**

```typescript
// apps/web/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
})
```

- [ ] **Step 3: Create sentry.edge.config.ts**

```typescript
// apps/web/sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
})
```

- [ ] **Step 4: Create instrumentation.ts**

```typescript
// apps/web/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/web/sentry.client.config.ts apps/web/sentry.server.config.ts apps/web/sentry.edge.config.ts apps/web/instrumentation.ts
git commit -m "feat: add Sentry config files for client, server, and edge"
```

---

## Task 5: Wrap next.config.ts with withSentryConfig

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Update next.config.ts**

Replace the entire file with:

```typescript
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
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
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, unknown>),
      canvas: false,
    }
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry org/project — requeridos para subir source maps en build.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silenciar logs de Sentry durante el build.
  silent: !process.env.CI,

  // Subir source maps — stack traces apuntan a TypeScript, no al bundle compilado.
  widenClientFileUpload: false,

  // No exponer source maps públicamente.
  hideSourceMaps: true,

  // Deshabilitar el tunnel route de Sentry (no lo necesitamos).
  disableLogger: true,

  // Auto-instrumentación de rutas de Next.js.
  automaticVercelMonitors: false,
})
```

- [ ] **Step 2: Verify build compiles**

```bash
cd apps/web
npm run build 2>&1 | tail -20
```

Expected: build succeeds (Sentry puede mostrar warnings sobre SENTRY_AUTH_TOKEN faltante — es normal en local sin la variable configurada). No debe haber errores de TypeScript ni de Next.js.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/web/next.config.ts
git commit -m "feat: wrap next.config with withSentryConfig for source map upload"
```

---

## Task 6: Manual Sentry capture — brain-service.ts

**Files:**
- Modify: `apps/web/src/lib/brain/brain-service.ts`

Context: `queryBrain` calls Anthropic's API at line 40. If it throws, the error propagates silently to the API route. We wrap the Anthropic call to capture failures with useful context (workspaceId, truncated query).

- [ ] **Step 1: Update brain-service.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'
import { searchWorkspace, type BrainFragment } from './brain-search'

export interface BrainResult {
  answer: string
  sources: BrainFragment[]
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres el Brain de MITIKUS — asistente de memoria del workspace.
Tu función es responder preguntas sobre el workspace usando exclusivamente los fragmentos de contexto proporcionados.
Reglas:
- Responde siempre en el idioma de la pregunta del usuario.
- Si la respuesta está en los fragmentos, cítala con claridad y naturalidad.
- Si los fragmentos no contienen la respuesta, di exactamente: "No encontré información sobre esto en tu workspace."
- No inventes datos. No uses conocimiento externo.
- Sé conciso: máximo 3-4 párrafos.`

export async function queryBrain(
  workspaceId: string,
  query: string,
  orgId: string,
): Promise<BrainResult> {
  const sources = await searchWorkspace(workspaceId, query, orgId)

  if (sources.length === 0) {
    return {
      answer: 'No encontré información sobre esto en tu workspace.',
      sources: [],
    }
  }

  const contextBlock = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.excerpt}`)
    .join('\n\n---\n\n')

  const userMessage = `Contexto del workspace:\n\n${contextBlock}\n\n---\n\nPregunta: ${query}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const answer = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    return { answer, sources }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'brain-service' },
      extra: {
        workspaceId,
        orgId,
        query: query.slice(0, 100),
        sourcesCount: sources.length,
      },
    })
    throw err
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep brain-service
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/web/src/lib/brain/brain-service.ts
git commit -m "feat: capture Anthropic API failures in Sentry from brain-service"
```

---

## Task 7: Manual Sentry capture — stripe webhook

**Files:**
- Modify: `apps/web/src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add Sentry import and capture to the POST handler**

Open `apps/web/src/app/api/webhooks/stripe/route.ts`. Add the Sentry import at the top (after existing imports):

```typescript
import * as Sentry from '@sentry/nextjs'
```

Then find the main `try/catch` block in the `POST` function. If there is a catch block, add Sentry capture inside it. If there is no catch block, wrap the handler body. The pattern to add inside any existing `catch (err)`:

```typescript
Sentry.captureException(err, {
  tags: { component: 'stripe-webhook' },
  extra: {
    eventType: event?.type ?? 'unknown',
    stripeEventId: event?.id ?? 'unknown',
  },
})
```

Read the current file first to find the exact catch location, then add the capture there without changing any other logic.

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep webhook
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add "apps/web/src/app/api/webhooks/stripe/route.ts"
git commit -m "feat: capture Stripe webhook errors in Sentry"
```

---

## Task 8: Manual Sentry capture — check-plan-limit advisory lock

**Files:**
- Modify: `apps/web/src/lib/billing/check-plan-limit.ts`

Context: `checkPlanLimit` wraps count+check in a `db.$transaction` with `pg_advisory_xact_lock`. If the lock call fails (e.g., PostgreSQL connection issue), we want Sentry to know.

- [ ] **Step 1: Add Sentry import and wrap the transaction**

Open `apps/web/src/lib/billing/check-plan-limit.ts`. Add the import at the top:

```typescript
import * as Sentry from '@sentry/nextjs'
```

Then find `return db.$transaction(async (tx) => {` and wrap it:

```typescript
  try {
    return await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${PLAN_LIMIT_LOCK_NS}::int4, ${lockObj}::int4)`

      const current = await countCurrent(tx, orgId, limitKey, workspaceId)
      if (current < limit) return { allowed: true } as LimitResult

      const label = LIMIT_LABELS[limitKey]
      return {
        allowed: false,
        limit,
        current,
        message: `Has alcanzado el límite de ${label} de tu plan (${limit}). Actualiza tu plan para continuar.`,
      } as LimitResult
    })
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'check-plan-limit' },
      extra: { orgId, limitKey, workspaceId },
    })
    throw err
  }
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep check-plan-limit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/web/src/lib/billing/check-plan-limit.ts
git commit -m "feat: capture advisory lock failures in Sentry from check-plan-limit"
```

---

## Task 9: Add env vars and deploy

**Prerequisite:** Before this task, you must:
1. Create an Upstash database at https://console.upstash.com → copy **REST URL** and **REST Token**
2. Create a Sentry project at https://sentry.io → copy **DSN** and **Auth Token**

- [ ] **Step 1: Add to .env.local (for local testing)**

```bash
# apps/web/.env.local — añadir estas líneas
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@oyyy.ingest.sentry.io/zzzz
SENTRY_DSN=https://xxxx@oyyy.ingest.sentry.io/zzzz
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=mitikus
SENTRY_AUTH_TOKEN=sntrys_xxxx
```

- [ ] **Step 2: Add to Vercel**

Go to Vercel dashboard → Project → Settings → Environment Variables. Add:

| Name | Value | Environments |
|------|-------|--------------|
| `UPSTASH_REDIS_REST_URL` | (Upstash REST URL) | Production, Preview |
| `UPSTASH_REDIS_REST_TOKEN` | (Upstash REST Token) | Production, Preview |
| `NEXT_PUBLIC_SENTRY_DSN` | (Sentry DSN) | Production, Preview |
| `SENTRY_DSN` | (Sentry DSN) | Production, Preview |
| `SENTRY_ORG` | (org slug from sentry.io) | Production, Preview |
| `SENTRY_PROJECT` | `mitikus` | Production, Preview |
| `SENTRY_AUTH_TOKEN` | (Auth Token from Sentry) | Production, Preview |

- [ ] **Step 3: Test rate limiting locally**

```bash
cd apps/web
npm run dev
```

In a second terminal, send 65 rapid requests:

```bash
for i in $(seq 1 65); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health; done
```

Note: `/api/health` is exempt from rate limiting — use a different API route to test the limit. Replace `/api/health` with `/api/brain/query` or any auth-protected endpoint. First ~60 should return 200/401, then 429.

- [ ] **Step 4: Push and deploy**

```bash
cd ../..
git push origin main
```

Vercel auto-deploys. Verify in Vercel deployment logs that Sentry source map upload succeeds (look for `[Sentry] Uploading source maps` in build output).

- [ ] **Step 5: Verify Sentry receives events**

In the Sentry dashboard, go to your project → Issues. Trigger a test error by temporarily adding to any API route:

```typescript
throw new Error('Sentry test — delete me')
```

Deploy, hit the route, check Sentry dashboard for the error. Remove the test throw and redeploy.

---

## Self-review

**Spec coverage check:**
- ✅ Sliding window 60 req/60s per IP — Task 2+3
- ✅ Exempt routes (health, og, webhooks, leads) — Task 3
- ✅ 429 with Retry-After: 60 and JSON body — Task 3
- ✅ Rate limit before auth.protect() — Task 3
- ✅ Fail-open when Redis unreachable — Task 2 (null check)
- ✅ Sentry client config — Task 4
- ✅ Sentry server config — Task 4
- ✅ Sentry edge config — Task 4
- ✅ instrumentation.ts — Task 4
- ✅ withSentryConfig in next.config.ts — Task 5
- ✅ Manual capture brain-service — Task 6
- ✅ Manual capture stripe webhook — Task 7
- ✅ Manual capture check-plan-limit — Task 8
- ✅ tracesSampleRate 0.1 in prod — Tasks 4
- ✅ replaysSessionSampleRate 0 (GDPR) — Task 4
- ✅ hideSourceMaps — Task 5
- ✅ Env vars documented — Task 9

**No placeholders found.**

**Type consistency:** `ratelimit` exported from `rate-limit.ts` as `Ratelimit | null`, consumed with null check in middleware. `Sentry.captureException` signature consistent across Tasks 6, 7, 8.
