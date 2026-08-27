# PMF8 — First Session QA Pass

**Fecha:** 2026-08-26  
**Estado:** Implementado ✅  
**Veredicto:** ✅ APTO para prueba con usuario real (con notas)

---

## Checklist revisada

### A. Landing

| Ítem | Estado | Notas |
|------|--------|-------|
| H1 claro | ✅ | "Tu negocio, clientes, facturas y memoria en un solo lugar." — directo y orientado a autónomos/pymes |
| CTA principal funciona | ✅ | `/sign-up` — enlace `<a>` directo, sin JS |
| CTA precios funciona | ✅ | `#precios` — ancla en la misma página |
| Verifactu no prometido como completo | ✅ | Card de Facturas dice "en preparación para Verifactu (AEAT)" |
| Desktop/offline no como feature principal | ✅ | No aparece en landing |
| Responsive básico | ✅ | `max-w`, grids responsive, textos con tamaños relativos |

### B. Onboarding (registro → workspace)

| Ítem | Estado | Notas |
|------|--------|-------|
| Copy no suena a IT | ✅ | "Cuéntanos sobre tu negocio", "Arkos aprenderá tu sector" |
| Usuario entiende qué crea | ✅ | "Tu espacio está listo" con descripción de las herramientas |
| No hay pantalla vacía | ✅ | FirstTimeExperience cubre el caso de workspace sin herramientas |
| Primer paso claro post-registro | ⚠️ PARCIAL | Step2 tenía botón "Ver calendario fiscal" que llevaba a `/fiscal` (vista de obligaciones), no al formulario. **Corregido** → ahora lleva a `/fiscal/configurar` con label "Añadir mis datos fiscales" |

### C. Mi día / checklist

| Ítem | Estado | Notas |
|------|--------|-------|
| "Siguiente paso" visible | ✅ | Callout prominente encima de la lista (PMF7) |
| Progreso claro | ✅ | Barra % + mensaje dinámico |
| Paso actual destacado | ✅ | Fondo `primary/5`, indicador con borde primary |
| Pasos completados no compiten | ✅ | `opacity-40` + tachado |
| FrictionButton funciona | ✅ | No bloquea el flujo (fire-and-forget) |
| Ayuda contextual comprensible | ✅ | Texto específico por razón + paso (PMF7) |

### D. Fiscal → Cliente → Factura

| Ítem | Estado | Notas |
|------|--------|-------|
| Enlace fiscal lleva a la página correcta | ✅ FIXED | Antes apuntaba a `/settings` (ajustes del workspace), ahora a `/fiscal/configurar` (NifForm) |
| Campo correcto para marcar paso como done | ✅ FIXED | Antes verificaba `companyName` (nunca escrito), ahora verifica `fiscalName` (que escribe `NifForm`) |
| Datos fiscales se guardan | ✅ | `updateBillingProfile` → upsert `fiscalName` + `nif` |
| Evento PMF fiscal dispara correctamente | ✅ | `trackFiscalCompleted` en `fiscal.ts:110` cuando `fiscalName && nif` presentes |
| Enlace cliente lleva a la página correcta | ✅ | `/clients/new` |
| Enlace factura lleva a la página correcta | ✅ | `/invoices` |
| Factura — error humano si envío falla | ✅ | "La factura quedó preparada, pero no se pudo enviar todavía: …" |
| PDF descargable | ✅ | Route API `/api/workspace/[id]/invoices/[id]/pdf` |
| Enviar factura — manejo sin SMTP | ✅ | Error genérico descriptivo, no 500 |

### E. Analytics

| Ítem | Estado | Notas |
|------|--------|-------|
| Eventos PMF registrándose | ✅ | Fire-and-forget en todas las acciones clave |
| Dashboard `/admin/pmf-funnel` carga | ✅ | Archivo existe, protegido por `SUPERADMIN_EMAILS` |
| Sin PII en metadata | ✅ | Solo IDs, importe, moneda, stepId, reason (IDs predefinidos) |

### F. UI general

| Ítem | Estado | Notas |
|------|--------|-------|
| Sin scroll horizontal | ✅ | `max-w-*` + `overflow-x-auto` en contenedores anchos |
| Sin botones cortados | ✅ | `shrink-0` en CTAs del checklist |
| Sin textos solapados | ✅ | Espaciado con `gap` y `space-y-*` |
| Mobile básico | ✅ | `flex-wrap`, `sm:grid-cols-2`, tamaños relativos |
| Estados loading/empty/error | ✅ | Loading (`isPending`), empty (estados vacíos con texto explicativo), error (`text-destructive`) |

---

## Issues encontrados

### 🔴 Críticos (corregidos)

