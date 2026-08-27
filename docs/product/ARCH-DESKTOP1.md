# ARCH-DESKTOP1 — Web-first Desktop Architecture

**Fecha:** 2026-08-26
**Autor:** MITIKUS Product / CTO
**Estado:** Documento de referencia — no implementa nada

---

## 1. Principio rector

> **MITIKUS Web en `mitikus.com` es el producto. MITIKUS Desktop es un envoltorio nativo de ese producto.**

No hay excepción a esta regla. Cualquier funcionalidad nueva se implementa primero en la web. Desktop hereda, no lidera.

---

## 2. Capas del producto

```
┌──────────────────────────────────────────────────────┐
│  MITIKUS Desktop (shell nativo — Tauri)              │
│  • WebView que carga mitikus.com                     │
│  • Bandeja del sistema, notificaciones nativas       │
│  • Auto-update, deep links, descarga/subida cómoda   │
└────────────────────────┬─────────────────────────────┘
                         │ HTTPS — mismo que el browser
┌────────────────────────▼─────────────────────────────┐
│  MITIKUS Web (mitikus.com) — Next.js 15 App Router   │
│  apps/web en protools-hub                            │
│  Producto principal. UI + Server Actions + API       │
└────────────────────────┬─────────────────────────────┘
                         │ Prisma
┌────────────────────────▼─────────────────────────────┐
│  MITIKUS Cloud — PostgreSQL en Railway               │
│  Fuente de verdad única. Usuarios, workspaces,       │
│  facturas, clientes, archivos, herramientas, Brain   │
└──────────────────────────────────────────────────────┘

Capa transversal (opcional, interna):
┌──────────────────────────────────────────────────────┐
│  MITIKUS AI Core                                     │
│  Motor Claude (Anthropic SDK) usado desde la web:   │
│  Brain, Arkos, generación de herramientas, ejecución │
│  NO es un producto visible. NO es fuente de verdad.  │
└──────────────────────────────────────────────────────┘
```

---

## 3. Qué vive en la web (fuente de verdad)

Todo lo que tiene estado o datos vive exclusivamente en `mitikus.com` + PostgreSQL:

| Dominio | Dónde | Notas |
|---|---|---|
| Usuarios y sesiones | Clerk + DB | Auth en Clerk, perfil en DB |
| Organizaciones y workspaces | DB | RBAC por workspace |
| Clientes | DB | |
| Facturas y trazabilidad Verifactu | DB | Hashes, QR, huella — solo en DB |
| Correo (envío y recepción) | Web + Resend | IMAP polling desde la web |
| Archivos | DB + storage | Subida y gestión en la web |
| Brain (memoria IA) | DB + Claude | FTS en PostgreSQL, consultas desde web |
| Arkos IA | Web | Planificación proactiva, solo web |
| Billing y suscripciones | Stripe + DB | Stripe webhook → DB |
| Permisos y RBAC | DB | Rol por workspace |
| Onboarding | Web | Flujo guiado web-first |
| Configuración fiscal (NIF, IBAN) | DB | CompanyProfile en PostgreSQL |
| Herramientas del catálogo y registros | DB | ToolInstance, ToolRecord |
| Historial de ejecuciones IA | DB | ToolExecution |

**Nada de esto se duplica en el cliente Desktop.**

---

## 4. Qué puede hacer Desktop (MVP)

Desktop es un wrapper delgado. Su responsabilidad es mejorar la experiencia de acceso, no añadir producto.

| Capacidad | Estado actual | Notas |
|---|---|---|
| Abrir `mitikus.com` en WebView nativo | Implementado (Tauri) | El WebView es idéntico a un navegador |
| Mantener sesión de Clerk | Implementado | Clerk gestiona cookies/tokens en el WebView |
| Bandeja del sistema (system tray) | Implementado | Icono + menú contextual |
| Notificaciones nativas del SO | Implementado | `desktop-bridge.ts` en la web envía al shell |
| Auto-update | Implementado | GitHub Releases + tauri-updater |
| Deep links (`mitikus://`) | Implementado | Para abrir secciones desde notificaciones |
| Token de licencia local | Implementado (servidor) | `POST /api/desktop/license-token`, JWT 30 días |
| Descarga/subida cómoda de archivos | Factible sin desarrollo extra | El WebView usa el sistema de archivos nativo |
| Integración Rust del token de licencia | **Pendiente** | Ver `DESKTOP_LICENSE.md` §Integración Rust |

