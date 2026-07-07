# ADR-004: DevOps & Deployment Architecture — SP-ARCH-004

**Status:** Accepted (DEPLOY-1/DEPLOY-2) | RFC Pending (DEPLOY-3)
**Date:** 2026-06-29
**Context:** CTO DevOps Audit — SUPERPROMPT SP-ARCH-004 v1

---

## Context

Auditoría completa de infraestructura, despliegue y operaciones antes de la beta privada. El sistema tiene Production Readiness Score 86/100 (SP-ARCH-002) y Performance Score 80/100 (SP-ARCH-003). Este ciclo cierra los gaps operacionales.

---

## Hallazgos y decisiones

### H-01 + MW-01 — Endpoint /api/health

**Problema:** No existía ningún endpoint de health/readiness. Los plataformas de deploy (Vercel, Railway) no podían verificar si la aplicación estaba viva. Clerk bloqueaba cualquier request no autenticado a `/api/*`.

**Solución:**
- Creado `apps/web/src/app/api/health/route.ts` con tres checks: DB ping (SELECT 1 con latencia), AI config (presencia de ANTHROPIC_API_KEY), Auth config (presencia de ambas claves Clerk).
- Añadida `/api/health` a `isPublicRoute` en `middleware.ts` — sin esto, Clerk redirigiría a sign-in.
- Responde 200 si todo ok, 503 si algún check falla.

**Contrato de respuesta:**
```json
{
  "status": "ok" | "degraded",
  "version": "0.5.5",
  "checks": {
    "database": { "ok": true, "latencyMs": 12 },
    "ai": { "ok": true },
    "auth": { "ok": true }
  },
  "timestamp": "..."
}
```

---

### SEC-01 — Security headers HTTP

**Problema:** `next.config.ts` no configuraba ningún header de seguridad HTTP. El navegador no recibía instrucciones sobre clickjacking, MIME sniffing ni referrer policy.

**Solución:** Añadidos 5 headers en `next.config.ts` vía `async headers()`:

| Header | Valor | Protege contra |
|--------|-------|----------------|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing |
| `X-DNS-Prefetch-Control` | `on` | Sin impacto de seguridad, mejora rendimiento |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Filtración de URL en referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Acceso a hardware y APIs sensibles |

**CSP omitido deliberadamente:** Next.js 15 + Clerk requieren `'unsafe-inline'` para scripts de hidratación y la UI de Clerk. Implementar CSP correctamente requiere nonces por request. Documentado como deuda para post-beta.

**HSTS omitido deliberadamente:** Debe configurarse a nivel de proxy/CDN (Vercel lo gestiona), no en la app. Configurar HSTS en la app puede causar problemas si la app se sirve también por HTTP en local/staging.

---

### CI-01 + CI-02 — GitHub Actions CI y .nvmrc

**Problema:** Sin automatización de CI. Cualquier PR podía mergear con errores TypeScript o de lint. Sin versión de Node fijada, el entorno de CI podía divergir del de desarrollo.

**Solución:**
- Creado `.nvmrc` con Node 20 (LTS actual)
- Creado `.github/workflows/ci.yml` con tres jobs:
  - `type-check`: `npm run type-check` en cada push/PR
  - `lint`: `npm run lint` en cada push/PR
  - `build`: `npm run build` solo en pushes a `main`/`develop` (no en PRs — demasiado lento para el feedback loop)
- Prisma generate usa `DATABASE_URL` placeholder para el type-check (solo necesita el schema, no la BD)
- `concurrency` configurado para cancelar runs en progreso cuando llega un push más nuevo

---

### VCL-01 — vercel.json para Turborepo

**Problema:** Sin `vercel.json`, Vercel no sabía que el proyecto Next.js estaba en `apps/web/`. Cada deploy requería configuración manual en el dashboard.

**Solución:** Creado `vercel.json` en la raíz con:
- `rootDirectory: "apps/web"` — apunta a la app Next.js
- `buildCommand`: sube al monorepo y ejecuta `npm run build` desde la raíz (Turbo cache)
- `installCommand`: instala desde la raíz (necesario para workspace packages)
- `ignoreCommand`: skip deploy si no hay cambios en `apps/web/` ni `packages/` (ahorra minutos de build)
- `regions: ["mad1"]` — región Madrid para minimizar latencia con usuarios europeos

**Nota:** Los timeouts por función (`maxDuration`) no se configuran en `vercel.json` sino con `export const maxDuration = N` en cada route file. El workflow execute ya tiene `maxDuration = 300`.

---

### ENV-01 / ENV-02 — .env.example (BLOQUEADO POR HOOK)

**Problema:** El archivo `.env.example` tiene `ANTHROPIC_API_KEY` duplicada (línea 21 y 30), `NODE_ENV="development"` que es peligroso si se copia a producción, y no documenta: `CLERK_JWT_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `MAX_AI_OUTPUT_TOKENS`, `MAX_AI_RETRIES`.

**Impedimento:** `block-secrets.sh` hook clasifica `.env.example` como fichero sensible y rechaza toda escritura.

**Acciones manuales pendientes** — aplicar en el próximo acceso manual:

```diff
# =============================================================
# ProTools Hub — Variables de entorno
# Copia este archivo como .env.local y rellena los valores
# NUNCA subas .env.local al repositorio
# =============================================================

# PostgreSQL
- DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
+ DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&connection_limit=5"

# Clerk — https://dashboard.clerk.com
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
  CLERK_SECRET_KEY="sk_test_..."
  CLERK_WEBHOOK_SECRET="whsec_..."
+ CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Clerk rutas (no cambiar)
  NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
  NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

