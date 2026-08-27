# CLOUD6 — Feed Core from MITIKUS Memory

**Estado:** Implementado (2026-08-22)
**Sprint:** MITIKUS Cloud memory integration

---

## Objetivo

Cuando el usuario crea un `MemoryItem` en MITIKUS Cloud, MITIKUS debe seguir
siendo la fuente de verdad y el Core local debe actuar como indice derivado.

CLOUD6 cierra la brecha documentada en CLOUD5:

```text
MemoryItem en MITIKUS PostgreSQL
  -> source of truth
  -> best-effort sync a MITIKUS AI Core SQLite
  -> Brain local puede encontrar esa memoria
```

---

## Principio

> MITIKUS owns the user and their data.
> MITIKUS AI Core processes memory but does not own the product.

Por eso el orden es obligatorio:

1. MITIKUS valida usuario y ownership del workspace.
2. MITIKUS crea `MemoryItem` en PostgreSQL.
3. MITIKUS intenta enviar la nota al Core.
4. Si el Core falla, la respuesta al usuario sigue siendo correcta.

El Core nunca bloquea la escritura principal.

---

## Archivo modificado

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/api/workspace/[workspaceId]/memory/route.ts` | POST crea `MemoryItem` primero y luego intenta `CoreClient.createNote()` |

No se modifico `mitikus-ai`.
No se crearon endpoints nuevos en el Core.
No hubo cambios de schema ni `db push`.

---

## Flujo POST

`POST /api/workspace/[workspaceId]/memory`

1. `auth()` de Clerk.
2. Lookup de usuario y ownership del workspace.
3. Validacion de `title`, `content` y `type`.
4. `db.memoryItem.create(...)`.
5. Resolver `coreProjectId`:
   - fast path: `workspace.coreProjectId`
   - fallback: buscar proyecto Core por nombre `MITIKUS:<workspaceId>`
   - si no existe o Core no responde, se omite sync.
6. `CoreClient.createNote(coreProjectId, title, content)` en `try/catch`.
7. Devuelve `{ item }`, status `201`.

---

## Non-fatal obligatorio

La sincronizacion al Core es best-effort:

- Si el Core esta caido, el `MemoryItem` queda guardado en MITIKUS.
- Si `CoreClient.listProjects()` falla, la respuesta al cliente no cambia.
- Si `CoreClient.createNote()` falla, la respuesta al cliente no cambia.
- El error se registra con:

```ts
console.error("[CLOUD6] Core sync failed", err);
```

---

## Duplicados

En este MVP no hay guard contra duplicados dentro del Core.

Si el usuario crea dos `MemoryItem` iguales, o si se reintenta una sincronizacion
manual futura, el Core podria recibir notas duplicadas. Es aceptable en CLOUD6
porque:

- MITIKUS PostgreSQL sigue siendo source of truth.
- Core SQLite es indice derivado.
- La deduplicacion requiere un identificador externo o una sync table, fuera de
  este alcance.

---

## Brecha residual

Brain cloud todavia no busca directamente sobre `memory_items`.

Despues de CLOUD6:

- Pestaña `Memoria`: guarda en MITIKUS DB y alimenta Core local.
- Pestaña `Memoria local`: consulta el Core local y puede encontrar la nota.
- Brain cloud: sigue buscando en sus fuentes actuales, no necesariamente en
  `memory_items`.

Proximo paso recomendado:

`CLOUD7 — Brain FTS sobre MemoryItems`

---

## Fuera de alcance

- Sync offline completo.
- Sync inversa Core -> MITIKUS.
- Deduplicacion robusta.
- Cambios en MITIKUS AI Core.
- Nuevos endpoints del Core.
- Cambios de contrato del Core.
- Cambios de schema.
- Tauri, prototipo desktop, instaladores, hashes, iconos o logo.

---

## Verificacion esperada

1. `npx tsc --noEmit`
2. Con Core arrancado:
   - crear `MemoryItem` desde pestaña `Memoria`
   - confirmar que se guarda en MITIKUS DB
   - abrir `Memoria local`
   - consultar algo relacionado y confirmar evidencia del Core
3. Con Core parado:
   - crear `MemoryItem`
   - confirmar status `201`
   - confirmar que el item persiste en MITIKUS DB

