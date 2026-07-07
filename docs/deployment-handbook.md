# ProTools Hub — Deployment Handbook

**Versión:** 1.0  
**Fecha:** 2026-06-29  
**Audiencia:** DevOps, Platform Engineer, cualquier persona que despliega el proyecto

---

## 1. Arquitectura recomendada (beta privada)

```
Internet → Vercel (Next.js) → Railway (PostgreSQL 16)
                ↑
           Clerk (Auth SaaS)
           Anthropic API (IA)
```

**Filosofía:** Mínima infraestructura propia. Todo managed. Tiempo de setup < 30 min.

---

## 2. Infraestructura recomendada por fase

### Beta privada (0–100 usuarios)

| Componente | Servicio | Tier | Coste estimado/mes |
|-----------|---------|------|-------------------|
| Next.js app | Vercel | Pro ($20/mes) | $20 |
| PostgreSQL 16 | Railway | Starter ($5/mes) | $5–15 |
| Autenticación | Clerk | Free (hasta 10k MAU) | $0 |
| IA (Anthropic) | Anthropic API | Pay per use | $2–20 |
| CDN / SSL | Vercel (incluido) | — | $0 |
| DNS | Cloudflare | Free | $0 |
| **Total estimado** | | | **$25–55/mes** |

### 100 usuarios activos

| Componente | Servicio | Tier | Coste estimado/mes |
|-----------|---------|------|-------------------|
| Next.js app | Vercel | Pro | $20 + bandwidth |
| PostgreSQL 16 | Railway | Standard | $20–40 |
| Autenticación | Clerk | Free | $0 |
| IA | Anthropic API | Pay per use | $30–100 |
| **Total estimado** | | | **$70–160/mes** |

### 1.000 usuarios activos

| Componente | Servicio | Tier | Coste estimado/mes |
|-----------|---------|------|-------------------|
| Next.js app | Vercel | Pro + DPS | $50–150 |
| PostgreSQL 16 | Railway Dedicated o Neon | Pro | $50–100 |
| Auth | Clerk | Pro ($25/mes) | $25 |
| IA | Anthropic API | Pay per use | $200–500 |
| Connection pooling | PgBouncer (Railway addon) | $10/mes | $10 |
| **Total estimado** | | | **$335–785/mes** |

---

## 3. Prerequisitos

```
Node.js 20+    (ver .nvmrc en raíz)
npm 10+
PostgreSQL 16+ (local o remoto)
Cuenta Clerk
Clave API Anthropic
Cuenta Vercel (para deploy en la nube)
Cuenta Railway (para BD en la nube)
```

---

## 4. Variables de entorno

### Variables obligatorias

| Variable | Descripción | Ejemplo |
|---------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (server-side) | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | Secret para verificar webhooks de Clerk | `whsec_...` |
| `CLERK_JWT_KEY` | Clave JWT de Clerk para verificación server-side | `-----BEGIN PUBLIC KEY-----...` |
| `ANTHROPIC_API_KEY` | Clave de API de Anthropic | `sk-ant-...` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `https://app.protools-hub.com` |

### Variables opcionales (con defaults seguros)

| Variable | Default | Descripción |
|---------|---------|-------------|
| `OPENAI_API_KEY` | — | Habilita GPT-4o y gpt-4o-mini |
| `GEMINI_API_KEY` | — | Habilita Gemini 2.0 Flash |
| `MAX_AI_GENERATIONS_PER_USER_DAY` | `10` | Límite diario por usuario |
| `MAX_AI_GENERATIONS_PER_WORKSPACE_DAY` | `20` | Límite diario por workspace |
| `MAX_AI_GENERATIONS_GLOBAL_DAY` | `50` | Techo global del sistema |
| `MAX_AI_ESTIMATED_COST_DAY_EUR` | `2.0` | Coste máximo diario en EUR |
| `MAX_AI_OUTPUT_TOKENS` | `2500` | Máximo tokens de salida por petición |
| `MAX_AI_RETRIES` | `1` | Intentos en caso de error de proveedor IA |
| `MAX_AI_PROMPT_LENGTH` | `2000` | Caracteres máximos del prompt de usuario |
| `MAX_AI_SCHEMA_BYTES` | `50000` | Bytes máximos del schema generado |

### Variables que NUNCA deben aparecer en el cliente

- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `CLERK_JWT_KEY`
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`

Todas las anteriores son server-only. Verificar que ninguna tiene prefijo `NEXT_PUBLIC_`.

---

## 5. Configuración de base de datos

### 5.1. Setup local

```bash
# Crear BD local
createdb protools_hub_dev

# Configurar .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/protools_hub_dev?schema=public"

# Aplicar schema (primera vez o reset)
cd apps/web
npx prisma db push