- # Claude API — https://console.anthropic.com
- ANTHROPIC_API_KEY="sk-ant-..."
-
- # App
- NEXT_PUBLIC_APP_URL="http://localhost:3002"
- NODE_ENV="development"
-
-
- # ── Anthropic — IA de generación de herramientas ─────────────────────────────
- # Obtén tu clave en: https://console.anthropic.com → API Keys
- ANTHROPIC_API_KEY=

+ # ── IA — Providers ────────────────────────────────────────────────────────────
+ ANTHROPIC_API_KEY="sk-ant-..."   # Obligatorio — https://console.anthropic.com
+ OPENAI_API_KEY=""                # Opcional — habilita GPT-4o y gpt-4o-mini
+ GEMINI_API_KEY=""                # Opcional — habilita Gemini 2.0 Flash
+
+ # App
+ NEXT_PUBLIC_APP_URL="http://localhost:3002"
+ # NODE_ENV lo gestiona Next.js automáticamente — no establecer en .env.local

  # ── Límites de generación IA por día ──────────────────────────────────────────
  MAX_AI_GENERATIONS_PER_USER_DAY=10
  MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=20
  MAX_AI_GENERATIONS_GLOBAL_DAY=50
  MAX_AI_ESTIMATED_COST_DAY_EUR=2

+ # ── Límites de tokens y tamaño ────────────────────────────────────────────────
+ MAX_AI_OUTPUT_TOKENS=2500
+ MAX_AI_RETRIES=1
  MAX_AI_PROMPT_LENGTH=2000
  MAX_AI_SCHEMA_BYTES=50000
```

---

### DB-01 — Migración baseline (acción manual pendiente)

**Problema:** El proyecto usa `prisma db push` (válido en desarrollo, destructivo en producción). No existe `prisma/migrations/`. Sin migraciones, los cambios de schema en producción son peligrosos.

**Decisión:** Mantener `db push` para desarrollo local. Antes del primer deploy a producción, crear la migración baseline:

```bash
cd apps/web
npx prisma migrate dev --name init
git add prisma/migrations/
git commit -m "db: init migration baseline"
```

En producción, el build command de Vercel debe incluir:
```
cd ../.. && npx prisma migrate deploy --schema=./apps/web/prisma/schema.prisma && npm run build
```

---

## Hallazgos aceptados sin implementar (DEPLOY-3 — RFC)

### DOCKER-01 — Dockerfile + docker-compose

**Por qué no ahora:** Vercel gestiona el deployment sin Docker. Añadir Docker aumenta la superficie de mantenimiento sin beneficio inmediato. Útil cuando se necesite self-hosting o CI con Docker.

**Propuesta futura:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone .
EXPOSE 3002
CMD ["node", "apps/web/server.js"]
```

Requiere `output: 'standalone'` en `next.config.ts`.

### MON-01 — Logger estructurado (pino) + Sentry

**Por qué no ahora:** `console.error` es suficiente para beta privada — Vercel captura stdout/stderr. Sentry añade complejidad de configuración y coste. Implementar en post-beta cuando se tengan usuarios reales y necesidad de alertas.

### BACKUP-01 — Backup automatizado

**Por qué no ahora:** Railway Starter incluye snapshots diarios automáticos. Para beta privada es suficiente. Automatización con scripts `pg_dump` + S3 para 100+ usuarios.

---

## DevOps Readiness Score (post-auditoría)

| Área | Score | Notas |
|------|-------|-------|
| CI/CD | 75/100 | CI automático en GitHub Actions; deploy manual en Vercel |
| Health & Observabilidad | 80/100 | /api/health creado; sin Sentry aún |
| Seguridad HTTP | 80/100 | 5 headers; sin CSP (pendiente post-beta) |
| Configuración de entorno | 65/100 | .env.example pendiente de corrección manual |
| Base de datos | 60/100 | Sin migración baseline; usando db push |
| Deploy config | 85/100 | vercel.json listo; Railway manual |
| Documentación operacional | 90/100 | Deployment Handbook creado |
| Backups | 50/100 | Railway snapshots; sin automatización propia |
| Monitorización | 40/100 | Solo /api/health; sin uptime monitoring, Sentry ni alertas |

**Score global: 70/100**

---

## Recomendación

### ¿Está listo para beta privada?

**Sí, con condiciones mínimas.**

**Condiciones antes del primer deploy:**
1. Aplicar corrección manual de `.env.example` (ENV-01/ENV-02) — 10 min
2. Crear migración baseline: `npx prisma migrate dev --name init` — 5 min
3. Configurar todas las variables obligatorias en Vercel Dashboard
4. Configurar webhook de Clerk en producción
5. Verificar `/api/health` responde 200 tras el primer deploy

### ¿Qué falta para producción pública (post-beta)?

1. **CSP headers** — Requiere nonces en Next.js + Clerk
2. **Logger estructurado (pino)** — Para observabilidad real
3. **Error tracking (Sentry)** — Alertas en tiempo real
4. **PgBouncer** — Para >100 usuarios concurrentes
5. **Backup automatizado** — Script pg_dump + S3 programado
6. **Rate limiting en middleware** — Para rutas no-IA
7. **Migración a `prisma migrate deploy`** en build de Vercel

### Siguiente ciclo recomendado (SP-ARCH-005)

Tras 30 días de beta privada, cuando se tengan datos reales de uso:
- SP-ARCH-005: Observabilidad & Error Tracking (Sentry, pino, alertas)
- SP-ARCH-006: Escalado (PgBouncer, PERF-3 workflow paralelo, CSP)
