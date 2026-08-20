# Upstash + Sentry Integration Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add edge-level IP rate limiting via Upstash Redis and full-stack error observability via Sentry to MITIKUS (`apps/web`).

**Architecture:** Two independent systems installed in parallel. Upstash Redis adds a sliding-window rate limiter in Next.js middleware (before Clerk auth) to protect all API routes from abuse. Sentry captures unhandled errors automatically across client, server, and edge, with manual capture at critical points (Anthropic calls, Stripe webhooks, advisory lock failures).

**Tech Stack:** `@upstash/redis`, `@upstash/ratelimit`, `@sentry/nextjs`, Next.js 15 App Router, Vercel Edge Runtime.

---

## 1. Upstash Redis — Edge Rate Limiting

### Configuration

- **Algorithm:** Sliding window
- **Limit:** 60 requests / 60 seconds per IP
- **Identifier:** `x-forwarded-for` header → first IP in list (Vercel sets this)
- **Fallback:** if Redis is unreachable, allow the request (fail open) — better than blocking all traffic on Redis downtime

### Protected routes

All `/api/*` routes EXCEPT:
- `/api/health` — health checks (monitoring tools)
- `/api/og` — OG image generation (public, cacheable)
- `/api/webhooks/*` — Stripe webhooks use their own signature validation; rate limiting by IP would block Stripe's IPs

### Response on limit exceeded

```
HTTP 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{ "error": "Demasiadas solicitudes. Inténtalo en un momento." }
```

### Middleware placement

Rate limit check runs **before** `auth.protect()` in `middleware.ts`. Abusive IPs are rejected without consuming Clerk quota or touching the database.

### Environment variables

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

Both must be added to Vercel environment (production + preview).

### Files modified/created

- `apps/web/src/middleware.ts` — add rate limit check at the top
- `apps/web/src/lib/rate-limit.ts` — create Ratelimit instance (singleton)

---

## 2. Sentry — Full-Stack Error Observability

### Scope

| Layer | Coverage |
|-------|----------|
| Client (browser) | Unhandled JS errors, React error boundaries, failed fetches |
| Server (Node.js) | API route errors, unhandled promise rejections |
| Edge (middleware) | Middleware errors |

Session replays: **disabled** (`replaysSessionSampleRate: 0`) — GDPR compliance, no user session recording.

Performance tracing: `tracesSampleRate: 0.1` in production (10% of requests sampled).

### Manual capture points

| File | What is captured |
|------|-----------------|
| `apps/web/src/lib/brain/brain-service.ts` | Anthropic API failures — with `workspaceId` and truncated query (max 100 chars) as context |
| `apps/web/src/app/api/webhooks/stripe/route.ts` | Stripe webhook processing errors — with event type and subscription ID |
| `apps/web/src/lib/billing/check-plan-limit.ts` | Advisory lock failures — with `orgId` and `limitKey` |

### Config files

| File | Purpose |
|------|---------|
| `apps/web/sentry.client.config.ts` | Browser SDK init |
| `apps/web/sentry.server.config.ts` | Node.js SDK init |
| `apps/web/sentry.edge.config.ts` | Edge runtime SDK init |
| `apps/web/instrumentation.ts` | Next.js instrumentation hook — loads server/edge Sentry on startup |
| `apps/web/next.config.ts` | Wrap with `withSentryConfig()` for source map upload |

### Environment variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client + Server | DSN from Sentry project |
| `SENTRY_DSN` | Server only | Same DSN (fallback for server-side) |
| `SENTRY_ORG` | Build time | Sentry org slug (for source maps) |
| `SENTRY_PROJECT` | Build time | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Build time | Auth token for source map upload |

All must be added to Vercel environment. `SENTRY_AUTH_TOKEN` only needed in CI/build, not at runtime.

### Source maps

Source maps are uploaded to Sentry during `next build` via `withSentryConfig`. Stack traces in the Sentry dashboard will point to the original TypeScript source, not the compiled bundle.

Source maps are **not** served publicly (Sentry config: `widenClientFileUpload: false`, `hideSourceMaps: true`).

---

## 3. What is NOT in scope

- Replacing PostgreSQL plan limit counters with Redis (kept as-is — advisory locks already handle concurrency)
- Rate limiting individual endpoints differently (single global limiter is enough for now)
- Sentry user feedback widget
- Sentry performance monitoring dashboards (tracing enabled but not configured beyond defaults)
- Upstash for caching (separate concern)

---

## 4. Deployment order

1. Create Upstash database at console.upstash.com → copy REST URL + token
2. Create Sentry project at sentry.io → copy DSN + auth token
3. Add all env vars to Vercel (production + preview environments)
4. Deploy — both systems activate on first request with no DB migration needed
