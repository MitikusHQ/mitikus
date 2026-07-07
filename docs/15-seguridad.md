# ProTools Hub — Documentación Oficial

## Documento 15 — Seguridad

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

## Tabla de Contenidos

1. [Modelo de Seguridad](#1-modelo-de-seguridad)
2. [Autenticación con Clerk](#2-autenticación-con-clerk)
3. [Autorización y Roles](#3-autorización-y-roles)
4. [Aislamiento Multi-tenant](#4-aislamiento-multi-tenant)
5. [Seguridad de la API IA](#5-seguridad-de-la-api-ia)
6. [Variables de Entorno Sensibles](#6-variables-de-entorno-sensibles)
7. [Rate Limiting](#7-rate-limiting)
8. [Audit Trail de Seguridad](#8-audit-trail-de-seguridad)
9. [Protección de Datos RGPD](#9-protección-de-datos-rgpd)
10. [Vulnerabilidades Mitigadas](#10-vulnerabilidades-mitigadas)

---

## 1. Modelo de Seguridad

ProTools Hub implementa un modelo de seguridad en capas:

```
Browser
  ↓ HTTPS
Middleware (Clerk Auth + i18n)
  ↓ Auth token validado
Server Component / API Route
  ↓ requireUser() → User + orgId
Lógica de negocio
  ↓ Filtro por orgId en todas las queries
PostgreSQL
```

**Principios:**
- **Defense in depth:** Autenticación en middleware, autorización en cada API Route, filtro de tenant en cada query
- **Fail-closed:** Si la auth falla, se redirige al login. No hay acceso sin autenticación.
- **Least privilege:** Los roles limitan las acciones posibles. VIEWER no puede crear.

---

## 2. Autenticación con Clerk

**Archivo:** `apps/web/src/middleware.ts`

```typescript
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()  // ← Redirige a /sign-in si no hay sesión
  }
  // ...
})
```

### Rutas Públicas

```typescript
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/sso-callback(.*)',
  '/onboarding',
  '/shared/(.*)',           // ← Links de compartir públicos
  '/api/webhooks/(.*)',     // ← Webhook de Clerk
  '/api/onboarding/(.*)',   // ← Onboarding sin sesión completa
])
```

### requireUser()

**Archivo:** `apps/web/src/lib/auth.ts`

```typescript
export async function requireUser(): Promise<User> {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    redirect('/sign-in')
  }
  
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { org: true },
  })
  
  if (!user) {
    redirect('/onboarding')
  }
  
  return user
}
```

Cada Server Component y API Route que requiere autenticación llama a `requireUser()`.

### Webhook de Clerk

**Archivo:** `apps/web/src/app/api/webhooks/clerk/route.ts`

Sincroniza eventos de Clerk con la DB:
- `user.created` → INSERT User + Organization
- `user.updated` → UPDATE User
- `user.deleted` → Soft delete (no hard delete para preservar audit)
- `organizationMembership.created` → UPDATE User.orgId + User.role

El webhook valida la firma de Clerk con `svix`:
```typescript
const wh = new Webhook(CLERK_WEBHOOK_SECRET)
const evt = wh.verify(body, headers) as WebhookEvent
```

---

## 3. Autorización y Roles

**Archivo:** `apps/web/src/lib/permissions.ts`

### Jerarquía de Roles

```
OWNER > ADMIN > EDITOR = MEMBER > OPERATOR > VIEWER
```

### Funciones de Autorización

```typescript
// Verificar si un rol está por encima de un umbral
export function roleAtLeast(userRole: OrgRole, required: OrgRole): boolean

// Verificar permiso específico
export function can(userRole: OrgRole, action: PermissionAction): boolean

// Lanzar error si no tiene permiso
export function assertCan(userRole: OrgRole, action: PermissionAction): void

// requireRole() en el servidor
export async function requireRole(minRole: OrgRole): Promise<User>
```

### Tabla de Permisos

| Acción | OWNER | ADMIN | EDITOR | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| Instalar herramienta | ✓ | ✓ | ✓ | — | — |
| Ejecutar herramienta | ✓ | ✓ | ✓ | ✓ | — |
| Crear registro | ✓ | ✓ | ✓ | ✓ | — |
| Borrar registro | ✓ | ✓ | ✓ | — | — |
| Crear workflow | ✓ | ✓ | ✓ | — | — |
| Ejecutar workflow | ✓ | ✓ | ✓ | ✓ | — |
| Ver analytics | ✓ | ✓ | — | — | — |
| Ver audit | ✓ | ✓ | — | — | — |
| Ver usage | ✓ | ✓ | — | — | — |
| Gestionar miembros | ✓ | ✓ | — | — | — |
| Eliminar workspace | ✓ | — | — | — | — |
| Eliminar organización | ✓ | — | — | — | — |

### Uso en API Routes

```typescript
export async function POST(request: Request) {
  const user = await requireUser()
  assertCan(user.role, 'tool.install')  // Lanza 403 si no tiene permiso
  // ...
}
```

### auditDenied

Cuando un permiso es denegado, se registra en el audit:
```typescript
auditDenied({
  orgId: user.orgId,
  actorUserId: user.id,
  action: 'tool.install',
  entityType: 'tool_definition',
})
```

---

## 4. Aislamiento Multi-tenant

**El aislamiento de datos es la línea de defensa más crítica.** Un usuario de la Org A nunca puede acceder a datos de la Org B.

### Filtro de Tenant en todas las Queries

```typescript
// ✅ CORRECTO — siempre incluir orgId
const workspace = await db.workspace.findFirst({
  where: {
    id: workspaceId,
    orgId: user.orgId,   // ← Filtro de tenant obligatorio
  },
})

// ❌ INCORRECTO — sin filtro de tenant
const workspace = await db.workspace.findFirst({
  where: { id: workspaceId },  // Cualquier usuario puede ver cualquier workspace
})
```

### Cascadas de Eliminación

Las cascades de eliminación garantizan que al borrar una organización, todos sus datos se borran automáticamente:

```
Organization → (Cascade) → User
Organization → (Cascade) → Workspace → (Cascade) → Client → (Cascade) → ToolInstance
Organization → (Cascade) → AuditLog
```

### Verificación de Membresía

Para acciones críticas (acceder a un workspace), se verifica que el workspace pertenece a la org del usuario:

```typescript
const workspace = await db.workspace.findFirst({
  where: {
    id: workspaceId,
    orgId: user.orgId,  // User.orgId viene del token de Clerk — inmutable
  },
})
if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })
```

---

## 5. Seguridad de la API IA

### Claves en el Servidor

**ANTHROPIC_API_KEY nunca sale del servidor.** Solo se usa en el Execution Engine, que vive en `lib/execution-engine.ts` — código exclusivo del servidor (no `'use client'`).

```typescript
// execution-engine.ts — Solo ejecuta en el servidor Next.js
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,  // Variable de entorno del servidor
})
```

### Sin Exposición al Cliente

Las API Keys nunca aparecen en:
- Props de componentes React
- Respuestas de API
- LocalStorage / SessionStorage
- Variables de entorno `NEXT_PUBLIC_*`

### Validación de Input

Los inputs del usuario se validan antes de incluirse en los prompts:
- Longitud máxima de campos (evita prompt injection por tamaño)
- Sanitización básica de caracteres especiales
- Validación contra el schema de la herramienta

---

## 6. Variables de Entorno Sensibles

| Variable | Uso | Servidor/Cliente |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | Solo servidor |
| `ANTHROPIC_API_KEY` | API de Anthropic | Solo servidor |
| `OPENAI_API_KEY` | API de OpenAI | Solo servidor |
| `CLERK_SECRET_KEY` | Auth de Clerk | Solo servidor |
| `CLERK_WEBHOOK_SECRET` | Validación webhooks | Solo servidor |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend | Cliente (seguro) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | URL de login | Cliente (seguro) |

**Hook de seguridad:** El hook `block-secrets.sh` bloquea escrituras accidentales a `.env.local` y `.env.example` desde el entorno de desarrollo.

---

## 7. Rate Limiting

Ver [Doc 07 — Execution Engine, sección 7].

El rate limiting opera en **dos niveles**:

1. **Por usuario/día:** Evita abuso individual
2. **Global/día:** Limita el gasto total de la plataforma

Si se supera un límite:
- La API devuelve `429 Too Many Requests`
- Se registra `rate_limit.exceeded` en el AuditLog
- La `ToolExecution` queda en `status: CANCELLED`
- El `AIUsage` registra `status: 'rate_limited'`

---

## 8. Audit Trail de Seguridad

Los eventos de seguridad se registran con acciones específicas:

| Acción | Trigger |
|---|---|
| `auth.denied` | Intento de acceso sin sesión |
| `permission.denied` | Usuario sin rol suficiente |
| `rate_limit.exceeded` | Rate limit superado |

Estos eventos incluyen `ipHint` y `userAgentHint` para análisis de seguridad.

---

## 9. Protección de Datos RGPD

### Datos Personales en el Sistema

| Modelo | Datos personales | Tratamiento |
|---|---|---|
| `User` | email, name | Cifrado en tránsito, almacenado en Clerk |
| `ToolRecord` | Posiblemente datos personales en `data` | Responsabilidad del operador |
| `AuditLog` | actorUserId (referencia) | Anonimizado en SetNull si usuario se elimina |

### Derecho al Olvido

Si un usuario solicita eliminación:
1. Su registro en `User` se elimina (o anonimiza)
2. `AuditLog.actorUserId` queda en `null` (SetNull cascade)
3. Sus `ToolRecord`, `ToolExecution`, `AIUsage` permanecen (son datos de negocio del operador)

### Acceso a Datos

Solo los miembros OWNER/ADMIN de una organización pueden ver los datos de los demás usuarios en la organización.

---

## 10. Vulnerabilidades Mitigadas

### SQL Injection

Prisma usa consultas parametrizadas — no hay concatenación de SQL. Imposible inyectar SQL via inputs del usuario.

### XSS (Cross-Site Scripting)

Next.js escapa automáticamente el contenido en JSX. Los resultados IA (markdown) se renderizan con un parser seguro que no ejecuta scripts.

### CSRF

Clerk gestiona la protección CSRF automáticamente. Los tokens de sesión son HttpOnly cookies.

### Prompt Injection

Los inputs del usuario se insertan en los prompts como datos, no como instrucciones. El system prompt siempre antecede al user prompt, limitando la capacidad de manipulación.

### IDOR (Insecure Direct Object Reference)

Todas las queries incluyen `orgId: user.orgId`. Un atacante que conoce un ID no puede acceder si no pertenece a su organización.

### Exposición de Claves

- Las API Keys nunca salen del servidor
- El hook `block-secrets.sh` previene commits accidentales
- Las variables `NEXT_PUBLIC_*` solo contienen datos no sensibles
