# ProTools Hub — Documentación Oficial

## Documento 21 — Biblioteca Completa de Superprompts

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

## Tabla de Contenidos

1. [Qué es un Superprompt](#1-qué-es-un-superprompt)
2. [Superprompts de Arquitectura](#2-superprompts-de-arquitectura)
3. [Superprompts de Funcionalidad](#3-superprompts-de-funcionalidad)
4. [Superprompts de Refactoring](#4-superprompts-de-refactoring)
5. [Superprompts de QA y Testing](#5-superprompts-de-qa-y-testing)
6. [Superprompts de Documentación](#6-superprompts-de-documentación)
7. [Cómo Crear Nuevos Superprompts](#7-cómo-crear-nuevos-superprompts)

---

## 1. Qué es un Superprompt

Un **Superprompt** es una instrucción estructurada de alta densidad informativa diseñada para dirigir a un LLM asistente de código (como Claude Code) en tareas complejas de desarrollo.

En el contexto de ProTools Hub, los superprompts han sido la metodología principal de desarrollo. Cada sprint o bloque de trabajo se describe en un superprompt que contiene:

- **Contexto:** Estado actual del sistema
- **Objetivo:** Qué debe hacerse exactamente
- **Restricciones:** Qué NO debe tocarse
- **Criterios de éxito:** Cómo verificar que está correcto
- **Instrucciones de formato:** Cómo estructurar la respuesta

Esta biblioteca documenta los superprompts más significativos del desarrollo de ProTools Hub para referencia futura y para aplicar el patrón a nuevas fases.

---

## 2. Superprompts de Arquitectura

### SP-ARCH-001: Diseño del Modelo de Datos Multi-tenant

```
CONTEXTO:
Estoy diseñando una plataforma SaaS multi-tenant para automatización 
empresarial con IA. El stack es Next.js 15 + Prisma + PostgreSQL.

OBJETIVO:
Diseña el schema de Prisma para un sistema multi-tenant donde:
- Una Organization tiene múltiples Users y Workspaces
- Un Workspace tiene Clientes, ToolInstances y Workflows  
- Las herramientas tienen una Definition (plantilla) y una Instance (instalación)
- Cada ejecución de IA debe tener trazabilidad completa de tokens y coste
- El Audit Log debe ser inmutable y nunca borrable en cascade desde un registro

RESTRICCIONES:
- Solo PostgreSQL — sin MongoDB
- CUID para todos los IDs
- Sin enums de Prisma donde un string enum sea más flexible
- El schema debe ser extensible para añadir Business Memory en el sprint 5

CRITERIOS DE ÉXITO:
- `npx prisma validate` sin errores
- Índices para todas las queries frecuentes (by orgId, by workspaceId, by createdAt)
- Cascade correcto: borrar Workspace borra todo su contenido
- ToolDefinition tiene Restrict (no se puede borrar si tiene instancias)
```

### SP-ARCH-002: Patrón Provider para Ejecución IA

```
CONTEXTO:
El Execution Engine de ProTools Hub debe soportar múltiples proveedores 
de IA (Anthropic, OpenAI) de forma intercambiable. El código consumidor
no debe cambiar al añadir un nuevo proveedor.

OBJETIVO:
Implementa el patrón Provider para el Execution Engine en TypeScript:
1. Interface AIProvider con método run()
2. AnthropicProvider implementando AIProvider
3. OpenAIProvider implementando AIProvider
4. Factory function getProvider(providerName: string): AIProvider
5. Función pública runToolExecution(input: ExecutionInput): Promise<ExecutionOutput>

RESTRICCIONES:
- Las API Keys NUNCA deben pasar como parámetros — solo desde process.env
- El engine NO conoce workspaces, usuarios ni base de datos
- Si hay error de API, el error debe propagarse con el mensaje original
- El engine SIEMPRE devuelve estimatedCostEUR aunque sea 0

CRITERIOS DE ÉXITO:
- `runToolExecution` funciona con provider='anthropic' y provider='openai'
- Añadir un nuevo provider solo requiere: nueva clase + case en getProvider()
- TypeScript sin errores
```

---

## 3. Superprompts de Funcionalidad

### SP-FEAT-001: Intent Engine con 37 CanonicalGoals

```
CONTEXTO:
ProTools Hub tiene un Business Copilot que debe entender el objetivo 
empresarial del usuario en lenguaje natural. El engine NO debe usar LLM 
— debe ser un sistema de reglas basado en keywords.

OBJETIVO:
Implementa el Intent Engine completo:

1. Define 37 CanonicalGoals cubriendo estos dominios:
   - Marketing (6 goals): SEO, Social Media, Email, Brand, Ads, Market Research
   - Sales (4 goals): Lead Gen, Sales Process, CRM, Retention
   - HR (5 goals): Onboarding, Performance, Recruitment, Training, Compliance
   - Quality (4 goals): ISO 9001, Process Control, Supplier, Continuous Improvement
   - Compliance/Legal (4 goals): GDPR, Contracts, Regulatory Audit, Risk
   - Procurement (3 goals): Supplier RFP, PO Management, Supply Chain
   - Strategy (4 goals): Strategic Planning, Diagnosis, Business Model, Digital
   - IT (3 goals): Cybersecurity, IT Project, Software Selection
   - Finance/Admin (4 goals): Planning, Accounting, Investment, Admin

2. Cada goal tiene: slug, domain, keywords[], primaryTools[], requiredEntities[]

3. Algoritmo de análisis:
   - Normalizar input (lowercase, sin tildes, sin stopwords)
   - Score por coincidencia de keywords (bigramas valen doble)
   - Confidence: high (≥3), medium (≥1), low (0)
   - Si low → needsClarification=true + suggestedQuestion

RESTRICCIONES:
- Sin LLM — solo reglas
- El BusinessContext (sector, regulations) debe poder añadir bonus de score
- Los tipos deben ser independientes de Prisma

CRITERIOS DE ÉXITO:
- "quiero preparar la certificación ISO 9001" → confidence: high, goal: iso9001_certification
- "mejorar" → confidence: low, needsClarification: true
- "reducir rotación de personal" → confidence: medium, goal: employee_onboarding o customer_retention
```

### SP-FEAT-002: Planning Engine con Scoring 6D

```
CONTEXTO:
Una vez el Intent Engine detecta el objetivo, el Planning Engine debe 
generar 3 planes alternativos y rankearlos. Los planes se muestran al 
usuario en el Business Copilot.

OBJETIVO:
Implementa el Planning Engine:

1. Tipos: ExecutionPlan, PlanPhase, PlanStep, PlanScore, PlanReasoning
2. buildCompletePlan(): todas las herramientas del goal + dependencias
3. buildFastPlan(): solo herramientas isRequired=true
4. buildEconomicPlan(): herramientas con menor executionCostEUR
5. PlanScore con 6 dimensiones (0-100 cada una):
   - feasibility: herramientas disponibles / requeridas
   - completeness: goals cubiertos / total del canonicalGoal
   - speed: relativo al plan más largo
   - cost: relativo al plan más caro  
   - businessFit: sector + regulations + objectives + maturity
   - riskAdjusted: overall * (1 - riskPenalty)
6. RankedPlanResult: 3 planes ordenados por score.riskAdjusted DESC

RESTRICCIONES:
- El plan completo tiene siempre isRecommended=true (el mejor score)
- Las fases son lógicas: setup → execution → review
- Los PlanStep.dependsOn se calculan desde ToolCapabilityProfile.dependencies
- WorkflowGenerator: convierte ExecutionPlan → GeneratedWorkflow con posiciones React Flow

CRITERIOS DE ÉXITO:
- Para goal iso9001_certification → 3 planes con 6/2/1 herramientas respectivamente
- Plan completo siempre tiene score overall > plan rápido
- WorkflowGenerator genera nodes con positionX = phaseOrder * 300
```

---

## 4. Superprompts de Refactoring

### SP-REFAC-001: RC-1A Layout Audit y Bugfix

```
PROTOOLS HUB RELEASE CANDIDATE 1 (RC-1A) — BUGFIX BLOCK 5
COPILOT · MARKETPLACE · DASHBOARD · RESPONSIVE

CONTEXTO DEL PROBLEMA:
El WorkspaceShell es el layout único para TODAS las páginas del workspace.
Provee: <TopBar>, <SideBar>, y <main> donde van los children.

REGLA CRÍTICA:
Las páginas dentro de /workspace/[workspaceId]/ NUNCA deben:
- Añadir su propio <header>
- Añadir su propio <main>
- Añadir su propio <nav>
Las páginas son el "children" de <main> — solo añaden contenido.

PATRÓN CORRECTO:
export default async function Page() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* contenido */}
    </div>
  )
}

ARCHIVOS A AUDITAR EN ESTE BLOQUE:
- copilot/page.tsx
- src/app/tools/page.tsx (STANDALONE — puede tener su propio layout)
- workflows/[workflowId]/page.tsx

INSTRUCCIONES:
1. Lee cada archivo
2. Verifica si viola el patrón
3. Si viola: corrígelo
4. Si no viola: documenta que está correcto
5. Ejecuta: npm run type-check → debe ser 0 errores

RESTRICCIONES:
- NO tocar lógica de negocio
- NO tocar Prisma
- NO tocar engines IA
- src/app/tools/page.tsx es STANDALONE — su <header> y <main> son CORRECTOS

FORMATO DE RESPUESTA:
Para cada archivo: [ARCHIVO] → [ESTADO] → [CAMBIO] (si aplica)
Al terminar: type-check resultado
```

---

## 5. Superprompts de QA y Testing

### SP-QA-001: QA Sentinel Multi-Agente

```
CONTEXTO:
ProTools Hub necesita un sistema de detección automática de bugs 
que se ejecute de forma independiente contra la aplicación.

OBJETIVO:
Diseña e implementa el QA Sentinel como un sistema multi-agente con 
TypeScript + Playwright:

10 agentes especializados:
1. AuthAgent — flujos de login/logout
2. ToolsAgent — marketplace e instalación
3. ExecutionAgent — ejecución IA y resultados
4. WorkflowAgent — creación y ejecución de workflows
5. MemoryAgent — Business Memory y Copilot
6. AuditAgent — rastro de auditoría
7. AnalyticsAgent — dashboards y métricas
8. ImportAgent — importación de archivos
9. PermissionAgent — control de roles
10. UIAgent — consistencia de UI

Orchestrator que coordina los 10 agentes y genera el reporte.

RESTRICCIONES CRÍTICAS:
- Modo READ-ONLY para producción
- Nunca modificar datos sin QA_DRY_RUN=false
- El sistema está en C:\Users\priet\flexidrop-qa-sentinel\
- NO modificar ProTools Hub — el QA Sentinel es un proyecto separado

CRITERIOS DE ÉXITO:
- npm run qa:all ejecuta todos los agentes
- Cada agente genera un AgentResult con status: pass|fail|skip
- Orchestrator genera reporte consolidado en HTML
```

---

## 6. Superprompts de Documentación

### SP-DOC-001: Documentación Suite Oficial

```
SUPERPROMPT — PROTOOLS HUB OFFICIAL DOCUMENTATION SUITE

OBJETIVO:
Genera la documentación técnica oficial completa de ProTools Hub.
Calidad: Microsoft/Stripe/Atlassian/GitHub/Notion.

AUDIENCIA: desarrolladores, arquitectos, futuros empleados, colaboradores, 
enterprise clients, auditores, inversores.

FORMATO:
- Markdown en /docs (25 documentos)
- Word (.docx) en /documentation/docx (generados desde Markdown con pandoc/python)

DOCUMENTOS (25):
00 — Introducción y Guía de Lectura
01 — Visión del Producto
02 — Arquitectura General
03 — Base de Datos
04 — Workspace
05 — Marketplace
06 — Tool Intelligence
07 — Execution Engine
08 — Intent Engine
09 — Planning Engine
10 — Workflow Engine
11 — Business Memory
12 — Business Copilot
13 — Analytics + Audit
14 — Organization
15 — Seguridad
16 — Billing
17 — Decision Engine [DISEÑO]
18 — AI Router [DISEÑO]
19 — QA Sentinel
20 — Historia Completa del Desarrollo
21 — Biblioteca Completa de Superprompts [este documento]
22 — Manual del Administrador
23 — Manual del Desarrollador
24 — API Reference
25 — Changelog Oficial

RESTRICCIONES:
- No inventar — solo documentar lo que existe en el código
- [DISEÑO — No implementado] para documentos de diseño futuro
- Diagramas Mermaid en: Arquitectura, DB, Flujos, Engines, Workflows
- NO detenerse tras el índice — desarrollar cada documento completo

INSTRUCCIÓN CRÍTICA:
No detengas el trabajo tras generar un índice.
Continúa desarrollando cada documento hasta completarlo.
```

---

## 7. Cómo Crear Nuevos Superprompts

Para crear un superprompt efectivo para ProTools Hub:

### Plantilla Base

```
PROTOOLS HUB — [TIPO]: [NOMBRE DEL SUPERPROMPT]

CONTEXTO:
[Estado actual del sistema relevante para la tarea]
[Qué existe ya y cómo funciona]
[Por qué es necesaria esta tarea]

OBJETIVO:
[Descripción precisa de qué debe implementarse/cambiarse]
[Estructura de la implementación si es compleja]
[Puntos críticos de diseño]

RESTRICCIONES:
- [Qué NO puede tocarse]
- [Patrones obligatorios a seguir]
- [Dependencias o acoplamentos a evitar]

CRITERIOS DE ÉXITO:
- [Prueba específica 1 que debe pasar]
- [Prueba específica 2]
- [Comando de verificación: npm run type-check, etc.]

FORMATO DE RESPUESTA:
[Cómo debe estructurarse la respuesta]
[Nivel de detalle esperado]
```

### Principios de un Buen Superprompt

1. **Contexto suficiente pero no excesivo:** El LLM necesita entender el sistema sin leer todo el código
2. **Objetivo sin ambigüedad:** Una tarea = un superprompt
3. **Restricciones explícitas:** "NO tocar X" es más efectivo que "respeta Y"
4. **Criterios verificables:** Las pruebas de éxito deben ser ejecutables
5. **Formato de respuesta:** Estructurar la salida esperada evita respuestas genéricas

### Anti-Patrones

- ❌ "Mejora el código" — demasiado vago
- ❌ "Implementa todo el sprint" — demasiado amplio
- ❌ Sin restricciones — el LLM puede cambiar lo que no debe
- ❌ Sin criterios de éxito — no hay forma de verificar la corrección
