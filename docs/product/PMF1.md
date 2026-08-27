# PMF1 — Landing + Pricing + First Activation Path

**Fecha:** 2026-08-26
**Autor:** MITIKUS Product / CTO
**Estado:** Implementado

---

## 1. Qué se implementó

Este sprint no crea páginas nuevas — la landing y el pricing ya existían y estaban completos. Se refinaron los puntos concretos que bloqueaban la adquisición y la activación de autónomos/pymes:

### A. Landing pública (`apps/web/src/app/page.tsx`)

**Cambios:**
- Hero H1 actualizado: *"Tu negocio, clientes, facturas y memoria en un solo lugar."*
- Hero subtítulo actualizado: ahora menciona explícitamente autónomos y pymes, clientes, facturas y memoria de negocio.
- CTA secundario cambiado de "Ver qué incluye" (sin destino claro) a "Ver precios" (anchor `#precios`).
- Añadido caso de uso "Crear y enviar una factura" (n°05) antes de "Organizar documentación".
- ToolCard de Facturas actualizada con nota honesta: *"Facturación en preparación para Verifactu (AEAT)"*.
- Sección `<PricingSection />` tiene ahora `id="precios"` para que el CTA navegue correctamente.

**No se tocó:**
- Secciones de problema, equipo, beneficios, FAQ, footer, Arkos.
- Precios — ya correctos (Starter 39€, Professional 149€ como plan hero).
- Metadatos SEO — coherentes, no sobrescritos.

### B. Pricing público (`apps/web/src/app/_components/PricingSection.tsx`)

**Sin cambios.** Ya estaba correcto:
- Evaluación: 0€ (15 días)
- Autónomo: 29€/mes
- Starter: 39€/mes
- Professional: 149€/mes — marcado como "Más popular"
- Business: 349€/mes
- Enterprise: A medida

### C. First Activation Path — OnboardingChecklist

**Archivo:** `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/OnboardingChecklist.tsx`

**Cambios:**
- Añadida query `invoiceCount` (`db.invoice.count`) al bloque `Promise.all`.
- Reordenados los pasos para reflejar el camino hacia valor de un autónomo/pyme:
  1. **Configura los datos fiscales** — NIF + nombre empresa → `/settings`
  2. **Añade tu primer cliente** → `/clients/new`
  3. **Crea tu primera factura** → `/invoices`  *(nuevo paso)*
  4. Describe tu empresa a Arkos → `/copilot`
  5. Instala tu primera herramienta → `/tools`
  6. Ejecuta tu primera herramienta → `/tools/[id]/run`

El orden anterior ponía fiscal y cliente al final. Ahora están primeros porque son los bloqueadores reales para emitir la primera factura.

### D. FirstTimeExperience — copy genérico

**Archivo:** `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/FirstTimeExperience.tsx`

**Cambios (copy únicamente, sin tocar lógica):**
- PILLARS actualizados: Facturas, Clientes, Herramientas, Brain/Arkos (antes: Herramientas, Misiones, Clientes, Historial).
- Intro copy: *"Clientes, facturas, documentos, herramientas con IA y memoria de negocio — todo en un workspace privado."* (antes: "auditorías en procesos repetibles").
- Pregunta de empresa: *"¿A qué se dedica tu empresa?"* (antes: "tu consultora").

La lógica de selección de auditorías y misiones no se tocó.

### E. Onboarding page — copy genérico

**Archivo:** `apps/web/src/app/onboarding/page.tsx`

**Cambio:** subtítulo eliminaba "consultoría IT" hardcodeado. Ahora: *"Clientes, facturas, documentos y memoria de negocio — todo en un solo lugar."*

---

## 2. Copy comercial decidido

| Elemento | Texto |
|---|---|
| Hero H1 | "Tu negocio, clientes, facturas y memoria en un solo lugar." |
| Hero subtítulo | "La plataforma para autónomos y pymes que quieren gestionar clientes, emitir facturas, guardar documentos y consultar la memoria de su negocio — sin herramientas dispersas, con IA integrada." |
| CTA principal | "Empezar gratis — 15 días" → `/sign-up` |
| CTA secundario | "Ver precios" → `#precios` |
| Nota Verifactu | "Facturación en preparación para Verifactu (AEAT)" — honesta, sin afirmar cumplimiento |

---

## 3. Planes y precios mostrados

| Plan | Precio mensual | Anual | Para quién |
|---|---|---|---|
| Evaluación | Gratis | — | Prueba 15 días |
| Autónomo | 29€/mes | 26€ | 1 usuario, profesional solo |
| Starter | 39€/mes | 35€ | Hasta 2 usuarios |
| **Professional** | **149€/mes** | **134€** | **Hasta 15 usuarios — Hero** |
| Business | 349€/mes | 314€ | Hasta 50 usuarios |
| Enterprise | A medida | — | SSO, integraciones |

---

## 4. Ruta del usuario nuevo (First Activation Path)

```
Sign-up → onboarding/page.tsx → OnboardingWizard → workspace creado
  → /workspace/[id] (dashboard)
  → OnboardingChecklist visible:
      1. Configura NIF/nombre empresa → /settings
      2. Añade primer cliente → /clients/new
      3. Crea primera factura → /invoices (modal "Nueva factura")
      4. Describe empresa a Arkos → /copilot
      5. Instala primera herramienta → /tools
      6. Ejecuta herramienta → /tools/[id]/run
```

El checklist desaparece cuando todos los pasos están completos. Cada paso tiene CTA directo con href. El paso activo (primero sin completar) se resalta visualmente.

---

## 5. Qué NO se promete todavía

- ❌ Cumplimiento Verifactu completo — solo "en preparación"
- ❌ Firma OTP como feature de facturación (es feature de contratos)
- ❌ Desktop/offline como opción actual
- ❌ App móvil
- ❌ Integración AEAT automatizada
- ❌ Importación de facturas externas

---

## 6. Próximos tickets recomendados

### PMF2 — Primer flujo de conversión medible

Añadir analytics mínimos (Plausible o similar, sin cookies) para saber:
- Cuántos visitantes llegan a la landing
- Cuántos hacen clic en "Empezar gratis"
- Cuántos completan el onboarding
- Cuántos llegan a la primera factura

Sin esto, no podemos mejorar el embudo.

### PMF3 — Email de activación post-registro

Cuando el usuario crea su workspace pero no completa los 3 primeros pasos del checklist (fiscal, cliente, factura) en 48h, enviar email recordatorio con enlace directo al paso pendiente.

### PMF4 — Testimonios reales

La landing tiene secciones sólidas pero no hay testimonios reales aún. Cuando haya primeros usuarios, añadir 2-3 testimonios concretos con nombre, rol y resultado.

### LEGAL4 — AEAT webservice

Remisión real a AEAT (bloqueada hasta spec oficial ~mid-2026).

---

## 7. Referencias

| Archivo | Qué contiene |
|---|---|
| `apps/web/src/app/page.tsx` | Landing completa |
| `apps/web/src/app/_components/PricingSection.tsx` | Sección de precios |
| `apps/web/src/app/onboarding/page.tsx` | Página de onboarding |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/OnboardingChecklist.tsx` | Checklist de activación |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/FirstTimeExperience.tsx` | Primera experiencia (pantalla completa) |
| `docs/product/ARCH-DESKTOP1.md` | Arquitectura web-first |
| `docs/product/LEGAL1.md` | Estado Verifactu |
