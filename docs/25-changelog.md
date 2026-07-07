# ProTools Hub — Documentación Oficial

## Documento 25 — Changelog Oficial

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

Este changelog sigue el formato [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) y usa [Semantic Versioning](https://semver.org/).

---

## [0.5.6] — 2026-06-29 — Engineering Excellence Review (SP-ARCH-005)

### Fixed

- **ENG-BUG-1 — Inconsistencia de precios GPT-4o**: `providers.ts` mostraba en UI los precios pre-2024 de GPT-4o ($5.0/$15.0 por 1M tokens) mientras `ai-cost.ts` calculaba billing a los precios actuales ($2.5/$10.0). Los usuarios veían un coste estimado el doble del real. Corregido en `providers.ts`.

- **ENG-BUG-2 — Gemini sin coste en estimaciones**: `gemini-2.0-flash` no estaba en la tabla de precios de `ai-cost.ts`. Todas las ejecuciones Gemini mostraban €0.000 en analytics y bypass implícito del preflight cost check. Añadidas entradas de Gemini ($0.1/$0.4 por 1M tokens).

### Improved

- **ENG-3 — Niveles de log correctos en `/api/generate-tool`**: los `console.log` de la ruta de generación IA ahora usan el nivel semántico correcto: `console.info` para eventos operacionales (inicio y resultado), `console.debug` para estadísticas de intento (reduce ruido en producción), `console.warn` cuando la generación termina en error (ya existía `console.error` para el fallo de parse JSON).

### RFC (DO NOT TOUCH — documentado para próximo sprint)

- **ENG-RFC-1 — `console.log` en `intent-engine/service.ts:69`**: log de debug en motor de intención que vuelca el registro completo como JSON en cada análisis. Candidato a eliminar o mover a `console.debug`. Fuera de scope de este sprint (zona DO NOT TOUCH).

---

## [0.5.5] — 2026-06-29 — DevOps & Deployment Architecture (SP-ARCH-004)

### Added

- **H-01 — Endpoint `/api/health`**: nuevo endpoint público que verifica DB (SELECT 1 con latencia), configuración IA (ANTHROPIC_API_KEY) y auth (Clerk keys). Responde 200/503 con JSON estructurado. Configurable como healthcheck en Vercel y Railway.

- **CI-01 — GitHub Actions CI** (`.github/workflows/ci.yml`): pipeline automático en cada push/PR con tres jobs: `type-check`, `lint` y `build` (build solo en main/develop). Usa `concurrency` para cancelar runs en progreso.

- **CI-02 — `.nvmrc`**: versión de Node fijada a 20 (LTS) para consistencia entre local, CI y producción.

- **VCL-01 — `vercel.json`**: configuración de deploy para Turborepo monorepo en Vercel. `rootDirectory: "apps/web"`, build desde raíz del monorepo, `ignoreCommand` para saltarse builds sin cambios, región `mad1` (Madrid).

- **DOC-01 — `docs/deployment-handbook.md`**: Deployment Handbook completo. Cubre: arquitectura y costes por fase (beta/100/1000 usuarios), variables de entorno, setup de BD, deploy en Vercel y Railway, 3 checklists (local/staging/producción), backups, monitorización, seguridad operacional y troubleshooting.

### Fixed

- **BUILD-01 — `@protools/import-engine` no compilaba en producción**: el paquete usa `module: "NodeNext"` con extensiones `.js` en imports TypeScript. Añadidos `@protools/import-engine` a `transpilePackages` y `extensionAlias: { '.js': ['.ts', '.tsx', '.js'] }` en webpack. **El build de producción estaba roto antes de este fix.**

- **BUILD-02 — `parseRange` bloqueaba el build de Next.js 15**: `analytics.ts` tiene `'use server'` pero exportaba `parseRange` que es una función síncrona. Next.js 15 exige que todos los exports de archivos `'use server'` sean funciones async. Extraído a `src/lib/analytics-utils.ts`; re-exportado como type desde `analytics.ts` para backwards compat.

### Security

- **SEC-01 — Security headers HTTP en `next.config.ts`**: añadidos 5 headers a todas las rutas: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-DNS-Prefetch-Control: on`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.

### Middleware

- **MW-01 — `/api/health` añadido a `isPublicRoute`**: sin esto, Clerk redirigía el healthcheck a `/sign-in`.

### Deuda documentada (manual — hook bloquea .env.example)

- **ENV-01 / ENV-02 — `.env.example` requiere corrección manual**: eliminar `ANTHROPIC_API_KEY` duplicada, eliminar `NODE_ENV="development"`, añadir `CLERK_JWT_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `MAX_AI_OUTPUT_TOKENS`, `MAX_AI_RETRIES`. Ver `docs/adr/ADR-004`.

- **DB-01 — Migración baseline pendiente**: antes del primer deploy a producción ejecutar `npx prisma migrate dev --name init` y hacer commit del directorio `prisma/migrations/`.

### Verified

- `npm run type-check`: 0 errores TypeScript
- `next build`: build completo sin errores (primera vez que se valida el build de producción)

---

## [0.5.4] — 2026-06-29 — Performance & Scalability Audit (SP-ARCH-003)

### Performance

- **S-01 — Índice compuesto `(toolInstanceId, isDeleted)` + `(toolInstanceId, isDeleted, createdAt)` en `ToolRecord`**: cubre el 95% de las queries de listado de registros activos. Reemplaza dos índices simples separados.

- **S-02 — Índice compuesto `(workspaceId, status)` en `ToolInstance`**: cubre todas las queries de herramientas activas/archivadas por workspace.

- **S-03 — Índice compuesto `(workflowId, isDisabled, executionOrder)` en `WorkflowNode`**: cubre la carga ordenada de nodos activos en cada ejecución de workflow.

- **S-04 — Índice `(status, createdAt)` en `AIUsage`**: cubre `checkGlobalLimit()` y `checkDailyCostLimit()` que filtran sin user/workspace.

- **W-01 — log() fire-and-forget en workflow-engine**: eliminados ~10 roundtrips bloqueantes por ejecución de workflow. Los logs de observabilidad ya no bloquean la cadena de ejecución de nodos.

- **W-02 — createMany para inicialización de nodos IDLE**: N inserts secuenciales → 1 INSERT batch. Para un workflow de 10 nodos: 10 roundtrips → 1 roundtrip al inicio de ejecución.

- **W-03 — Paralelización update(RUNNING) + workflow load**: las dos queries iniciales de `executeWorkflow` ahora van en `Promise.all`. Eliminado `findUniqueOrThrow(execution)` redundante pasando `workflowId` y `variables` desde el call site.

- **W-04 — Pre-fetch de virtual instances antes del loop de nodos**: `getOrCreateVirtualInstance()` se llamaba por cada nodo (N DB calls). Reemplazado por 1 `findMany` batch antes del loop + `createManyAndReturn` para faltantes. Map de O(1) para lookup en loop.

- **AI-1 — Deduplicación de `startOfTodayUTC()` en rate-limit**: `checkAllLimits()` ahora computa la fecha una vez y la pasa a todos los checks del request.

### RFC generada

- **PERF-3 — Paralelización de nodos en Workflow Engine**: ver `docs/adr/ADR-003`. No implementada — requiere aprobación explícita, suite de tests de integración del engine y validación de casos de uso reales.

### Acción pendiente (manual — requiere acceso a BD)

- Ejecutar `npx prisma migrate dev --name perf-composite-indexes` para aplicar los 5 nuevos índices compuestos a la base de datos.

### Verified

- `npx prisma validate`: schema válido
- `npm run type-check`: 0 errores TypeScript

---

## [0.5.3] — 2026-06-29 — Production Readiness Audit (SP-ARCH-002)

### Security

- **P-01 — Anti-IDOR en `copilot/select-plan`**: añadidos DB user lookup + workspace ownership check + try/catch. Era posible seleccionar planes de conversaciones de otro org.

- **P-02 — Anti-IDOR en `copilot/suggestions`**: añadidos DB user lookup + workspace ownership check + try/catch. Era posible acceder a sugerencias de workspaces ajenos.

- **P-03 — Anti-IDOR en `import/convert`**: añadida verificación `workspace.findFirst({ orgId })` antes de procesar el documento con IA. El workspaceId del body ya no se acepta sin validar ownership.

- **P-04 — Error interno oculto en `import/convert`**: el mensaje de excepción de Anthropic/DB ya no se expone al cliente en 500. Se devuelve mensaje genérico.

- **P-05 — Error interno oculto en `plans/generate`**: `errorMessage` interno reemplazado por mensaje genérico en respuesta 500.

- **P-06 — Error interno oculto en `intent/analyze`**: mensaje de excepción del Intent Engine reemplazado por mensaje genérico en respuesta 500.

### Refactor

- **P-09 — `import/convert` migrado a `recordAIUsage()`**: eliminados dos bloques inline `db.aIUsage.create()` sustituidos por `recordAIUsage()` centralizado.

### Deuda documentada (manual — hook bloquea .env.example)

- **P-07 / P-08 — `.env.example` requiere corrección manual**: ver `docs/adr/ADR-002-production-readiness-audit-2026-06-29.md` sección "Acciones manuales pendientes".

### Verified

- `npm run type-check`: 0 errores TypeScript tras todos los cambios

---

## [0.5.2] — 2026-06-29 — CTO Architecture Audit: Security & Performance

### Security

- **IMP-1 — Anti-IDOR en Copilot routes** (`api/copilot/start`, `api/copilot/message`): añadida verificación de ownership de workspace antes de procesar peticiones. El workspaceId recibido del cliente ahora se valida contra `orgId` del usuario autenticado, eliminando la posibilidad de acceso cross-tenant.

- **QW-6 — Handler `user.deleted` en webhook de Clerk** (`api/webhooks/clerk`): las bajas de usuarios en Clerk ahora anonimizan el registro en BD (email → `deleted-<clerkId>@void.local`, name → null, trialPlan → `blocked`). Preserva el audit trail y las FK constraints sin requerir cambios de schema.

- **QW-5 — Error interno no expuesto en workflow execute** (`api/workflows/[workflowId]/execute`): el `errorMessage` interno ya no se devuelve al cliente en respuestas 500. Se sustituye por mensaje genérico; el detalle permanece en el historial de ejecución.

### Performance

- **QW-1 — Eliminado N+1 query en workflow-engine**: el `userId` se resolvía a `orgId` con una query extra POR NODO dentro del bucle de ejecución. Ahora `orgId` se pasa como parámetro a `executeWorkflow()`, eliminando hasta N queries por ejecución (donde N = número de nodos activos).

- **QW-2 — Colapsada doble actualización QUEUED→RUNNING** (`workflow-engine.ts`): dos escrituras secuenciales a BD (primero `QUEUED`, luego `RUNNING`) reducidas a una única escritura a `RUNNING`. La actualización a `QUEUED` era transitoria sin valor observable.

- **QW-3 — Eliminada `virtualInstanceCache` de módulo** (`workflow-engine.ts`): el `Map<string, string>` en nivel de módulo es infiable en entornos serverless donde las instancias no persisten entre requests. Eliminada. La función `getOrCreateVirtualInstance()` hace `findFirst` + `create` de forma idempotente, que es correcta bajo concurrencia.

### Refactor

- **IMP-2 — Centralizado registro de AIUsage** (`lib/ai-usage.ts`): creado helper `recordAIUsage()` que sustituye los dos bloques inline `db.aIUsage.create()` en `execute-tool/route.ts` y `workflow-engine.ts`. Fire-and-forget, nunca lanza, logging solo en dev.

- **QW-4 — Try/catch en copilot routes**: `api/copilot/start` y `api/copilot/message` ahora tienen bloque try/catch. Antes, cualquier excepción en `startCopilot()` o `sendMessage()` resultaba en un 500 sin cuerpo manejado por Next.js.

### Verified

- `npm run type-check`: 0 errores TypeScript tras todos los cambios

---

## [0.5.1] — 2026-06-29 — RC-1A Release

### Fixed

**Layout Consistency (RC-1A Bugfix Blocks 1-5)**

- `copilot/page.tsx`: Cambiado `<main className="lg:col-span-2">` a `<div className="lg:col-span-2">`. Los elementos `<main>` dentro del WorkspaceShell (que ya provee su propio `<main>`) causan HTML inválido y problemas de accesibilidad.
- Auditados 200+ archivos a lo largo de 5 bloques de bugfix. Solo 2 archivos requirieron corrección.
- Confirmado: `tools/page.tsx` (Marketplace) es standalone — su `<header>` y `<main>` son correctos e intencionales.

### Verified

- `npm run type-check`: 0 errores TypeScript tras todos los bloques
- Layout consistente en todas las páginas del workspace
- Patrón `max-w-Ncl mx-auto px-6 py-8` aplicado uniformemente

---

## [0.5.0] — 2026-06 — Sprint 5.1: Business Copilot UI

### Added

- **Business Copilot Interface** (`copilot/page.tsx` + `CopilotInterface.tsx`)
  - Máquina de estados visual: greeting → understanding → clarifying → planning → workflow_ready → done
  - Panel lateral con CompanyContextPanel, ObjectivesPanel y RisksPanel
  - Selección visual de planes con cards (completo/rápido/económico)
  
- **Copilot API Routes**
  - `POST /api/copilot/start` — Inicia conversación con BusinessContext
  - `POST /api/copilot/message` — Avanza la máquina de estados
  - `POST /api/copilot/select-plan` — Genera workflow desde plan seleccionado
  - `GET /api/copilot/suggestions` — Sugerencias basadas en Business Memory

- **WorkspaceShell** refactor completo
  - Layout único con sidebar, topbar y main
  - Consistencia garantizada en todas las subpáginas

---

## [0.4.0] — 2026-06 — Sprint 5: Intelligence Layer

### Added

**Business Memory Engine**
- `CompanyProfile` con perfil completo de empresa (30+ campos)
- `CompanyObjective`, `CompanyAsset`, `CompanyProcess`, `CompanyRisk`
- `BusinessMemoryLog` — trazabilidad inmutable de cambios
- `BusinessContext` — objeto agregado para los engines
- Sistema de confianza 0.0-1.0
- API Routes: `GET /api/memory/context`, `PATCH /api/memory/profile`, `POST /api/memory/objectives`

**Intent Engine**
- 37 CanonicalGoals en 9 dominios empresariales
- Análisis por keywords sin LLM (rápido y determinista)
- Scoring con confidence: high/medium/low
- Detección de necesidad de aclaración
- API Route: `POST /api/intent/analyze`

**Planning Engine**
- 3 estrategias: complete/fast/economic
- Scoring 6D: feasibility, completeness, speed, cost, businessFit, riskAdjusted
- WorkflowGenerator — conversión Plan → GeneratedWorkflow
- API Route: `POST /api/plans/generate`

**Tool Intelligence**
- `checkCompatibility()` — compatibilidad entre herramientas
- `getRecommendations()` — recomendaciones basadas en instalaciones
- `CapabilityGraph` — grafo en memoria de relaciones

**Registry Intelligence**
- `searchRegistry()` — búsqueda semántica multi-campo
- `findSimilar()` — herramientas similares por IOTypes y goals
- Métricas de búsqueda en `RegistrySearch`

### Changed

- `ToolCapabilityProfile` extendido con `businessGoals`, `inputTypes`, `outputTypes`, `qualityLevel`
- `CanonicalGoal` en `CompanyObjective.canonicalGoal` — vincula objetivos con el Intent Engine

---

## [0.3.0] — 2026-05 — Sprint 4: Workflow Engine

### Added

**Modelos de Workflow**
- `Workflow` — grafo dirigido de herramientas
- `WorkflowNode` — nodo del grafo (referencia a ToolDefinition)
- `WorkflowConnection` — arista dirigida entre nodos
- `WorkflowVariable` — variables globales del workflow
- `WorkflowExecution` — ejecución completa
- `WorkflowNodeExecution` — estado por nodo con FK a ToolExecution
- `WorkflowExecutionLog` — logs detallados

**Workflow Engine** (`lib/workflow-engine.ts`)
- Topological sort con Kahn's Algorithm
- Interpolación de variables `{{variables.x}}`, `{{nodes.y.output}}`
- Manejo de errores por nodo (FAILED/SKIPPED sin cancelar todo)
- `totalCostEUR` acumulado en WorkflowExecution

**UI**
- Editor visual React Flow (`/workspace/[id]/workflows/[workflowId]`)
- Canvas con drag & drop de herramientas
- Panel de configuración por nodo (inputMapping, configOverride)
- Panel de variables globales

**API Routes**
- `POST /api/workflows/[workflowId]/execute`
- `GET /api/workflows/[workflowId]/executions`

---

## [0.2.0] — 2026-04 — Sprint 3: Execution Engine + IA

### Added

**Execution Engine** (`lib/execution-engine.ts`)
- Provider pattern: `AIProvider` interface
- `AnthropicProvider` con Anthropic SDK
- `OpenAIProvider` con OpenAI SDK
- `runToolExecution()` — punto de entrada único
- `buildExecutionPrompts()` — construcción determinista de prompts

**Modelos de Ejecución**
- `ToolExecution` — registro de cada llamada IA con prompts almacenados
- `AIUsage` — tokens y coste por usuario/workspace/org
- `GenerationRequest` — historial de generaciones desde LN
- `ImportSource` — trazabilidad de importaciones
- `RegistrySearch` — métricas de búsqueda

**Rate Limiting** (`lib/ai-rate-limit.ts`)
- Límites por usuario/día, workspace/día, global/día, coste EUR/día
- `trialPlan`: trial_personal / trial_business / blocked
- Detección de tipo de email para asignación de plan

**AI Cost Estimator** (`lib/ai-cost.ts`)
- `estimateCostEUR(model, inputTokens, outputTokens)`
- Precios por modelo en EUR

**ToolInstallationConfig**
- Configuración IA por instalación (provider, model, temperature, language, outputFormat)
- `systemPromptOverride`, `customInstructions`

**Import Engine** (`packages/import-engine`)
- Parsers: CSV, Excel (.xlsx), PDF, DOCX, JSON
- `convertToToolSchema()` — conversión a ToolSchemaV1
- Campo `confidence` y `warnings[]`
- API Routes: `POST /api/import/convert`, `POST /api/import/save`

**API Routes**
- `POST /api/execute-tool`
- `POST /api/generate-tool`
- `POST /api/generate-tool/accept`

---

## [0.1.0] — 2026-03 — Sprint 2: Herramientas y Marketplace

### Added

**Modelos de Herramientas**
- `ToolDefinition` con `ToolSchemaV1` en campo `schema: Json`
- `ToolInstance` — instalación en workspace/cliente
- `ToolRecord` — registro de datos con soft delete
- `ToolFavorite` — persistido en DB
- `ToolRegistryMeta` — metadatos de marketplace
- `ToolCapabilityProfile` — metadatos de inteligencia

**Catálogo Oficial**
- 50+ herramientas en 8 dominios (quality, sales, marketing, hr, it, procurement, audit, consulting)
- Seed del catálogo con `prisma db seed`
- `source='official'` para distinción de herramientas del sistema

**Marketplace** (`/tools`)
- Página standalone con búsqueda semántica
- Filtros por categoría, tier, complejidad
- Instalación directa al workspace
- Fork de herramienta

**Client** — gestión de clientes por workspace

**API Routes**
- `POST /api/tools/install`
- `POST /api/tools/fork`
- `POST /api/tools/search-similar`

---

## [0.0.1] — 2026-02 — Sprint 1: Fundamentos

### Added

**Infraestructura**
- Turborepo con packages: `apps/web`, `packages/schema`, `packages/ui`, `packages/import-engine`
- Next.js 15 App Router configurado
- Prisma 6 con PostgreSQL
- Clerk v6 para autenticación multi-tenant

**Modelos Base**
- `Organization` — raíz multi-tenant con `clerkOrgId`
- `User` — sincronizado desde Clerk (clerkId, email, orgId, role)
- `Workspace` — agrupación de herramientas (orgId, name, slug)
- Enums: `OrgRole`, `Plan`, `ToolCategory`, `ExecutionStatus`, `ResourceStatus`

**Autenticación**
- Middleware Clerk con rutas públicas/privadas
- `requireUser()` — auth + DB lookup en una función
- `getOptionalUser()` — para rutas opcionales
- `requireRole(minRole)` — verificación de rol mínimo
- Webhook `/api/webhooks/clerk` con validación SVIX

**Autorización**
- `permissions.ts` con jerarquía OWNER > ADMIN > EDITOR > OPERATOR > VIEWER
- `can()`, `assertCan()`, `roleAtLeast()`

**i18n**
- Soporte es/en en middleware
- Detección de locale por cookie (no por Accept-Language)
- Banner de sugerencia de idioma no intrusivo

**Auditoría**
- `AuditLog` con 44 tipos de acción
- `audit()` fire-and-forget
- `auditDenied()` helper para accesos denegados

**Dashboard Layout**
- `(dashboard)/layout.tsx` — verificación de org
- `workspace/[workspaceId]/layout.tsx` — WorkspaceShell
- Onboarding (`/onboarding`) para nuevos usuarios
