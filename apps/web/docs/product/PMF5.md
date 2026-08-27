# PMF5 — Onboarding Instrumentado + Friction Notes

**Fecha:** 2026-08-26  
**Estado:** Implementado ✅

## Objetivo

Saber por qué los usuarios no completan el flujo fiscal → cliente → factura. Sin encuestas largas, sin interrumpir el flujo, sin datos sensibles.

## Eventos añadidos a AuditLog

| Evento | Cuándo |
|--------|--------|
| `pmf.onboarding.viewed` | Disponible para usar cuando se muestre el checklist |
| `pmf.onboarding.step.clicked` | Disponible para usar al pulsar CTA de un paso |
| `pmf.onboarding.step.skipped` | Disponible para usar al saltar un paso |
| `pmf.onboarding.blocked` | Al pulsar "Estoy bloqueado" y elegir razón |
| `pmf.onboarding.completed` | Disponible para usar cuando todos los pasos estén completos |

Metadata permitida: `stepId`, `stepLabel`, `source`, `reason`. Nunca NIF, IBAN, emails, direcciones ni contenido fiscal.

## Razones de fricción (FrictionButton)

| ID | Label visible al usuario |
|----|--------------------------|
| `no-entiendo` | No entiendo el siguiente paso |
| `sin-datos` | No tengo los datos a mano |
| `sin-prisa` | No quiero emitir facturas todavía |
| `explorando` | Solo estoy explorando |
| `otro` | Otro |

## Dónde aparece

**`OnboardingChecklist`** — al final del checklist de primeros pasos, enlace discreto "¿Estoy bloqueado o no sé qué hacer?" que despliega el mini selector. Solo visible mientras el checklist esté activo (se oculta cuando todos los pasos están completos).

## Flujo de la fricción

1. Usuario ve el checklist → pulsa "¿Estoy bloqueado o no sé qué hacer?"
2. Aparecen 5 botones de razón (sin texto libre obligatorio).
3. Al elegir → Server Action `recordFriction(workspaceId, reason)` → `audit()` fire-and-forget.
4. Mensaje de confirmación: "Gracias, lo hemos anotado. Puedes seguir explorando o volver a este paso más tarde."
5. El flujo principal no se interrumpe en ningún momento.

## Dashboard admin

`/admin/pmf-funnel` muestra ahora una sección "Fricciones del onboarding":
- Tarjetas con conteo por razón (`COUNT(*)` agrupado por `metadata->>'reason'`).
- Tabla de últimos 20 eventos `pmf.onboarding.blocked` con fecha, org y razón.
- Se respeta el filtro de periodo (7 días / 30 días / todo) existente.

## Privacidad

- La metadata solo contiene el ID de razón (string corto predefinido).
- No se almacena ningún texto libre del usuario.
- El `orgId` se trunca en la UI del dashboard.

## Cómo interpretar los datos

- **`sin-datos` alto** → El flujo pide información fiscal que los usuarios no tienen a mano. Considerar guardado parcial o recordatorio posterior.
- **`explorando` alto** → Los usuarios llegan al checklist antes de estar listos. El onboarding puede ser demasiado apresurado.
- **`sin-prisa` alto** → La facturación no es la primera necesidad. Revisar si el orden del checklist es correcto.
- **`no-entiendo` alto** → Los pasos no son suficientemente claros. Mejorar copy o añadir tooltips.

## Limitaciones

- `pmf.onboarding.viewed/step.clicked/completed` están definidos pero no están cableados todavía en ningún componente. Son el siguiente paso natural.
- El conteo de fricciones es por evento (fila), no por org única. Una misma org podría registrar varias fricciones.

## Próximos pasos (PMF6)

- Cablear `pmf.onboarding.viewed` al montar el `OnboardingChecklist` (requiere Server Component → Client boundary).
- Cablear `pmf.onboarding.step.clicked` al pulsar cada CTA del checklist.
- Añadir `pmf.onboarding.completed` cuando `doneCount === steps.length`.
- Desglose de fricciones por paso (metadata `stepId`) si se añade en `FrictionButton`.
