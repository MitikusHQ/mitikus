# ADR-002: Production Readiness Audit — SP-ARCH-002

**Status:** Accepted  
**Date:** 2026-06-29  
**Context:** CTO Production Readiness Audit — SUPERPROMPT SP-ARCH-002 v1

---

## Context

Auditoría completa de preparación para beta privada. El ciclo SP-ARCH-001 corrigió issues de arquitectura y rendimiento. Este ciclo se enfoca en: seguridad de API routes, configuración de entorno, manejo de errores y observabilidad.

---

## Hallazgos y decisiones

### P-01 / P-02: IDOR en copilot/select-plan y copilot/suggestions

**Problema:** Ambas rutas usaban únicamente `auth()` sin cargar el usuario de BD ni verificar que `workspaceId` perteneciese al org del usuario. Un atacante autenticado con un workspaceId de otra organización podría acceder a sus sugerencias o seleccionar planes.

**Solución:** Mismo patrón que el resto de rutas: `db.user.findUnique({ clerkId })` → `db.workspace.findFirst({ id, orgId })` → try/catch.

**Impacto en contrato de API:** Ninguno. Misma respuesta; solo afecta a requests cross-tenant.

---

### P-03: IDOR en import/convert

**Problema:** La ruta `POST /api/import/convert` aceptaba `workspaceId` del body e inmediatamente llamaba a `checkAllLimits()` y luego a Anthropic. Sin validar que el workspace perteneciese al org del usuario.

**Solución:** Añadida query `db.workspace.findFirst({ id: workspaceId, orgId: user.orgId })` antes del rate limit check.

**Por qué antes del rate limit:** El ownership check debe ir primero. Fallar rápido en 404 es más correcto que fallar en 429 cuando el workspace no existe.

---

### P-04 / P-05 / P-06: Exposición de errores internos

**Problema:** Tres rutas exponían mensajes de excepción internos en respuestas 500:
- `import/convert`: mensaje de error de Anthropic SDK
- `plans/generate`: `errorMessage` de excepción de planning engine
- `intent/analyze`: mensaje de excepción del Intent Engine

Los mensajes internos pueden revelar rutas de archivo, versiones de librerías, detalles de configuración.

**Solución:** Reemplazados por mensajes genéricos en el cliente. Los detalles se logean en servidor.

**Estándar adoptado:** Toda respuesta 500 devuelve solo un mensaje genérico. Los detalles van al servidor (console.error o audit log).

---

### P-07 / P-08: .env.example duplicado e incompleto

**Problema:** El archivo `.env.example` tenía `ANTHROPIC_API_KEY` duplicada (líneas 21 y 30) con formatos distintos, y no documentaba `OPENAI_API_KEY`, `GEMINI_API_KEY`, `MAX_AI_OUTPUT_TOKENS` ni `MAX_AI_RETRIES` — todas usadas en código con defaults.

**Impedimento:** El hook `block-secrets.sh` bloquea escritura a `.env.example` (clasificado como fichero sensible aunque sea un ejemplo).

**Acciones manuales pendientes** — aplicar en el próximo acceso manual al archivo:

```diff
- # Claude API — https://console.anthropic.com
- ANTHROPIC_API_KEY="sk-ant-..."
- 
- # App
- NEXT_PUBLIC_APP_URL="http://localhost:3002"
- NODE_ENV="development"
- 
- 
- # ── Anthropic — IA de generación de herramientas ─────────────────────────────
- # Obtén tu clave en: https://console.anthropic.com → API Keys
- ANTHROPIC_API_KEY=
+ # ── IA — Providers ────────────────────────────────────────────────────────────
+ ANTHROPIC_API_KEY="sk-ant-..."   # https://console.anthropic.com → API Keys
+ OPENAI_API_KEY="sk-..."          # Opcional — habilita gpt-4o y gpt-4o-mini
+ GEMINI_API_KEY=""                # Opcional — habilita gemini-2.0-flash
+ 
+ # App
+ NEXT_PUBLIC_APP_URL="http://localhost:3002"
+ # NODE_ENV lo gestiona Next.js — no establecer en producción
```

Y añadir al final:
```bash
# Límites de tamaño de generación
MAX_AI_OUTPUT_TOKENS=2500
MAX_AI_RETRIES=1
```

---

### P-09: import/convert — inline db.aIUsage.create()

**Problema:** Post IMP-2 (SP-ARCH-001), `import/convert` seguía usando `db.aIUsage.create()` inline en lugar del helper centralizado `recordAIUsage()`.

**Solución:** Migrado a `recordAIUsage()`. Pattern consistente en todas las rutas IA.

---

## Hallazgos aceptados (no implementados)

### P-10: console.log en generate-tool

`generate-tool` usa `console.log` y `console.error` para logging de generaciones. En producción, estos logs van a stdout sin estructura. Aceptable para beta — Next.js/Vercel los captura. Un logger estructurado (pino, winston) es mejora futura.

### P-11: import/save sin workspace check

`import/save` no verifica workspaceId (el flujo de importación no envía workspaceId en save — la herramienta se crea en el org sin asignarse a workspace). El aislamiento multi-tenant se garantiza via `orgId`. No es IDOR porque no hay acceso a datos de otro org.

### P-12: NODE_ENV en .env.example

Documentado como deuda en P-07/P-08 para corrección manual.

### P-13: Sin /api/health endpoint

Endpoint de healthcheck para load balancer / deployment smoke test. RFC separado — requiere definir qué checks hacer (DB ping, env vars presentes, etc.).

### P-14: EUR_PER_USD hardcoded

Hardcoded a 0.93 en `ai-cost.ts`. Aceptable: es solo para estimaciones internas, no para facturación. Documentado con comentario en código.

### P-15: /shared/* como ruta pública

El middleware marca `/shared/(.*)` como pública. Debe mantenerse así si hay funcionalidad de compartir pública. Verificar que las rutas bajo `/shared` no exponen datos privados sin auth propio.

---

## Production Readiness Score (post-auditoría)

| Área | Score | Notas |
|------|-------|-------|
| Seguridad de rutas | 90/100 | Todas las rutas ahora con ownership check |
| Error handling | 85/100 | 0 errores internos expuestos tras P-04/05/06 |
| Rate limiting IA | 95/100 | 4 niveles: plan + user + workspace + global + coste |
| Webhooks | 90/100 | Clerk con firma SVIX; user.deleted anonimiza |
| Configuración | 70/100 | .env.example pendiente de corrección manual (P-07/P-08) |
| Observabilidad | 75/100 | Audit trail + AI usage; sin logs estructurados |
| Privacidad / GDPR | 85/100 | user.deleted anonimiza PII; audit trail preservado |
| Multi-tenancy | 95/100 | Todas las rutas con orgId filter post SP-ARCH-001+002 |

**Score global: 86/100**

---

## Recomendación

**Sí, con condiciones.**

ProTools Hub está técnicamente preparado para **beta privada** con las correcciones de este ciclo aplicadas (0 CRITICAL abiertos tras SP-ARCH-002).

**Condiciones antes de beta:**

1. Aplicar corrección manual de `.env.example` (P-07/P-08) — 10 minutos de trabajo
2. Verificar que `/shared/*` es intencional y no expone datos sin auth
3. Confirmar que `CLERK_WEBHOOK_SECRET` está configurado en el entorno de producción

**Para lanzamiento público (post-beta):**

- Añadir `/api/health` para monitoring
- Implementar logger estructurado (pino) para observabilidad en producción
- RFC para rate limiting en rutas no-IA (fork, search-similar, memory)
- Plan de backup y rollback documentado