---

## 5. Qué NO puede hacer Desktop en MVP

Estas restricciones son permanentes en MVP y requieren decisión explícita documentada para levantarse:

| Prohibición | Motivo |
|---|---|
| Lógica fiscal propia | Verifactu, hashes y cadena de integridad solo viven en el servidor |
| Base de datos local como fuente de verdad | PostgreSQL en Railway es la única fuente de verdad |
| Emitir facturas offline | La emisión requiere calcular `huellaAnterior` del último hash en DB — imposible sin red |
| Sincronización bidireccional de datos | No hay DB local que sincronizar |
| Publicar herramientas al catálogo | Acción de escritura que requiere servidor |
| Sustituir a la web | Desktop sin web no tiene producto |
| Usar MITIKUS AI Desktop Prototype como base | El prototipo es una exploración separada. Requiere decisión explícita de CTO antes de cualquier integración |
| Mantener memoria IA paralela | Brain vive en PostgreSQL. Desktop no tiene estado propio de IA |

---

## 6. Arquitectura de notificaciones (patrón actual)

El flujo correcto para notificaciones nativas es web → desktop, no desktop → web:

```
1. Evento ocurre en la web (factura pagada, solicitud aprobada, etc.)
2. Server Action o API route llama a desktop-bridge.ts
3. desktop-bridge.ts emite un custom event al WebView
4. El WebView (JavaScript de mitikus.com) lo recibe via window.addEventListener
5. El JavaScript llama a la Tauri API: window.__TAURI__.notification.sendNotification()
6. El SO muestra la notificación nativa
```

**El shell Tauri no tiene conocimiento del dominio de negocio.** Solo recibe el evento y lo muestra.

---

## 7. Fuente de verdad — regla de oro

```
Si dos lugares tienen el mismo dato, uno de ellos está mal.
El dato correcto es siempre el de PostgreSQL.
```

Consecuencias:
- El token de licencia local (DESKTOP_LICENSE) **no es fuente de verdad de la suscripción** — es una caché de 30 días para evitar llamadas en cada arranque. La fuente de verdad es Stripe + DB.
- El WebView no cachea datos de negocio localmente. Todo viene de `mitikus.com` en cada carga.
- Si el usuario edita algo en el navegador y abre Desktop, los datos son los mismos — porque ambos apuntan al mismo backend.

---

## 8. Estrategia de desarrollo en paralelo

### Regla de secuencia

```
Feature nueva → implementar en Web/API primero
             → Desktop lo usa automáticamente (es el mismo WebView)
             → No hay trabajo de Desktop salvo notificaciones nativas
```

### División de trabajo

| Línea de trabajo | Responsable | Dependencias |
|---|---|---|
| PMF web (facturación legal, onboarding, adquisición) | Web team | Ninguna |
| Desktop shell (notificaciones, auto-update, tray) | Desktop team | Web funcionando |
| Integración Rust del token de licencia | Desktop team | `DESKTOP_LICENSE.md` spec |
| Nuevas features de negocio | Web team siempre | Desktop las hereda automáticamente |

### Lo que NO requiere coordinación

- Cualquier cambio en la UI web: Desktop lo refleja en el siguiente arranque o recarga.
- Nuevas páginas, módulos o herramientas: disponibles en Desktop sin cambios.
- Actualizaciones de schema: transparentes para Desktop.

### Lo que SÍ requiere coordinación Web ↔ Desktop

- Nuevas notificaciones nativas: necesita un evento en `desktop-bridge.ts` + escucha en el shell Rust.
- Nuevos deep links (`mitikus://`): necesita registro en el shell Tauri.
- Cambios en el endpoint `/api/desktop/license-token`: el cliente Rust debe actualizarse en sincronía.

---

## 9. Flujo de publicación web

