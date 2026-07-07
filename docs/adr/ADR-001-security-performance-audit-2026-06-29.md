# ADR-001: Security & Performance Audit Quick Wins

**Status:** Accepted  
**Date:** 2026-06-29  
**Context:** CTO Architecture Audit — SUPERPROMPT SP-ARCH-001 v1

---

## Context

Auditoría completa del codebase ProTools Hub identificó 6 Quick Wins (QW) y 2 Improvements (IMP) implementables sin cambios de arquitectura. Los cambios de arquitectura (N+1 en `workflow-engine` en escenarios extremos, falta de suite de tests) requieren RFC separado.

---

## Decisiones

### QW-1: Eliminar N+1 en workflow-engine

**Problema:** `executeWorkflow()` hacía una query `db.user.findUniqueOrThrow()` POR NODO para obtener `orgId`.  
**Solución:** Añadir `orgId: string` como parámetro a `executeWorkflow()`. El call site ya dispone de `user.orgId`.  
**Impacto:** Elimina N queries por ejecución (N = nodos activos). En workflows de 5 nodos: -5 queries a BD.

### QW-2: Colapsar doble update QUEUED→RUNNING

**Problema:** Dos escrituras secuenciales a BD en el bucle de nodos: primero `QUEUED`, luego `RUNNING`.  
**Solución:** Una sola escritura a `RUNNING` con `startedAt: new Date()`.  
**Impacto:** Elimina N writes por workflow (N = nodos). Semántica idéntica — `QUEUED` era estado transitorio invisible para el usuario.

### QW-3: Eliminar virtualInstanceCache del módulo

**Problema:** `const virtualInstanceCache = new Map()` en nivel de módulo no persiste entre invocaciones serverless.  
**Solución:** Eliminar el `Map`. `findFirst` + `create` de Prisma es idempotente y seguro bajo concurrencia.  
**Por qué no un cache alternativo:** Un cache en serverless requiere Redis u otro store externo, lo que es un cambio arquitectónico. La latencia adicional del `findFirst` (≈1-2ms en pg con índice) es aceptable.

### QW-4: Try/catch en copilot routes

**Problema:** `api/copilot/start` y `api/copilot/message` no tenían try/catch. Excepciones en `startCopilot()` / `sendMessage()` producían 500 sin body manejado por Next.js.  
**Solución:** Bloque try/catch con respuesta 500 genérica.

### QW-5: No exponer error interno en workflow execute

**Problema:** `return NextResponse.json({ error: errorMessage }, { status: 500 })` devolvía el mensaje de excepción interno al cliente.  
**Solución:** Mensaje genérico al cliente; el detalle queda en el historial de ejecución (WorkflowExecutionLog).

### QW-6: Handler user.deleted en webhook Clerk

**Problema:** El webhook de Clerk no procesaba `user.deleted`. Usuarios eliminados en Clerk quedaban con datos PII en BD.  
**Solución:** Anonimización en lugar de hard-delete para preservar audit trail y FK constraints:
- `email` → `deleted-<clerkId>@void.local`
- `name` → null
- `trialPlan` → `blocked` (impide nuevas ejecuciones IA)

**Por qué no hard-delete:** El modelo `User` tiene FKs con `onDelete: Restrict` en varios modelos (AuditLog, ToolExecution, etc.). Hard-delete requeriría cascade migration o limpieza previa, lo que es un cambio arquitectónico. La anonimización es compatible con GDPR (Art. 17 — derecho al olvido para datos identificativos).

### IMP-1: Tenant isolation en copilot routes

**Problema:** `api/copilot/start` y `api/copilot/message` usaban `auth()` sin verificar que el `workspaceId` perteneciera a la org del usuario. Vulnerabilidad IDOR: usuario A podría iniciar sesión copilot en workspace de usuario B si conoce el workspaceId.  
**Solución:** `db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })` antes de llamar al servicio.

### IMP-2: Centralizar recordAIUsage

**Problema:** `db.aIUsage.create()` duplicado inline en `execute-tool/route.ts` y `workflow-engine.ts`.  
**Solución:** Helper `recordAIUsage()` en `lib/ai-usage.ts` — fire-and-forget, nunca lanza.

---

## Cambios descartados (requieren RFC)

- **Cache distribuido para virtualInstance** — requiere Redis/Upstash
- **Suite de tests** — requiere diseño de fixtures, CI pipeline
- **PII masking en audit metadata** — requiere cambio de schema + migración
- **Rate limiting global (no-IA routes)** — requiere middleware

---

## Consecuencias

**Positive:**
- Reducción de queries en workflow execution (hasta N queries eliminadas por run)
- Eliminada vulnerabilidad IDOR en rutas copilot
- Datos PII de usuarios eliminados ya no persisten en claro
- Código de registro de IA centralizado, sin duplicación

**Negative / Trade-offs:**
- `executeWorkflow()` ahora requiere `orgId` explícito — los call sites futuros deben propagarlo
- Anonimización de `user.deleted` es irreversible (expected — es el comportamiento correcto)
