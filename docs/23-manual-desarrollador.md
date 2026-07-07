# ProTools Hub — Documentación Oficial

## Documento 23 — Manual del Desarrollador

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Audiencia:** Desarrolladores que trabajan en ProTools Hub

---

## Tabla de Contenidos

1. [Setup del Entorno](#1-setup-del-entorno)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Comandos Habituales](#3-comandos-habituales)
4. [Convenciones de Código](#4-convenciones-de-código)
5. [Añadir una Herramienta al Catálogo](#5-añadir-una-herramienta-al-catálogo)
6. [Crear un Nuevo Engine](#6-crear-un-nuevo-engine)
7. [Añadir una API Route](#7-añadir-una-api-route)
8. [Añadir una Página al Workspace](#8-añadir-una-página-al-workspace)
9. [TypeScript Patterns Específicos](#9-typescript-patterns-específicos)
10. [Testing](#10-testing)
11. [Debugging](#11-debugging)

---

## 1. Setup del Entorno

### Prerrequisitos

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Cuenta de Clerk (gratuita para dev)
- Clave de API de Anthropic

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd protools-hub

# Instalar dependencias (desde la raíz del monorepo)
npm install

# Configurar variables de entorno
# Copiar .env.example a .env.local y rellenar los valores
# IMPORTANTE: No tocar .env.local — el hook block-secrets.sh lo protege para commits

# Crear la base de datos
createdb protools_hub_dev

# Aplicar el schema
cd apps/web
npx prisma db push

# Sembrar el catálogo oficial
npx prisma db seed

# Iniciar el servidor de desarrollo
npx next dev -p 3002
```

### Variables de Entorno Requeridas

```bash
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/protools_hub_dev"

# Clerk (Auth)
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# IA
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Rate Limiting
MAX_AI_GENERATIONS_PER_USER_DAY=10
MAX_AI_ESTIMATED_COST_DAY_EUR=2.0
```

### Webhook de Clerk en Local

Para recibir webhooks de Clerk en local:
```bash
# Instalar ngrok
npx ngrok http 3002

# Configurar la URL en el dashboard de Clerk:
# https://xxx.ngrok.io/api/webhooks/clerk
```

---

## 2. Estructura del Proyecto

Ver [Doc 02 — Arquitectura General] para el árbol de directorios completo.

**Regla de oro:** Si un archivo importa desde `'@prisma/client'` o `db`, no puede ser un Client Component (`'use client'`).

---

## 3. Comandos Habituales

```bash
# Desarrollo
npx next dev -p 3002            # Servidor de desarrollo directo
npm run dev                     # Via Turborepo (puede ser más lento)

# Build
npm run build                   # Build de producción

# TypeScript
npm run type-check              # Verificar tipos sin compilar

# Prisma
npx prisma db push              # Aplicar cambios del schema (sin migrations)
npx prisma generate             # Regenerar el cliente Prisma
npx prisma studio               # UI de Prisma para inspeccionar la DB
npx prisma db seed              # Sembrar el catálogo oficial

# Linting
npm run lint                    # ESLint
npm run lint:fix                # Auto-fix problemas de lint
```

---

## 4. Convenciones de Código

### 4.1 Server vs. Client Components

```typescript
// Server Component (por defecto en App Router)
// ✅ Puede: async, await db, requireUser()
// ❌ No puede: useState, useEffect, onClick handlers
export default async function Page({ params }: Props) {
  const user = await requireUser()
  const data = await db.workspace.findMany(...)
  return <div>{data.map(...)}</div>
}

// Client Component
// ✅ Puede: useState, useEffect, eventos del DOM
// ❌ No puede: async/await directo, db, requireUser()
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState(...)
  return <button onClick={() => setState(...)}>Click</button>
}
```

### 4.2 requireUser() en cada API Route

```typescript
// ✅ Siempre primero
export async function POST(request: Request) {
  const user = await requireUser()  // Redirige si no hay sesión
  // ...
}
```

### 4.3 Filtro de Tenant Obligatorio

```typescript
// ✅ SIEMPRE incluir orgId
const workspace = await db.workspace.findFirst({
  where: {
    id: workspaceId,
    orgId: user.orgId,  // ← NUNCA omitir
  },
})
```

### 4.4 Audit Fire-and-Forget

```typescript
// ✅ void — nunca await
void audit({ orgId, actorUserId, action: 'tool.execute', ... })
```

### 4.5 noUncheckedIndexedAccess

TypeScript está configurado con `noUncheckedIndexedAccess`. El acceso a arrays puede retornar `T | undefined`:

```typescript
// ❌ Error de tipo
const first = array[0].name  // Puede ser undefined

// ✅ Correcto
const first = array[0]
if (!first) return
const name = first.name

// ✅ También correcto con optional chaining
const name = array[0]?.name ?? 'default'
```

---

## 5. Añadir una Herramienta al Catálogo

### Paso 1: Crear el archivo de la herramienta

```typescript
// apps/web/src/registry/official/quality/my-tool.ts

import type { ToolSchemaV1 } from '@protools/schema'

export const myTool = {
  // ToolDefinition
  slug:        'my-tool',
  name:        'Mi Herramienta',
  description: 'Descripción de qué hace.',
  category:    'AUDIT' as const,
  schema: {
    id:      'my-tool',
    version: '1',
    name:    'Mi Herramienta',
    description: 'Para qué sirve.',
    aiInstructions: 'Instrucciones para el modelo IA...',
    fields: [
      {
        id:       'company_name',
        label:    'Nombre de la empresa',
        type:     'text',
        required: true,
      },
      // más campos...
    ],
  } satisfies ToolSchemaV1,
  
  // ToolRegistryMeta
  registryMeta: {
    displayCategory: 'Calidad',
    icon:            '🔍',
    color:           '#10B981',
    tags:            ['calidad', 'auditoría'],
    keywords:        ['ISO', 'auditoría interna'],
    complexity:      'intermediate' as const,
    estimatedMinutes: 45,
    tier:            'official' as const,
  },
  
  // ToolCapabilityProfile
  capabilityProfile: {
    businessDomain:    'quality',
    businessGoals:     ['iso9001_certification'],
    inputTypes:        ['company_info'],
    outputTypes:       ['audit_report'],
    dependencies:      [],
    relatedTools:      ['corrective-action'],
    executionCostEUR:  0.06,
    automationFriendly: true,
    qualityLevel:      'standard' as const,
    recommendedModels: ['claude-sonnet-4-6'],
    supportedProviders: ['anthropic'],
  },
}
```

### Paso 2: Registrar en el índice del dominio

```typescript
// apps/web/src/registry/official/quality/index.ts
export { myTool } from './my-tool'
```

### Paso 3: Añadir al seed

```typescript
// apps/web/prisma/seed.ts
import { myTool } from '../src/registry/official/quality'

const tools = [
  // ...herramientas existentes...
  myTool,
]
```

### Paso 4: Sembrar

```bash
npx prisma db seed
```

### Paso 5: Añadir el CanonicalGoal (si es nuevo)

Si la herramienta soporta un objetivo nuevo:
```typescript
// apps/web/src/lib/intent-engine/goals.ts
{
  slug:          'new_goal',
  domain:        'quality',
  keywords:      ['nueva keyword', 'otra keyword'],
  primaryTools:  ['my-tool'],
  requiredEntities: [],
}
```

---

## 6. Crear un Nuevo Engine

Los engines siguen un patrón consistente:

```
lib/my-engine/
├── index.ts           ← Exporta la API pública
├── my-engine-types.ts ← Tipos del sistema (sin dependencia de Prisma)
├── core.ts            ← Lógica principal
└── helpers.ts         ← Utilidades internas
```

**Regla:** Los engines son **sin estado** — no almacenan datos en memoria. Todo el estado va a PostgreSQL.

**Regla:** Los engines **no conocen** workspaces, usuarios ni permisos. Eso es responsabilidad de la API Route que los invoca.

---

## 7. Añadir una API Route

```typescript
// apps/web/src/app/api/my-feature/route.ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import { audit } from '@/lib/audit'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  // 1. Auth
  const user = await requireUser()
  
  // 2. Parse body
  const { workspaceId, ...data } = await request.json()
  
  // 3. Verificar permisos
  assertCan(user.role, 'some.action')
  
  // 4. Verificar acceso al workspace (filtro de tenant)
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  // 5. Lógica de negocio
  const result = await doSomething(data)
  
  // 6. Audit (fire-and-forget)
  void audit({
    orgId: user.orgId,
    workspaceId,
    actorUserId: user.id,
    action: 'some.action',
    entityType: 'some_entity',
    result: 'success',
  })
  
  // 7. Respuesta
  return NextResponse.json(result, { status: 201 })
}
```

---

## 8. Añadir una Página al Workspace

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/my-page/page.tsx
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function MyPage({ params }: Props) {
  // Patrón: params es Promise en Next.js 15
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()
  
  // Cargar datos necesarios
  const data = await db.someModel.findMany({
    where: { workspaceId },
  })
  
  return (
    // ✅ Patrón correcto — nunca <main>, nunca <header>
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Mi Página</h1>
      {/* contenido */}
    </div>
  )
}
```

**Crítico:** Las páginas dentro de `workspace/[workspaceId]/` NO deben tener `<main>`, `<header>`, ni `<nav>` propios. El `WorkspaceShell` (layout.tsx) los provee.

---

## 9. TypeScript Patterns Específicos

### Promise<Params> en Next.js 15

```typescript
// ✅ Correcto en Next.js 15
interface Props {
  params: Promise<{ workspaceId: string }>
}
export default async function Page({ params }: Props) {
  const { workspaceId } = await params
}

// ✅ Carga paralela (más eficiente)
const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
```

### Json de Prisma

```typescript
// Prisma devuelve Json como unknown — hay que hacer cast
const schema = instance.toolDefinition.schema as ToolSchemaV1
const variables = execution.variables as Record<string, string>
```

### noUncheckedIndexedAccess Pattern

```typescript
const items = await db.model.findMany(...)

for (const item of items) {
  // item nunca es undefined aquí — el loop lo garantiza
  console.log(item.name)
}

// Para acceso por índice:
const first = items[0]
if (!first) return  // ← Necesario por noUncheckedIndexedAccess
console.log(first.name)
```

---

## 10. Testing

No hay suite de tests en el MVP. El testing está cubierto por el **QA Sentinel** (Playwright). Ver [Doc 19 — QA Sentinel].

Para el futuro, la arquitectura es compatible con Vitest para tests unitarios de los engines.

---

## 11. Debugging

### Prisma Studio

```bash
npx prisma studio
# Abre http://localhost:5555 con UI para la DB
```

### Logs del Servidor

```bash
# Logs de Next.js
npx next dev -p 3002 2>&1 | tee dev.log

# Filtrar logs de Prisma
DEBUG=prisma:client npx next dev -p 3002
```

### Verificar el Audit Log

```sql
SELECT * FROM audit_logs 
WHERE workspace_id = 'xxx'
ORDER BY created_at DESC 
LIMIT 20;
```

### Verificar Rate Limiting

```sql
SELECT COUNT(*), SUM(estimated_cost_eur)
FROM ai_usage
WHERE user_id = 'xxx'
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND status = 'success';
```

### Type-Check sin Build

```bash
cd apps/web
npx tsc --noEmit
```

### Puerto Ocupado

```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# O iniciar en otro puerto
npx next dev -p 3003
```
