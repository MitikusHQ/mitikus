# ProTools Hub — Documentación Oficial

## Documento 20 — Historia Completa del Desarrollo

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

## Tabla de Contenidos

1. [Origen del Proyecto](#1-origen-del-proyecto)
2. [Sprint 1 — Fundamentos](#2-sprint-1--fundamentos)
3. [Sprint 2 — Herramientas y Marketplace](#3-sprint-2--herramientas-y-marketplace)
4. [Sprint 3 — Ejecución IA](#4-sprint-3--ejecución-ia)
5. [Sprint 4 — Workflow Engine](#5-sprint-4--workflow-engine)
6. [Sprint 5 — Intelligence Layer](#6-sprint-5--intelligence-layer)
7. [Sprint 5.1 — RC-1A Bugfix + Copilot UI](#7-sprint-51--rc-1a-bugfix--copilot-ui)
8. [Lecciones Aprendidas](#8-lecciones-aprendidas)
9. [Estado Actual](#9-estado-actual)

---

## 1. Origen del Proyecto

ProTools Hub nació de la observación de que las empresas pequeñas y medianas no podían acceder a las ventajas de la IA generativa de forma estructurada. Las herramientas existentes (ChatGPT, Claude, Gemini) ofrecían potencia pero sin estructura, sin persistencia, sin auditoría y sin integración con los procesos de negocio.

La hipótesis inicial: **"Si podemos crear una plataforma que genere herramientas de negocio a medida en segundos con IA, podemos democratizar el acceso a la automatización empresarial."**

El proyecto se desarrolló de forma iterativa, con sprints temáticos que añadían capas de inteligencia progresivamente.

---

## 2. Sprint 1 — Fundamentos

**Objetivo:** Establecer la infraestructura multi-tenant y el modelo de datos base.

**Componentes entregados:**

| Componente | Descripción |
|---|---|
| Next.js 15 App Router | Framework base con React Server Components |
| Turborepo | Configuración del monorepo con packages compartidos |
| Clerk v6 | Autenticación y gestión de organizaciones |
| Prisma + PostgreSQL | ORM y base de datos relacional |
| Organization + User | Modelo multi-tenant raíz |
| Workspace | Agrupación de herramientas por área |
| Middleware de Auth | Protección de rutas con Clerk |

**Decisiones arquitectónicas clave:**
- App Router sobre Pages Router (RSC + layouts anidados)
- Prisma `db push` sobre migrations (velocidad de iteración en MVP)
- Clerk sobre NextAuth (gestión de organizaciones incluida)
- CUID para todos los IDs (sortable, URL-safe, collision-resistant)

---

## 3. Sprint 2 — Herramientas y Marketplace

**Objetivo:** Crear el sistema de herramientas con catálogo oficial y marketplace.

**Componentes entregados:**

| Componente | Descripción |
|---|---|
| ToolDefinition | Schema + metadatos de herramienta |
| ToolInstance | Instalación de herramienta en workspace |
| ToolRecord | Registro de datos en una instancia |
| ToolSchemaV1 | Contrato de tipos en `@protools/schema` |
| Catálogo oficial | +50 herramientas en 8 dominios |
| ToolRegistryMeta | Metadatos de marketplace |
| ToolCapabilityProfile | Perfil de inteligencia de herramienta |
| Marketplace `/tools` | UI standalone del catálogo |
| ToolFavorite | Sistema de favoritos |
| Fork de herramienta | Copiar para personalizar |

**Aprendizajes:**
- La separación `ToolRegistryMeta` / `ToolCapabilityProfile` simplificó el Planning Engine posterior
- Almacenar el schema como `Json` en lugar de tablas relacionales fue la decisión correcta
- El catálogo como código TypeScript (no como CSV/Excel) facilitó el control de versiones

---

## 4. Sprint 3 — Ejecución IA

**Objetivo:** Conectar las herramientas con los proveedores de IA y registrar el coste.

**Componentes entregados:**

| Componente | Descripción |
|---|---|
| Execution Engine | `runToolExecution()` con provider pattern |
| AnthropicProvider | Integración con Anthropic SDK |
| OpenAIProvider | Integración con OpenAI SDK |
| ToolExecution | Registro de cada ejecución IA |
| AIUsage | Métricas de tokens y costes |
| GenerationRequest | Generación de herramientas con IA |
| Rate Limiting | Control de uso por usuario/workspace/global |
| Plan Limits | `trialPlan` por tipo de email |
| ToolInstallationConfig | Configuración IA por instalación |
| Import Engine | CSV, Excel, PDF, DOCX, JSON → ToolSchemaV1 |

**Aprendizajes:**
- El patrón Provider (`AIProvider` interface) fue crítico para extensibilidad
- Almacenar los prompts en `ToolExecution` (systemPrompt, userPrompt) fue clave para debugging
- El rate limiting basado en `AIUsage` es más preciso que contadores en memoria

---

## 5. Sprint 4 — Workflow Engine

**Objetivo:** Permitir la orquestación de múltiples herramientas en secuencia.

**Componentes entregados:**

| Componente | Descripción |
|---|---|
| Workflow | Modelo de grafo dirigido |
| WorkflowNode | Nodo = herramienta en el grafo |
| WorkflowConnection | Arista = dependencia entre nodos |
| WorkflowVariable | Variables globales del workflow |
| WorkflowExecution | Ejecución completa con estado |
| WorkflowNodeExecution | Estado por nodo con FK a ToolExecution |
| WorkflowExecutionLog | Logs detallados de cada step |
| Topological Sort | Ordenación Kahn's Algorithm |
| Variable Interpolation | `{{variables.x}}`, `{{nodes.y.output}}` |
| React Flow Canvas | Editor visual de workflows |
| WorkflowGenerator | Generación de workflows desde planes |

**Aprendizajes:**
- `WorkflowNodeExecution` referenciando `ToolExecution` (en lugar de duplicar datos) fue la decisión correcta
- El topological sort debe detectar ciclos y devolver error antes de ejecutar
- La interpolación `{{nodes.nodeId.output}}` es poderosa pero requiere validación en el editor

---

## 6. Sprint 5 — Intelligence Layer

**Objetivo:** Añadir los engines de inteligencia que hacen al sistema realmente "inteligente".

**Componentes entregados:**

### Business Memory Engine

| Componente | Descripción |
|---|---|
| CompanyProfile | Perfil persistente de la empresa |
| CompanyObjective | Objetivos empresariales |
| CompanyAsset | Activos tecnológicos |
| CompanyProcess | Procesos documentados |
| CompanyRisk | Riesgos detectados |
| BusinessMemoryLog | Trazabilidad de cambios en el perfil |
| BusinessContext | Objeto agregado para los engines |
| memory-reader.ts | `getBusinessContext()` |
| confidence-calculator.ts | Score de confianza 0.0-1.0 |

### Intent Engine

| Componente | Descripción |
|---|---|
| goals.ts | 37 CanonicalGoals en 9 dominios |
| normalizer.ts | Normalización de texto |
| scorer.ts | Scoring de goals por keywords |
| analyzer.ts | Análisis completo → IntentResult |

### Planning Engine

| Componente | Descripción |
|---|---|
| planner-types.ts | Tipos del sistema (ExecutionPlan, PlanScore, etc.) |
| plan-builder.ts | Construcción de 3 estrategias |
| plan-ranker.ts | Scoring 6D y ranking |
| workflow-generator.ts | Conversión Plan → GeneratedWorkflow |

### Tool Intelligence

- `compatibility.ts` — `checkCompatibility()` entre herramientas
- `recommendations.ts` — `getRecommendations()` basadas en herramientas instaladas
- `capability-graph.ts` — Grafo en memoria de relaciones entre herramientas

### Registry Intelligence

- `searcher.ts` — Búsqueda semántica multi-campo
- `ranker.ts` — Ranking por relevancia
- `similarity.ts` — `findSimilar()` basado en IOTypes y goals

**Aprendizajes:**
- El Intent Engine basado en reglas (sin LLM) es más rápido, determinista y predecible
- El scoring 6D del Planning Engine reveló trade-offs inesperados entre estrategias
- `BusinessContext.isEmpty` fue fundamental para el UX vacío del Copilot

---

## 7. Sprint 5.1 — RC-1A Bugfix + Copilot UI

**Objetivo:** Pulir la aplicación antes del Release Candidate y completar la UI del Copilot.

### RC-1A Bugfix Blocks

**Bloque 1 — Auth & Onboarding:**
- Verificación de flujos de onboarding
- Corrección de redirecciones post-login

**Bloque 2 — Tool Detail & Subpáginas:**
- Eliminación de layouts duplicados en subpáginas de herramientas
- Corrección de `<main>` anidados

**Bloque 3 — Workspace Layout General:**
- Verificación de `max-w-Ncl mx-auto px-6 py-8` en todas las páginas del workspace
- Corrección de páginas con `<header>` propios

**Bloque 4 — Analytics · Audit · IA Usage:**
- Auditoría completa sin cambios — todas las páginas ya estaban correctas
- Confirmación de consistencia de layout en 15 componentes

**Bloque 5 — Copilot · Marketplace · Dashboard:**
- Fix crítico: `copilot/page.tsx` usaba `<main className="lg:col-span-2">` dentro del WorkspaceShell
- Corrección: cambiado a `<div className="lg:col-span-2">`
- Verificación: `tools/page.tsx` confirmado como standalone correcto

### Business Copilot UI

- `CopilotInterface.tsx` — Client Component con máquina de estados visual
- `CompanyContextPanel` — Panel lateral con datos de la empresa
- `ObjectivesPanel` — Objetivos activos con barras de progreso
- `RisksPanel` — Riesgos críticos abiertos
- API Routes: `/api/copilot/start`, `/message`, `/select-plan`, `/suggestions`

**Resultado RC-1A:**
- 5 bloques de bugfix completados
- 2 archivos modificados en total (de 200+ auditados)
- 0 errores de TypeScript
- Layout consistente en toda la aplicación

---

## 8. Lecciones Aprendidas

### Arquitectura

1. **La separación de engines fue la decisión más importante.** Cada engine tiene una responsabilidad clara y no se acopla a los otros.

2. **El schema `ToolSchemaV1` como contrato central evitó docenas de bugs.** Todos los sistemas hablan el mismo lenguaje.

3. **El patrón fire-and-forget para el Audit Log eliminó latencia.** El audit nunca bloquea el flujo del usuario.

4. **`prisma db push` acelera el desarrollo pero añade riesgo en producción.** Evaluar migrations antes del lanzamiento.

### UI/UX

5. **WorkspaceShell único con páginas como children** fue la arquitectura correcta. Los intentos de añadir shells en páginas individuales generaron bugs de layout que tomó un sprint completo resolver.

6. **`BusinessContext.isEmpty` fue crítico.** El Copilot sin datos de empresa necesita un UX completamente diferente.

7. **El seletor de planes 3-estrategias** (completo, rápido, económico) resolvió la parálisis de decisión del usuario.

### IA

8. **El Intent Engine sin LLM es superior para casos estructurados.** Los 37 CanonicalGoals cubren el 90% de los casos de uso y son 100x más rápidos que una llamada LLM.

9. **Guardar los prompts en ToolExecution fue indispensable.** Permite debugging, re-ejecución y auditoría del contenido generado.

10. **El scoring 6D del Planning Engine reveló trade-offs no obvios** entre estrategias. El `businessFit` fue el score más difícil de calibrar.

---

## 9. Estado Actual

**Fecha:** 2026-06-29  
**Release:** RC-1A (Release Candidate 1A)  
**Estado:** Listo para beta pública

### Completado ✅

- Auth multi-tenant con Clerk
- Catálogo oficial de +50 herramientas
- Execution Engine con Anthropic + OpenAI
- Workflow Engine con editor visual React Flow
- Business Memory con perfil de empresa completo
- Intent Engine con 37 CanonicalGoals
- Planning Engine con scoring 6D
- Business Copilot con máquina de estados 6 fases
- Analytics, Audit y Usage dashboards
- Import Engine (CSV, Excel, PDF, DOCX, JSON)
- Layout consistente en toda la aplicación (RC-1A)

### En Roadmap 🔮

- Decision Engine (Fase 2)
- AI Router (Fase 2)
- Tool Compatibility Graph visual
- Business Memory auto-update desde ejecuciones
- API pública para integraciones externas
- Billing con Stripe
- SSO SAML (Enterprise)
