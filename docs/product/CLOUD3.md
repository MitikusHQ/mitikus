# CLOUD3 — Persist Workspace Core Link

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Cloud Data Model series
**DB push:** aplicado ✅ (`coreProjectId Int?` en tabla `workspaces`)
**Prisma generate:** pendiente con dev server parado (DLL bloqueado en Windows)

---

## Qué hace

Persiste el vínculo `workspaceId → coreProjectId` en la base de datos de MITIKUS (Postgres).
Desde CLOUD3, el mapping no depende del nombre del proyecto en Core para workspaces
ya vinculados — solo para el primer mount (bootstrap).

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `apps/web/prisma/schema.prisma` | `coreProjectId Int?` en modelo Workspace |
| `apps/web/src/app/api/core/workspace/[workspaceId]/project/route.ts` | Auth + ownership + fast path + persistencia |
| `docs/product/CLOUD3.md` | Este documento |

`mitikus-ai` no fue tocado. Sin cambios en UI ni en CoreMemoryPanel.

---

## Campo añadido a Workspace

```prisma
model Workspace {
  // ...
  coreProjectId Int?  // CLOUD3 — persisted link to MITIKUS AI Core project
  // ...
}
```

Nullable, aditivo, sin valor por defecto — seguro para workspaces existentes.
`db push` aplicado; el campo existe en la tabla `workspaces` de producción.

---

## Lógica de la route `GET /api/core/workspace/[workspaceId]/project`

```
1. auth() → userId (Clerk)
2. db.user.findUnique → { id, orgId }
3. db.workspace.findFirst({ id: workspaceId, orgId: user.orgId })
   → ownership check (mismo patrón que /api/brain/query)
   → 404 si no pertenece al usuario
4. if workspace.coreProjectId !== null
   → return { projectId, created: false, linked: true }   ← FAST PATH
5. CoreClient.listProjects() → buscar "MITIKUS:<workspaceId>"
   → si existe: coreProjectId = canonical.id (el más antiguo)
   → si no existe: CoreClient.createProject() → coreProjectId, created = true
6. db.workspace.update({ coreProjectId })
   → persiste el vínculo (non-fatal si falla: devuelve el id igual)
7. return { projectId, created, linked: false }
```

### Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `projectId` | `number` | ID del proyecto Core a usar |
| `created` | `boolean` | `true` si se creó en este request |
| `linked` | `boolean` | `true` si vino del fast path (ya persistido) |

---

## Seguridad añadida en CLOUD3

La route original (INTG6/INTG7) **no tenía autenticación** — cualquier llamada con
un `workspaceId` válido podía resolver su Core project. CLOUD3 añade:

1. `auth()` de Clerk — requiere sesión activa
2. `db.user.findUnique` — verifica que el usuario existe en MITIKUS
3. `db.workspace.findFirst({ orgId: user.orgId })` — verifica ownership

Patrón idéntico al de `/api/brain/query/route.ts`.

---

## Flujo de migración de workspaces existentes

Los workspaces creados antes de CLOUD3 tienen `coreProjectId = null`.
En su primer mount tras el deploy, la route:

1. Entra en el path de Core (paso 5)
2. Encuentra el proyecto por nombre (`MITIKUS:<workspaceId>`) si ya existía
3. Persiste el id en DB
4. Requests siguientes toman el fast path

No hay pérdida de memoria — el proyecto Core se reutiliza, no se recrea.

---

## Activación de Prisma generate (una vez)

```bash
# Parar el dev server (Ctrl+C en la terminal de turbo dev)
cd apps/web
npx prisma generate
cd ../..
turbo dev
```

El `db push` ya está aplicado. El `generate` solo actualiza los tipos TypeScript
en el cliente Prisma local — necesario para que el type checker conozca `coreProjectId`.
Si el server está parado, `generate` tarda ~5s.

---

## Riesgos residuales

| Riesgo | Severidad | Estado |
|--------|-----------|--------|
| Si `db.workspace.update` falla al persistir, el próximo request vuelve al Core | Baja | Aceptable — degradación no destructiva |
| Core down en el primer mount → `coreProjectId` nunca se persiste | Media | Core debe estar arrancado el primer uso — igual que antes |
| Workspaces de otras orgs no pueden acceder — garantizado por `orgId` check | ✅ | Resuelto en CLOUD3 |
| `prisma generate` pendiente con dev server parado | Baja | Solo afecta tipos locales, no runtime |

---

## Siguiente ticket recomendado

**`CLOUD2B — Core Memory Query Audit Integration`**

Conectar el log de consultas del Core (`CoreMemoryPanel` → `/api/core/projects/[id]/brain/answer`)
al modelo `BrainQuery/BrainSource` de MITIKUS DB.

Hoy, cuando el usuario consulta el Brain local (pestaña "Memoria local"), la respuesta
no se persiste en MITIKUS — solo la respuesta del Brain cloud (`/api/brain/query`) se audita.
CLOUD2B cierra esa brecha unificando ambos logs bajo `BrainQuery`.

Requiere:
- Una ruta proxy que llame al Core Y persista el resultado en DB (`mode`, `answer`, `sources`)
- `origin: "local-memory"` en `BrainSource`
- Refactoring mínimo de `CoreMemoryPanel` para usar la nueva ruta proxy

---

## Referencias

- `docs/product/INTG7.md` — vínculo provisional original
- `docs/product/CLOUD1.md` — modelo cloud completo
- `docs/product/CLOUD2.md` — BrainQuery audit log
- `apps/web/src/app/api/core/workspace/[workspaceId]/project/route.ts` — route CLOUD3
- `apps/web/src/app/api/brain/query/route.ts` — patrón de auth referencia