# Sembrar catálogo oficial
npm run db:seed -w apps/web
```

### 5.2. Inicializar migraciones (OBLIGATORIO antes del primer deploy a producción)

El proyecto actualmente usa `db push` (válido en desarrollo). Para producción, se necesita
el workflow de migraciones que es seguro e incremental:

```bash
# Solo una vez: crear la migración baseline desde el schema actual
cd apps/web
npx prisma migrate dev --name init

# Esto crea prisma/migrations/YYYYMMDDHHMMSS_init/
# Hacer commit del directorio migrations/
git add prisma/migrations/
git commit -m "init: add prisma migration baseline"
```

### 5.3. Aplicar migraciones en producción

```bash
# En el entorno de producción (con DATABASE_URL apuntando a prod):
npx prisma migrate deploy

# NUNCA usar `prisma db push` en producción — es destructivo
```

### 5.4. DATABASE_URL para entornos serverless (Vercel)

En Vercel/serverless, añadir estos parámetros para evitar agotamiento de conexiones:

```
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=5&pool_timeout=20"
```

Para Railway con PgBouncer (cuando superas 100 usuarios):

```
DATABASE_URL="postgresql://user:pass@proxy.railway.app:5432/db?schema=public&pgbouncer=true&connection_limit=1"
```

---

## 6. Deploy en Vercel

### 6.1. Primera vez

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la raíz del monorepo
vercel

# Vercel auto-detecta vercel.json con rootDirectory: "apps/web"
```

### 6.2. Configurar variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables, añadir TODAS las
variables obligatorias de la sección 4. Marcar las sensibles como "Sensitive".

### 6.3. Configurar Clerk para producción

1. En Clerk Dashboard → crear nueva aplicación de producción
2. Cambiar `pk_test_...` → `pk_live_...` y `sk_test_...` → `sk_live_...`
3. Añadir el dominio de Vercel en Clerk → Allowed Origins
4. Configurar el webhook de Clerk:
   - URL: `https://tu-app.vercel.app/api/webhooks/clerk`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
   - Copiar el `CLERK_WEBHOOK_SECRET` al env de Vercel

### 6.4. Deploy continuo

Vercel auto-despliega en cada push a `main`. El CI de GitHub Actions valida
antes del merge, pero Vercel hace su propio build como verificación adicional.

---

## 7. Deploy en Railway (alternativa full self-hosted)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway new

# Añadir PostgreSQL
railway add --plugin postgresql

# Desplegar
railway up
```

Railway auto-detecta Next.js y ejecuta `next build` + `next start`.

---

## 8. Checklists de despliegue

### 8.1. Checklist Local (desarrollo)

- [ ] Node 20+ instalado (`node --version`)
- [ ] npm 10+ instalado (`npm --version`)
- [ ] PostgreSQL 16 corriendo localmente
- [ ] `.env.local` creado desde `.env.example` con todos los valores reales
- [ ] `DATABASE_URL` apunta a BD local
- [ ] Claves Clerk de test (pk_test_..., sk_test_...)
- [ ] `ANTHROPIC_API_KEY` válida
- [ ] `npm install` ejecutado desde la raíz
- [ ] `npx prisma db push` ejecutado en `apps/web/`
- [ ] `npm run db:seed -w apps/web` ejecutado (catálogo oficial)
- [ ] `npm run dev` arranca sin errores en http://localhost:3002
- [ ] `GET http://localhost:3002/api/health` devuelve `{ status: 'ok' }`
- [ ] `npm run type-check` pasa con 0 errores

### 8.2. Checklist Staging

- [ ] BD de staging aislada de producción
- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio de staging
- [ ] Clerk: aplicación de staging separada (o mode test)
- [ ] Webhook de Clerk configurado para la URL de staging
- [ ] `npx prisma migrate deploy` ejecutado contra la BD de staging
- [ ] `npm run db:seed` ejecutado en staging (catálogo oficial)
- [ ] `/api/health` devuelve 200 en staging
- [ ] Flujo completo de registro → onboarding → creación de herramienta verificado manualmente

### 8.3. Checklist Producción (primer deploy)

**Infraestructura:**
- [ ] Dominio configurado y con SSL (Vercel/Cloudflare)
- [ ] BD de producción creada (Railway/Neon)
- [ ] `DATABASE_URL` de producción configurada con `connection_limit`
- [ ] Variables de entorno configuradas en Vercel (ALL obligatorias)
- [ ] Claves Clerk de producción (`pk_live_...`, `sk_live_...`)
- [ ] `CLERK_WEBHOOK_SECRET` configurado

**Base de datos:**
- [ ] `npx prisma migrate deploy` ejecutado (NUNCA `db push` en prod)
- [ ] `npm run db:seed` ejecutado para el catálogo oficial
- [ ] Backup manual tomado antes del primer deploy

