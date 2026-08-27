# CLOUD7 — Brain FTS sobre MemoryItems

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD5 introdujo `MemoryItem` como memoria libre del workspace en MITIKUS Cloud.
CLOUD6 sincroniza cada nueva memoria hacia MITIKUS AI Core de forma secundaria y
non-fatal.

Seguía faltando que el Brain cloud de MITIKUS consultase directamente la memoria
propia de MITIKUS. Sin esto, `memory_items` era fuente de verdad para persistencia,
pero no participaba en las respuestas del Brain cloud.

## Principio

MITIKUS Cloud es la fuente de verdad.

MITIKUS AI Core puede recibir una copia derivada para indexar en local, pero el
producto MITIKUS debe poder responder sobre su propia memoria aunque el Core no
sea el owner de datos.

## Cambio implementado

Archivo modificado:

- `apps/web/src/lib/brain/brain-search.ts`

`searchWorkspace()` ahora consulta una fuente adicional:

- `searchMemoryItems(workspaceId, query, orgId)`

La búsqueda usa PostgreSQL full-text search sobre:

- `title`
- `content`
- `type`

Restricciones aplicadas:

- `workspaceId` debe coincidir.
- `orgId` debe coincidir.
- `status = "active"`.

Los resultados se devuelven como `BrainFragment` con:

- `type: "memory"`
- `id`: id del `MemoryItem`
- `title`: título de la memoria con tipo entre paréntesis
- `excerpt`: primeros 300 caracteres de `content`
- `score`: ranking FTS de PostgreSQL

## Auditoría

No se cambió la ruta `/api/brain/query`.

Como CLOUD2 ya persiste las fuentes devueltas por `searchWorkspace()`, los
`MemoryItem` encontrados quedan registrados en:

- `BrainQuery`
- `BrainSource`

Con el contrato existente:

- `sourceType = "memory"`
- `origin = "cloud-memory"`

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints.
- No se hizo `db push`.
- No se implementó búsqueda vectorial.
- No se implementó edición o archivado de memorias.
- No se implementó reconciliación de duplicados entre Core SQLite y MITIKUS Cloud.

## Riesgos residuales

La búsqueda es FTS básica de PostgreSQL. Funciona bien para términos presentes
literalmente en la memoria, pero todavía no cubre equivalencias semánticas,
sinónimos complejos ni ranking avanzado.

Si un `MemoryItem` ya fue sincronizado al Core por CLOUD6, puede aparecer como
evidencia en Brain local y como memoria cloud en Brain cloud. Esto es aceptable
en el MVP porque son superficies distintas y MITIKUS Cloud sigue siendo la fuente
de verdad.

## Siguiente paso recomendado

CLOUD8 — Memory Item Edit & Archive UX.

Permitir editar y archivar memorias desde la pestaña "Memoria", manteniendo
`status = "archived"` fuera de las respuestas Brain y sin borrar datos.
