# INTG7 — Core Project Link Hardening

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Core integration series
**Archivos tocados:** `apps/web/src/app/api/core/workspace/[workspaceId]/project/route.ts`

---

## Qué hace el vínculo

Cada workspace de MITIKUS tiene asociado un proyecto en MITIKUS AI Core.
El vínculo se resuelve en tiempo de petición: la ruta `GET /api/core/workspace/[workspaceId]/project`
busca un proyecto Core cuyo nombre sea `MITIKUS:<workspaceId>` y, si no existe, lo crea.

```
MITIKUS Workspace id  →  nombre convenido  →  Core project id
"clx123abc"          →  "MITIKUS:clx123abc" →  42
```

Esta lógica vive en `apps/web/src/app/api/core/workspace/[workspaceId]/project/route.ts`.

---

## Por qué es provisional

El mapping **no está persistido en la base de datos de MITIKUS** (Postgres + Prisma).
Vive solo en el nombre del proyecto dentro del SQLite local de MITIKUS AI Core.

Consecuencias:

| Escenario | Efecto |
|-----------|--------|
| Core reiniciado con DB nueva | Se pierde el proyecto; la ruta lo recrea vacío |
| Workspace renombrado | El id no cambia — el mapping sigue funcionando |
| Workspace eliminado en MITIKUS | El proyecto Core queda huérfano (no se borra) |
| Core SQLite corrupto o borrado | Se pierde toda la memoria local del workspace |
| Dos peticiones simultáneas al mount (race condition) | Se crean dos proyectos con el mismo nombre; el handler elige el más antiguo (menor id) y el duplicado queda huérfano. Inocuo, pero desperdicia un id. |

---

## Mejoras aplicadas en INTG7

1. **Guard de duplicados**: si `listProjects()` devuelve más de un proyecto con nombre `MITIKUS:<workspaceId>`, se selecciona el de menor `id` (el más antiguo). Antes se usaba `.find()` que devolvía el primero sin orden garantizado.

2. **Separación 503 / 500**: error 503 si el Core no responde (no arrancado), error 500 si el Core responde pero falla la creación del proyecto. Antes ambos casos devolvían 503.

3. **Validación de workspaceId**: guard explícito antes de la petición al Core.

4. **Comentario de contrato provisional** en el archivo de ruta, con referencia a este doc y al path de migración.

---

## Riesgos residuales

### Riesgo 1 — Pérdida de memoria si el Core SQLite se borra ⚠️

**Probabilidad:** Baja en dev, real en producción.
**Impacto:** Alto — toda la memoria privada del workspace desaparece.
**Mitigación actual:** Ninguna. El Core es local y sin backup.
**Mitigación futura:** Backup periódico del SQLite o migración a Core remoto (fuera de scope de INTG7).

### Riesgo 2 — Carencia de ownership en MITIKUS DB 🔶

**Probabilidad:** N/A (es un estado, no un evento).
**Impacto:** No se puede listar proyectos Core desde MITIKUS sin llamar al Core.
No hay FK que garantice integridad referencial.
**Mitigación actual:** El nombre `MITIKUS:<workspaceId>` actúa como clave natural.
**Mitigación futura:** Añadir `coreProjectId Int?` al modelo Workspace (ver sección de migración).

### Riesgo 3 — Proyectos huérfanos en Core 🟡

**Probabilidad:** Baja (solo en race condition del primer mount).
**Impacto:** Cosmético — proyectos vacíos en el Core que no sirven.
**Mitigación actual:** Handler elige el más antiguo y los extras quedan inactivos.

---

## Cuándo pasar a `coreProjectId` persistido

Hacer la migración cuando se cumpla **cualquiera** de estas condiciones:

1. **MITIKUS AI Core demuestra estabilidad en producción** (>30 días sin reset de DB) y se plantea un plan de backup del SQLite.
2. **Se necesita listar los proyectos Core de todos los workspaces** desde la UI de admin de MITIKUS sin llamar al Core.
3. **Se introduce multi-Core** (más de una instancia del Core por usuario u organización).
4. **Se añade sincronización o backup** de la memoria local → necesitará una tabla de mapping en MITIKUS DB.

### Pasos de migración cuando llegue el momento

```prisma
// schema.prisma — añadir al modelo Workspace
coreProjectId Int?  // ID del proyecto en MITIKUS AI Core local
```

```bash
npx prisma migrate dev --name add_workspace_core_project_id
```

```ts
// apps/web/src/app/api/core/workspace/[workspaceId]/project/route.ts
// 1. Buscar coreProjectId en DB de MITIKUS primero
// 2. Si existe y Core responde → devolver sin llamar a listProjects()
// 3. Si no existe → crear en Core + persistir id en DB
// 4. Si Core no disponible → devolver el id persistido con warning "Core offline"
```

La migración es aditiva (campo nullable), no rompe nada existente.
El campo persiste el mapping que hoy se resuelve por nombre — no es una refactor de UI.

---

## Estado del selector manual

`CoreMemoryPanel` mantiene un selector de proyecto oculto (botón `···`) para debug.
**No debe promoverse a flujo principal** salvo que el usuario necesite cambiar el
proyecto Core de un workspace de forma explícita (caso de uso edge, no planificado).

---

## Referencias

- `apps/web/src/app/api/core/workspace/[workspaceId]/project/route.ts` — ruta proxy
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/CoreMemoryPanel.tsx` — consumer
- `apps/web/src/lib/core-client/index.ts` — CoreClient
- `INTG6` — donde se creó el mapping inicial
