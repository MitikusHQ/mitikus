# HELP1 — MITIKUS Product Knowledge Base for Brain

Estado: implementado
Fecha: 2026-08-28

## Objetivo

Permitir que Brain responda preguntas sobre como funciona MITIKUS aunque el workspace todavia no tenga memoria suficiente. El usuario puede preguntar por secciones, flujos o herramientas y recibir una respuesta basada en una fuente visible de ayuda interna.

## Cambio realizado

Se anade una fuente nueva de busqueda en `src/lib/brain/product-knowledge.ts`:

- Secciones principales de MITIKUS: Mi dia, Arkos, Brain, Correo, Clientes, Leads, Tareas, Herramientas, Flujos, Mi Office, Misiones, Fiscal, Facturas, Gastos, Analitica, Uso del plan, Auditoria, Admin Org, Ajustes, Mi perfil y Soporte.
- Catalogo oficial completo de herramientas desde `allOfficialTools`, incluidas herramientas no instaladas en el workspace.

Brain ahora puede explicar para que sirve cada parte del producto y para que sirve cada herramienta oficial disponible.

## Integracion

`searchWorkspace()` incorpora `searchProductKnowledge(query)` junto a documentos, memoria, conversaciones y herramientas instaladas.

Nueva fuente:

- `type: "help"`
- `origin: "product-help"` al persistir en `BrainSource`
- etiqueta visible en UI: `Ayuda MITIKUS`

## Invariantes

- No se toca MITIKUS AI Core.
- No se crean endpoints nuevos.
- No se cambia schema ni se ejecuta `db push`.
- La ayuda de producto no es memoria privada del usuario.
- Las herramientas no instaladas se explican como disponibles en catalogo y pueden requerir instalacion.
- Las fuentes siguen visibles en Brain y en el historial.

## Limitacion

La base de ayuda es estatica y vive en codigo. Si cambia el producto, hay que actualizarla. Un futuro HELP2 podria mover esta ayuda a contenido versionado editable desde admin.