- MITIKUS Web se publica desde GitHub/Vercel. Claude Code puede implementar y verificar en local; el despliegue ocurre al hacer commit/push y merge según el flujo del repo.
- Desktop no publica la web ni contiene la web. Desktop solo abre `mitikus.com` o la URL configurada.
- La base de datos vive en Railway/PostgreSQL. Los archivos de usuario viven en el sistema de storage configurado, no dentro del desktop.
- No implementar lógica de despliegue en Desktop.
- No añadir scripts de deploy salvo instrucción explícita.

---

## 10. Criterios de entrada al sprint Desktop MVP completo

Desktop puede considerarse "terminado para producción" cuando se cumplan **todos**:

- [ ] Web tiene flujo mínimo vendible (login → workspace → factura emitida)
- [ ] Login con Clerk es estable en el WebView (sin loops de redirección)
- [ ] Facturación está legalmente etiquetada ("en proceso de adaptación Verifactu")
- [ ] Landing + pricing públicos existen en `mitikus.com`
- [ ] Integración Rust del token de licencia implementada y probada
- [ ] Página `/download` existe en `mitikus.com` con instaladores firmados
- [ ] Auto-update probado en Windows y Mac con un release real
- [ ] Decisión documentada de stack: Tauri (actual) vs Electron (alternativa descartada por tamaño)

---

## 11. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Duplicar lógica de negocio en Desktop | Alta (sin este doc) | Crítico | Este documento + revisión de PRs |
| Dos fuentes de verdad (DB local + PostgreSQL) | Media | Crítico | Regla de oro §7 — Desktop no tiene DB |
| Prometer offline antes de tener sync | Alta | Alto | Documentar explícitamente que Desktop requiere red |
| Confundir MITIKUS con MITIKUS AI Desktop Prototype | Alta | Medio | Sección §5 — prohibición explícita |
| Gastar tiempo en Desktop antes de PMF web | Alta | Alto | Criterios de entrada §9 — todos deben cumplirse |
| Token de licencia mal implementado en Rust | Media | Alto | Spec completa en `DESKTOP_LICENSE.md` |
| WebView con comportamiento diferente al browser | Baja | Medio | Test en WebView real antes de release |

---

## 12. Siguiente ticket recomendado después de ARCH-DESKTOP1

### Opción A — PMF1: Primer flujo vendible web ⭐ Recomendado

**Por qué es el siguiente:** La web no tiene landing ni pricing. Sin adquisición orgánica, Desktop no tiene mercado al que llegar. El PMF web es el desbloqueador de todo.

Alcance mínimo de PMF1:
- Landing pública en `mitikus.com` (quién, para qué, precio)
- Pricing page con los planes actuales
- CTA → sign-up → onboarding → primera factura en < 10 minutos
- Meta: un autónomo real puede descubrirlo, registrarse y emitir su primera factura sin ayuda

### Opción B — DESKTOP1: Integración Rust del token de licencia

**Por qué puede ser el siguiente:** La infraestructura del token (servidor) está completa. Solo falta el cliente Rust. Si hay capacidad Desktop disponible, puede avanzar en paralelo sin bloquear PMF web.

Alcance de DESKTOP1:
- Implementar `verify_token_locally()` en Rust según spec de `DESKTOP_LICENSE.md`
- Implementar `renew_token()` que llama a `/api/desktop/license-token`
- Pantalla nativa de bloqueo cuando el token expiró y no hay red
- Test en Windows (.exe) y Mac (.dmg)

### Opción C — LEGAL-FOLLOWUP: Facturación mínima para autónomo real

**Por qué puede ser el siguiente:** LEGAL1-3 y ARCH1 están completos. Queda validar que un autónomo real puede emitir una factura legal completa sin fricción: NIF configurado, serie correcta, PDF descargable, flujo sin errores.

---

## 13. Referencias

| Documento | Contenido |
|---|---|
| `docs/product/DESKTOP_LICENSE.md` | Spec completa del token de licencia local |
| `docs/product/LEGAL1.md` | Estado Verifactu y restricciones legales |
| `apps/web/src/lib/desktop/` | `desktop-bridge.ts` — eventos web → shell |
| `apps/web/src/app/api/desktop/` | Endpoints para la app Desktop |
| Memoria `project_mitikus_desktop` | Decisión de Tauri vs Electron (Tauri ganó) |
| Memoria `project_mitikus_brain` | Brain: motor IA interno, no expuesto a Desktop |