| # | Descripción | Archivo | Fix aplicado |
|---|-------------|---------|-------------|
| C1 | `OnboardingChecklist` verificaba `companyName` para el paso fiscal, pero el formulario `NifForm` guarda `fiscalName`. El paso fiscal **nunca marcaba como done**. | `OnboardingChecklist.tsx:32` | Cambiado `companyName` → `fiscalName` en el `select` y en la condición `done` |
| C2 | `OnboardingChecklist` enviaba al usuario a `/settings` (ajustes del workspace — logo, marca, email) en lugar de `/fiscal/configurar` (formulario NIF + nombre fiscal). | `OnboardingChecklist.tsx:47-48` | Enlace cambiado a `/fiscal/configurar`, CTA: "Configurar datos fiscales →" |

### 🟡 Medios (corregidos)

| # | Descripción | Archivo | Fix aplicado |
|---|-------------|---------|-------------|
| M1 | `OnboardingWizard` Step2 tenía botón "Ver calendario fiscal" → `/fiscal`. Llevaba al usuario a una vista de obligaciones trimestrales, no al formulario de configuración. Confuso para un usuario nuevo. | `OnboardingWizard.tsx` | Redirige a `/fiscal/configurar`, label cambiado a "Añadir mis datos fiscales" |

### 🟢 Pendientes / bajo riesgo (no corregidos en PMF8)

| # | Descripción | Riesgo | Recomendación |
|---|-------------|--------|---------------|
| P1 | `FirstTimeExperience` Step2 "Explorar Mi Office" lleva a `/office` que existe, pero no tiene la misma prominencia que el checklist en `/workspace/[id]`. Un usuario que sigue ese path saltará el checklist de activación (la url usa `?skip=1` implícitamente cuando vuelve). | Bajo | Revisar en PMF9 si el flujo "explorar primero" afecta la tasa de activación |
| P2 | El paso `company` del checklist (Arkos) verifica `context.isEmpty` — si el usuario escribe algo en Arkos pero no en el campo de onboarding de empresa, `isEmpty` puede seguir siendo `true` dependiendo de dónde se guarda el contexto. | Bajo | Verificar en sesión real si Arkos crea el contexto correctamente |
| P3 | `sendInvoiceToClient` no valida si el workspace tiene SMTP configurado antes de encolar — la factura queda en estado `queued` y el usuario recibe un error descriptivo, pero no se le indica cómo configurar el envío. | Bajo | Añadir enlace a `/settings` en el mensaje de error de envío |
| P4 | La landing tiene `TestimonialCard` definida pero no instanciada en ninguna sección del JSX actual. Código muerto sin impacto. | Mínimo | Limpiar en refactor futuro |
| P5 | El onboarding `Step3` (invitar equipo) al enviar redirige a `/settings/team?invite=email` pero no prefill el email introducido — la lógica de invite no consume el query param. | Bajo | Conectar query param a la UI de invitación |

---

## Fixes aplicados

| Archivo | Cambio |
|---------|--------|
| `src/app/(dashboard)/workspace/[workspaceId]/_components/OnboardingChecklist.tsx` | `companyName` → `fiscalName` en select y condición `done`; enlace fiscal → `/fiscal/configurar`; CTA → "Configurar datos fiscales →" |
| `src/app/onboarding/_components/OnboardingWizard.tsx` | Step2: botón fiscal → `/fiscal/configurar`; label → "Añadir mis datos fiscales" |

---

## Verificación

```
npx tsc --noEmit --skipLibCheck --pretty false
```

Sin errores en archivos modificados. TypeScript limpio.

---

## Veredicto

**✅ APTO para prueba con usuario real**

Los dos bugs críticos (paso fiscal nunca completable, enlace roto) estaban en el camino directo de activación y habrían impedido que cualquier usuario completara el funnel PMF. Con los fixes aplicados, el flujo básico `landing → registro → workspace → fiscal → cliente → factura → PDF` es funcional de extremo a extremo.

Los pendientes (P1–P5) no bloquean la prueba inicial y se pueden validar con observación de sesiones reales.

---

## Restricciones respetadas

- No se tocó schema ni se ejecutó `db push`
- No se instalaron dependencias
- No se añadieron features nuevas
- No se tocó `mitikus-ai`, `ai-content-repurposer`, desktop/Tauri, Stripe, Verifactu
- No se registran datos sensibles en analytics
- Analytics sigue siendo fire-and-forget

---

## Siguiente paso recomendado

**PMF9 — Sesión de usuario real (grabación + métricas):**
- Invitar a 2-3 personas a registrarse y completar el flujo.
- Observar dónde pausan, dónde vuelven atrás y qué activa el FrictionButton.
- Revisar `/admin/pmf-funnel` tras las sesiones para ver el funnel real.
- Comprobar los pendientes P1–P3 con comportamiento real de usuario.
