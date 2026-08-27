# PMF7 — Activation UX Fixes

**Fecha:** 2026-08-26  
**Estado:** Implementado ✅

## Objetivo

Mejorar la experiencia de activación inicial para que el usuario no solo vea una checklist, sino que entienda qué hacer, por qué importa y cuál es el siguiente paso recomendado.

## Cambios implementados

### A — Callout "Siguiente paso"

`OnboardingChecklist` ahora incluye un bloque prominente encima de la lista que muestra:
- Etiqueta "Siguiente paso" en color primary
- Título del paso actual en negrita
- Una línea de contexto concreto (qué dato o acción se necesita exactamente)
- CTA primario con flecha

El callout es dinámico: muestra siempre el primer paso sin completar.

### B — Copy mejorado por paso

Cada paso ahora tiene dos textos:
- `label` — título corto para la lista (máx. 5 palabras)
- `hint` — una línea concreta para el callout ("Tu nombre o razón social + NIF. Solo tarda un minuto.")
- `description` — descripción completa (reservada para uso futuro en tooltip/drawer)

| Paso | Label anterior | Label nuevo |
|------|---------------|-------------|
| fiscal | — | Añade tu nombre y NIF |
| client | — | Añade tu primer cliente |
| invoice | — | Crea tu primera factura |
| company | — | Cuéntale a Arkos a qué te dedicas |
| tool | — | Instala tu primera herramienta |
| execution | — | Genera tu primer informe |

### C — Jerarquía visual

| Estado | Tratamiento |
|--------|-------------|
| Completado | `opacity-40` + tachado |
| Próximo | Fondo `primary/5`, indicador con borde primary |
| Futuro | `opacity-50` |

El indicador circular muestra el número de paso (futuro/próximo) o un ✓ verde (completado).

La barra de progreso `%` en el header da contexto de avance sin interrumpir el flujo.

### D — Ayuda contextual en FrictionButton

`FrictionButton` recibe dos nuevas props: `nextStepId` y `nextStepLabel`.

Al seleccionar una razón de bloqueo, en lugar del mensaje genérico anterior se muestra un bloque de ayuda específico:

| Razón | Ayuda mostrada |
|-------|---------------|
| `no-entiendo` | Explicación de qué hace exactamente el paso actual (adapta el texto por `stepId`) |
| `sin-datos` | Qué dato concreto hace falta y dónde encontrarlo |
| `sin-prisa` | Qué más puede explorar (herramientas, Arkos) sin presión |
| `explorando` | Sugerencia de exploración (Arkos, catálogo de herramientas) |
| `otro` | Cómo contactar soporte vía Arkos |

El bloque de ayuda incluye un enlace "Volver" para reiniciar la selección sin recargar la página.

## Arquitectura

- **`OnboardingChecklist.tsx`** — Server Component. Construye el array `steps` con `label`, `hint`, `description`, `cta`. Renderiza el callout, la lista y pasa `nextStepId`/`nextStepLabel` a `FrictionButton`.
- **`FrictionButton.tsx`** — Client Component. Gestiona estado local (`open`, `chosen`). Llama a `recordFriction` al seleccionar razón. Muestra ayuda via `getHelp(reasonId, stepId, stepLabel)`.
- **`TrackedStepLink.tsx`** — Sin cambios. CTA primario en callout y lista.
- **`ChecklistTracker.tsx`** — Sin cambios. Dispara `pmf.onboarding.viewed` en mount.

## Privacidad

- `getHelp` es puro client-side: no almacena el texto de ayuda, solo el ID de razón (ya registrado en PMF5).
- No se añade ningún dato nuevo a `AuditLog`.

## Métricas esperadas

- Reducción de `pmf.onboarding.blocked` con razón `no-entiendo` — el callout y el hint resuelven la ambigüedad antes de que el usuario llegue al botón de bloqueo.
- Mayor proporción de orgs que completan el paso `fiscal` en la primera sesión.

## Limitaciones

- El copy de `getHelp` es estático: no se adapta al idioma ni al tipo de empresa. Si en el futuro hay empresas no españolas, revisar los textos de `fiscal` y `client`.
- El callout repite el CTA del paso que también aparece en la lista. Es intencionado: el callout es la primera cosa visible sin scroll.