**Verificación:**
- [ ] Build exitoso en Vercel (sin errores TypeScript)
- [ ] `/api/health` responde `{ status: 'ok' }` en producción
- [ ] Registro de nuevo usuario funciona end-to-end
- [ ] Webhook de Clerk entrega eventos (verificar en Clerk Dashboard → Webhooks → Logs)
- [ ] Ejecución de herramienta con IA funciona
- [ ] Rate limiting funciona (probar excediendo el límite)
- [ ] UI de analytics carga datos correctamente

**Rollback:**
- [ ] Plan de rollback documentado: si el deploy falla, hacer `npx prisma migrate resolve --rolled-back <migration_name>` y re-desplegar la versión anterior

---

## 9. Proceso de actualización (deploys subsiguientes)

```bash
# 1. Merge a main (GitHub Actions CI valida primero)
# 2. Vercel auto-deploya
# 3. Si hay cambios de schema:
npx prisma migrate dev --name <descripcion>
git add prisma/migrations/
git commit -m "db: add migration <descripcion>"
# 4. En producción, Vercel ejecuta prisma migrate deploy automáticamente
#    si se configura en el build command:
#    "npx prisma migrate deploy && next build"
```

### Configurar migrate deploy en Vercel build command

En Vercel → Settings → Build & Development Settings:
```
Build Command: cd ../.. && npx prisma migrate deploy --schema=./apps/web/prisma/schema.prisma && npm run build
```

O en `package.json` de apps/web, añadir un script `build:prod`:
```json
"build:prod": "prisma migrate deploy && next build"
```

---

## 10. Backups

### Estrategia recomendada para beta privada

Railway incluye backups automáticos diarios en el tier Standard+.

Para backup manual bajo demanda:
```bash
# Exportar BD completa
pg_dump $DATABASE_URL --no-acl --no-owner -F c -f backup-$(date +%Y%m%d).dump

# Restaurar
pg_restore --no-acl --no-owner -d $DATABASE_URL backup-YYYYMMDD.dump
```

### Frecuencia recomendada

| Fase | Frecuencia | Retención |
|------|-----------|-----------|
| Beta privada | Diario (Railway automático) | 7 días |
| 100 usuarios | Diario + semanal | 30 días |
| 1000 usuarios | Cada 6h + diario + semanal | 90 días |

---

## 11. Monitorización básica

### Health check

El endpoint `/api/health` devuelve:

```json
{
  "status": "ok",
  "version": "0.5.5",
  "checks": {
    "database": { "ok": true, "latencyMs": 12 },
    "ai": { "ok": true },
    "auth": { "ok": true }
  },
  "timestamp": "2026-06-29T..."
}
```

Configurar en Railway/Vercel como health check URL: `/api/health`

### Uptime monitoring

Recomendado: [UptimeRobot](https://uptimerobot.com) (free tier) monitorizando:
- `https://tu-app.com/api/health` — cada 5 minutos

---

## 12. Seguridad operacional

### Rotación de secretos

| Secreto | Frecuencia recomendada | Procedimiento |
|---------|----------------------|---------------|
| `ANTHROPIC_API_KEY` | Cada 90 días o si se filtra | Regenerar en console.anthropic.com → actualizar en Vercel |
| `CLERK_SECRET_KEY` | Si se filtra | Regenerar en Clerk Dashboard → actualizar en Vercel → redeploy |
| `CLERK_WEBHOOK_SECRET` | Si se filtra | Regenerar en Clerk → Webhooks → actualizar en Vercel |
| `DATABASE_URL` password | Cada 180 días | Cambiar en Railway → actualizar en Vercel → redeploy |

### Acceso a producción

- Nunca compartir el archivo `.env.local` de producción
- Usar los secrets managers del proveedor (Vercel Env Vars, Railway Variables)
- Acceso a DB de producción solo via tunnel o VPN, nunca exposición directa a internet
- Revisar `AuditLog` en BD periódicamente para detectar actividad inusual

---

## 13. Troubleshooting común

### App no arranca / crash en boot

```bash
# 1. Verificar /api/health
curl https://tu-app.com/api/health

# 2. Si DB falla: verificar DATABASE_URL y conexión
# 3. Si auth falla: verificar CLERK keys
# 4. Revisar logs de Vercel: dashboard → Deployments → Functions → Logs
```

### "PrismaClientInitializationError" en producción

```
Causa: CONNECTION_LIMIT agotado o BD inaccesible
Solución: añadir ?connection_limit=5 al DATABASE_URL
```

### Webhook de Clerk no llega

```
1. Verificar CLERK_WEBHOOK_SECRET en Vercel
2. Verificar que el webhook en Clerk apunta a la URL correcta
3. Revisar Clerk Dashboard → Webhooks → Logs para ver errores
```

### Rate limit de IA alcanzado antes de tiempo

```
Aumentar temporalmente MAX_AI_GENERATIONS_GLOBAL_DAY en Vercel env vars
(no requiere redeploy — Next.js lee process.env en runtime para estas vars)
```
