# ProTools Hub — Documentación Oficial

## Documento 03 — Base de Datos

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Archivo fuente:** `apps/web/prisma/schema.prisma`

---

## Tabla de Contenidos

1. [Resumen del Modelo de Datos](#1-resumen-del-modelo-de-datos)
2. [Diagrama ERD Completo](#2-diagrama-erd-completo)
3. [Enumeraciones Globales](#3-enumeraciones-globales)
4. [Dominio: Identidad y Organización](#4-dominio-identidad-y-organización)
5. [Dominio: Herramientas](#5-dominio-herramientas)
6. [Dominio: Ejecución IA](#6-dominio-ejecución-ia)
7. [Dominio: Workflow](#7-dominio-workflow)
8. [Dominio: Business Memory](#8-dominio-business-memory)
9. [Dominio: Business Copilot](#9-dominio-business-copilot)
10. [Dominio: Auditoría y Observabilidad](#10-dominio-auditoría-y-observabilidad)
11. [Índices y Rendimiento](#11-índices-y-rendimiento)
12. [Patrones de Query](#12-patrones-de-query)
13. [Convenciones del Schema](#13-convenciones-del-schema)

---

## 1. Resumen del Modelo de Datos

El schema de ProTools Hub contiene **25 modelos** organizados en **6 dominios funcionales**:

| Dominio | Modelos | Descripción |
|---|---|---|
| **Identidad** | Organization, User, Workspace, Client | Multi-tenant root |
| **Herramientas** | ToolDefinition, ToolInstance, ToolRecord, ToolFavorite, ToolRegistryMeta, ToolCapabilityProfile, ToolInstallationConfig | Ciclo de vida de una herramienta |
| **Ejecución IA** | ToolExecution, AIUsage, GenerationRequest, ImportSource, RegistrySearch | Rastro de cada llamada IA |
| **Workflow** | Workflow, WorkflowNode, WorkflowConnection, WorkflowVariable, WorkflowExecution, WorkflowNodeExecution, WorkflowExecutionLog | Orquestación |
| **Business Memory** | CompanyProfile, CompanyObjective, CompanyAsset, CompanyProcess, CompanyRisk, BusinessMemoryLog | Contexto empresarial |
| **Copilot** | CopilotConversation | Estado de conversación del copilot |
| **Auditoría** | AuditLog | Rastro inmutable de acciones |

**Motor:** PostgreSQL 16+  
**ORM:** Prisma 6.19.3  
**Estrategia de migración:** `prisma db push` (sin archivos de migración en el MVP)  
**Identificadores:** CUID (`@default(cuid())`) en todos los modelos

---

## 2. Diagrama ERD Completo

```mermaid
erDiagram
    Organization {
        string id PK
        string clerkOrgId UK
        string name
        string sector
        Plan plan
        datetime createdAt
    }
    
    User {
        string id PK
        string clerkId UK
        string email UK
        string name
        string orgId FK
        OrgRole role
        string emailType
        string trialPlan
        string locale
    }
    
    Workspace {
        string id PK
        string orgId FK
        string name
        string slug
    }
    
    Client {
        string id PK
        string workspaceId FK
        string name
        string email
        string sector
        boolean isArchived
    }
    
    ToolDefinition {
        string id PK
        string slug
        string name
        string description
        ToolCategory category
        Json schema
        boolean isPublic
        string orgId FK
        string createdBy FK
        string source
        ResourceStatus status
        int version
    }
    
    ToolInstance {
        string id PK
        string toolDefinitionId FK
        string workspaceId FK
        string clientId FK
        string name
        ToolInstanceStatus status
        boolean shareEnabled
        string shareToken UK
        string createdBy FK
    }
    
    ToolRecord {
        string id PK
        string toolInstanceId FK
        Json data
        boolean isDeleted
        string createdBy FK
    }
    
    ToolExecution {
        string id PK
        string toolInstanceId FK
        string workspaceId FK
        string userId FK
        ExecutionStatus status
        Json variables
        string model
        string provider
        string result
        int inputTokens
        int outputTokens
        float estimatedCostEUR
        int durationMs
    }
    
    ToolInstallationConfig {
        string id PK
        string toolInstanceId FK-UK
        string provider
        string model
        float temperature
        int maxTokens
        string language
        string outputFormat
    }
    
    ToolRegistryMeta {
        string id PK
        string toolDefinitionId FK-UK
        string displayCategory
        string icon
        string tier
        int installCount
        float rating
    }
    
    ToolCapabilityProfile {
        string id PK
        string toolDefinitionId FK-UK
        string businessDomain
        Json businessGoals
        Json inputTypes
        Json outputTypes
        Json dependencies
        Json relatedTools
    }
    
    Workflow {
        string id PK
        string workspaceId FK
        string name
        boolean isActive
        ResourceStatus status
        string createdBy FK
    }
    
    WorkflowNode {
        string id PK
        string workflowId FK
        string toolDefinitionId FK
        string label
        float positionX
        float positionY
        Json inputMapping
        int executionOrder
    }
    
    WorkflowExecution {
        string id PK
        string workflowId FK
        string workspaceId FK
        string userId FK
        ExecutionStatus status
        string finalOutput
        float totalCostEUR
    }
    
    CompanyProfile {
        string id PK
        string workspaceId FK-UK
        string companyName
        string sector
        string size
        float confidence
    }
    
    CopilotConversation {
        string id PK
        string workspaceId FK
        string userId FK
        string phase
        string rawInput
        Json intentResult
        Json rankedPlans
        int turnCount
    }
    
    AuditLog {
        string id PK
        string orgId FK
        string workspaceId
        string actorUserId FK
        string action
        string entityType
        string entityId
        string result
    }
    
    AIUsage {
        string id PK
        string userId FK
        string orgId
        string workspaceId
        string model
        int inputTokens
        int outputTokens
        float estimatedCostEUR
    }

    Organization ||--o{ User : "tiene"
    Organization ||--o{ Workspace : "contiene"
    Organization ||--o{ AuditLog : "registra"
    User }o--|| Organization : "pertenece a"
    Workspace }o--|| Organization : "pertenece a"
    Client }o--|| Workspace : "pertenece a"
    ToolDefinition }o--o| User : "creado por"
    ToolInstance }o--|| ToolDefinition : "instancia de"
    ToolInstance }o--|| Workspace : "en"
    ToolInstance }o--o| Client : "para"
    ToolRecord }o--|| ToolInstance : "en"
    ToolExecution }o--|| ToolInstance : "ejecuta"
    ToolInstallationConfig ||--|| ToolInstance : "configura"
    ToolRegistryMeta ||--|| ToolDefinition : "describe"
    ToolCapabilityProfile ||--|| ToolDefinition : "perfila"
    Workflow }o--|| Workspace : "en"
    WorkflowNode }o--|| Workflow : "paso de"
    WorkflowExecution }o--|| Workflow : "ejecución de"
    CompanyProfile ||--|| Workspace : "perfil de"
    CopilotConversation }o--|| Workspace : "en"
    AIUsage }o--|| User : "de"
```

---

## 3. Enumeraciones Globales

### Plan
```prisma
enum Plan {
  FREE
  PRO
}
```

### OrgRole
```prisma
enum OrgRole {
  OWNER    // Propietario — acceso total, puede eliminar la org
  ADMIN    // Administrador — gestiona equipo
  EDITOR   // Editor — crea/edita/elimina herramientas y workflows
  MEMBER   // Alias legacy de EDITOR — mismo nivel
  OPERATOR // Solo ejecuta herramientas y añade registros
  VIEWER   // Solo lectura
}
```

Jerarquía de permisos (mayor a menor): `OWNER > ADMIN > EDITOR = MEMBER > OPERATOR > VIEWER`

### ToolCategory
```prisma
enum ToolCategory {
  AUDIT | EVALUATION | CHECKLIST | CRM | REPORT | HR | OPERATIONS | FINANCE | CUSTOM
}
```

### ExecutionStatus
```prisma
enum ExecutionStatus {
  PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
}
```

### ResourceStatus
```prisma
enum ResourceStatus {
  DRAFT      // En elaboración — no visible
  PUBLISHED  // Activo
  ARCHIVED   // Solo lectura
}
```

### WorkflowNodeStatus
```prisma
enum WorkflowNodeStatus {
  IDLE | QUEUED | RUNNING | COMPLETED | FAILED | CANCELLED | SKIPPED
}
```

---

## 4. Dominio: Identidad y Organización

### Organization (organizations)

**Rol:** Raíz del modelo multi-tenant. Todo pertenece a una Organization.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `clerkOrgId` | String? | null si cuenta personal |
| `name` | String | Nombre de la organización |
| `sector` | String? | Sector empresarial |
| `plan` | Plan | FREE por defecto |

**Relaciones:** `users[]`, `workspaces[]`, `auditLogs[]`

**Índices:** `clerkOrgId` (UNIQUE)

---

### User (users)

**Rol:** Usuario sincronizado desde Clerk vía webhook (`/api/webhooks/clerk`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `clerkId` | String | UK — clave de Clerk |
| `email` | String | UK |
| `orgId` | String | FK → Organization |
| `role` | OrgRole | MEMBER por defecto |
| `emailType` | String | personal/business/disposable/unknown |
| `trialPlan` | String | trial_personal/trial_business/blocked |
| `locale` | String | en/es |

**Índices:** `[orgId]`

**Nota:** El `clerkId` es el puente entre Clerk y la base de datos propia. La función `requireUser()` busca por `clerkId`.

---

### Workspace (workspaces)

**Rol:** Agrupación de herramientas, clientes y workflows dentro de una organización.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `orgId` | String | FK → Organization |
| `name` | String | Nombre visible |
| `slug` | String | Identificador URL-safe |

**Relaciones:** `clients[]`, `toolInstances[]`, `workflows[]`, `companyProfile?`, `copilotConversations[]`

**Índices:** `[orgId]`, `UNIQUE [orgId, slug]`

---

### Client (clients)

**Rol:** Cliente o entidad a la que se presta servicio dentro de un workspace.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `workspaceId` | String | FK → Workspace |
| `name` | String | Nombre del cliente |
| `isArchived` | Boolean | Soft delete |

---

## 5. Dominio: Herramientas

### ToolDefinition (tool_definitions)

**Rol:** Plantilla reutilizable de una herramienta. Puede ser del sistema (official) o creada por el usuario.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `slug` | String | Identificador semántico. UK por `[slug, orgId]` |
| `name` | String | Nombre de la herramienta |
| `description` | String | Para el marketplace |
| `category` | ToolCategory | Clasificación |
| `schema` | Json | **ToolSchemaV1 completo** — validado antes de insertar |
| `isPublic` | Boolean | Visible en marketplace global |
| `orgId` | String? | null = herramienta del sistema (seed) |
| `createdBy` | String? | null = sistema |
| `source` | String | official/user_ai/import/community/partner/premium |
| `status` | ResourceStatus | PUBLISHED por defecto |
| `version` | Int | Versioning simple |

**Relaciones:** `toolInstances[]`, `registryMeta?`, `capabilityProfile?`, `favorites[]`, `workflowNodes[]`

**Regla crítica:** `schema` debe ser un JSON válido contra `ToolSchemaV1` antes de insertarse. El constraint es por código, no por DB.

---

### ToolInstance (tool_instances)

**Rol:** Instalación de una ToolDefinition en un workspace concreto, opcionalmente para un cliente.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `toolDefinitionId` | String | FK → ToolDefinition (Restrict — no se puede borrar si hay instancias) |
| `workspaceId` | String | FK → Workspace |
| `clientId` | String? | FK → Client (SetNull si cliente se elimina) |
| `name` | String | Puede diferir del nombre de la ToolDefinition |
| `status` | ToolInstanceStatus | ACTIVE/ARCHIVED |
| `shareEnabled` | Boolean | Permite compartir públicamente |
| `shareToken` | String? | Token único para compartir |

**Relaciones:** `toolRecords[]`, `toolExecutions[]`, `installationConfig?`

---

### ToolRecord (tool_records)

**Rol:** Un registro de datos creado en una ToolInstance. Almacena el mapa `fieldId → valor`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `toolInstanceId` | String | FK → ToolInstance (Cascade) |
| `data` | Json | `Record<fieldId, value>` del schema |
| `isDeleted` | Boolean | Soft delete |
| `deletedAt` | DateTime? | Timestamp de soft delete |

---

### ToolInstallationConfig (tool_installation_configs)

**Rol:** Configuración IA personalizada por instalación. 1:1 con ToolInstance.

| Campo | Tipo | Notas |
|---|---|---|
| `toolInstanceId` | String | FK-UK → ToolInstance |
| `provider` | String | anthropic/openai |
| `model` | String | claude-sonnet-4-6 por defecto |
| `temperature` | Float? | null = valor por defecto |
| `language` | String | es/en |
| `outputFormat` | String | markdown/plain/json |
| `systemPromptOverride` | String? | Override del system prompt |
| `customInstructions` | String? | Instrucciones adicionales |
| `defaultVariables` | Json | Pre-relleno de campos |

---

### ToolRegistryMeta (tool_registry_meta)

**Rol:** Metadatos de presentación del marketplace. Solo para herramientas `source='official'`.

| Campo | Tipo | Notas |
|---|---|---|
| `toolDefinitionId` | String | FK-UK → ToolDefinition |
| `displayCategory` | String | Categoría de presentación |
| `icon` | String | Emoji |
| `color` | String | Hex color del card |
| `tags` / `keywords` / `synonyms` | Json | Para búsqueda semántica |
| `complexity` | String | simple/intermediate/advanced |
| `estimatedMinutes` | Int | Tiempo estimado de uso |
| `tier` | String | official/community/partner/premium |
| `installCount` | Int | Popularidad |
| `rating` | Float? | Valoración media |

---

### ToolCapabilityProfile (tool_capability_profiles)

**Rol:** Perfil de inteligencia para los engines (Intent, Planning, Tool Intelligence). SOLID: separado de RegistryMeta.

| Campo | Tipo | Notas |
|---|---|---|
| `toolDefinitionId` | String | FK-UK → ToolDefinition |
| `businessDomain` | String | Dominio: marketing/hr/finance/it/quality/etc. |
| `businessGoals` | Json | `string[]` — objetivos que apoya |
| `useCases` | Json | `string[]` — casos de uso |
| `inputTypes` | Json | `IOType[]` — qué necesita |
| `outputTypes` | Json | `IOType[]` — qué genera |
| `requiredVariables` | Json | `string[]` |
| `recommendedModels` | Json | `string[]` — model IDs |
| `executionCostEUR` | Float | Coste estimado |
| `automationFriendly` | Boolean | Apto para workflows |
| `dependencies` | Json | `string[]` — slugs de herramientas previas |
| `relatedTools` | Json | `string[]` — herramientas relacionadas |
| `alternativeTools` | Json | `string[]` — alternativas |

---

## 6. Dominio: Ejecución IA

### ToolExecution (tool_executions)

**Rol:** Registro de cada llamada real a la IA para una herramienta. Incluye prompts, resultado, tokens y coste.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | CUID | PK |
| `toolInstanceId` | String | FK → ToolInstance |
| `workspaceId` | String | FK → Workspace |
| `userId` | String | FK → User |
| `status` | ExecutionStatus | PENDING → RUNNING → COMPLETED/FAILED |
| `variables` | Json | Inputs del usuario en esta ejecución |
| `model` | String | claude-sonnet-4-6 por defecto |
| `provider` | String | anthropic por defecto |
| `systemPrompt` | String? | Guardado para auditoría |
| `userPrompt` | String? | Guardado para auditoría |
| `result` | String? | Texto/markdown generado |
| `inputTokens` | Int | Tokens de entrada |
| `outputTokens` | Int | Tokens de salida |
| `estimatedCostEUR` | Float | Coste estimado en EUR |
| `durationMs` | Int | Latencia total |

---

### AIUsage (ai_usage)

**Rol:** Registro granular de cada llamada a la API de IA. Permite rate limiting y análisis de costes.

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | String | FK → User |
| `orgId` | String | Para agrupar por org |
| `workspaceId` | String? | Para agrupar por workspace |
| `model` | String | Modelo usado |
| `inputTokens` / `outputTokens` / `totalTokens` | Int | Tokens |
| `estimatedCostEUR` | Float | Coste |
| `status` | String | success/error/rate_limited/timeout |

**Índices:** `[userId, createdAt]`, `[orgId, createdAt]`, `[workspaceId, createdAt]`

---

### GenerationRequest (generation_requests)

**Rol:** Historial de generaciones de herramientas en lenguaje natural.

| Campo | Tipo | Notas |
|---|---|---|
| `naturalLanguage` | String | Prompt del usuario |
| `generatedSchema` | Json? | ToolSchemaV1 generado |
| `accepted` | Boolean | Si el usuario lo instaló |
| `tokensUsed` / `durationMs` | Int? | Métricas |

---

### ImportSource (import_sources)

**Rol:** Trazabilidad de cada importación de archivo (CSV, Excel, PDF, DOCX, JSON).

| Campo | Tipo | Notas |
|---|---|---|
| `format` | String | csv/excel/pdf/docx/json |
| `originalName` | String | Nombre del archivo original |
| `fileSizeBytes` | Int | Tamaño |
| `confidence` | Float | Confianza del parser |
| `warnings` | Json | `string[]` de advertencias |

---

### RegistrySearch (registry_searches)

**Rol:** Métricas de búsqueda en el catálogo. Permite medir reutilización vs. generación IA.

| Campo | Tipo | Notas |
|---|---|---|
| `prompt` | String | Búsqueda del usuario |
| `resultsFound` | Int | Herramientas encontradas |
| `topScore` | Float | Puntuación del mejor resultado |
| `action` | String? | install/fork/generate/dismissed |

---

## 7. Dominio: Workflow

### Workflow (workflows)

**Rol:** Grafo de herramientas conectadas que se ejecutan en secuencia.

| Campo | Tipo | Notas |
|---|---|---|
| `workspaceId` | String | FK → Workspace |
| `isActive` | Boolean | Si está habilitado |
| `status` | ResourceStatus | DRAFT/PUBLISHED/ARCHIVED |
| `version` | Int | Versioning |
| `createdBy` | String | FK → User |

**Relaciones:** `nodes[]`, `connections[]`, `variables[]`, `executions[]`

---

### WorkflowNode (workflow_nodes)

**Rol:** Un nodo del grafo — referencia a una ToolDefinition con su configuración de ejecución.

| Campo | Tipo | Notas |
|---|---|---|
| `workflowId` | String | FK → Workflow |
| `toolDefinitionId` | String | FK → ToolDefinition |
| `label` | String | Nombre visible en el canvas |
| `positionX` / `positionY` | Float | Posición React Flow |
| `inputMapping` | Json | `Record<fieldId, "{{variables.x}}">` — interpolación de variables |
| `configOverride` | Json | Override de modelo/temperatura para este nodo |
| `executionOrder` | Int | Orden topológico calculado |

---

### WorkflowConnection (workflow_connections)

**Rol:** Arista dirigida entre dos nodos del workflow.

| Campo | Tipo | Notas |
|---|---|---|
| `workflowId` | String | FK → Workflow |
| `sourceNodeId` | String | FK → WorkflowNode |
| `targetNodeId` | String | FK → WorkflowNode |
| `sourceHandle` / `targetHandle` | String? | Handles React Flow |

**Constraint:** `UNIQUE [workflowId, sourceNodeId, targetNodeId]`

---

### WorkflowVariable (workflow_variables)

**Rol:** Variables globales del workflow, usadas en `inputMapping` de los nodos.

| Campo | Tipo | Notas |
|---|---|---|
| `key` | String | Nombre de la variable |
| `defaultValue` | String | Valor por defecto |
| `type` | String | string/number/boolean |

---

### WorkflowExecution (workflow_executions)

**Rol:** Registro de una ejecución completa del workflow.

| Campo | Tipo | Notas |
|---|---|---|
| `workflowId` | String | FK → Workflow |
| `status` | ExecutionStatus | |
| `variables` | Json | Snapshot de las variables en esta ejecución |
| `finalOutput` | String? | Output del último nodo o resumen |
| `totalCostEUR` | Float | Suma de costes de todos los nodos |
| `durationMs` | Int | Duración total |

**Relaciones:** `nodeExecutions[]`, `logs[]`

---

### WorkflowNodeExecution (workflow_node_executions)

**Rol:** Estado individual de cada nodo en una ejecución de workflow. Referencia a ToolExecution sin duplicar datos.

| Campo | Tipo | Notas |
|---|---|---|
| `workflowExecutionId` | String | FK → WorkflowExecution |
| `workflowNodeId` | String | FK → WorkflowNode |
| `toolExecutionId` | String? | FK-UK → ToolExecution (datos reales en ToolExecution) |
| `status` | WorkflowNodeStatus | IDLE → QUEUED → RUNNING → COMPLETED/FAILED |
| `resolvedInputs` | Json | Inputs tras resolver variables/outputs anteriores |
| `output` | String? | Output de este nodo |

---

## 8. Dominio: Business Memory

### CompanyProfile (company_profiles)

**Rol:** Perfil estructurado de la empresa. 1:1 con Workspace. Se actualiza automáticamente desde ejecuciones.

| Campo | Tipo | Notas |
|---|---|---|
| `workspaceId` | String | FK-UK → Workspace |
| `companyName` | String? | Nombre de la empresa |
| `sector` / `subsector` | String? | Sector económico |
| `country` / `city` | String? | Geografía |
| `size` | String | micro/small/medium/large/enterprise/unknown |
| `languages` / `markets` | Json | `string[]` |
| `services` / `products` | Json | `string[]` |
| `competitors` / `regulations` / `certifications` | Json | `string[]` |
| `softwareUsed` / `integrations` | Json | `string[]` |
| `digitalMaturity` | String | emerging/developing/advanced/leading |
| `departments` | Json | `string[]` |
| `confidence` | Float | 0.0-1.0 — nivel de conocimiento sobre la empresa |

**Relaciones:** `objectives[]`, `assets[]`, `processes[]`, `risks[]`, `memoryLogs[]`

---

### CompanyObjective (company_objectives)

| Campo | Tipo | Notas |
|---|---|---|
| `canonicalGoal` | String? | Slug del CanonicalGoal del Intent Engine |
| `label` | String | Descripción del objetivo |
| `status` | String | active/completed/paused/cancelled |
| `priority` | String | low/medium/high/critical |
| `progress` | Int | 0-100 |
| `linkedWorkflowId` | String? | Si tiene workflow asociado |

---

### CompanyAsset / CompanyProcess / CompanyRisk

Modelos de detalle del `CompanyProfile`:

| Modelo | Campos clave |
|---|---|
| `CompanyAsset` | `type` (web/erp/crm/...), `name`, `vendor`, `status` |
| `CompanyProcess` | `domain`, `name`, `maturity` (informal/documented/optimized/automated), `toolSlugs` |
| `CompanyRisk` | `domain`, `level` (low/medium/high/critical), `title`, `status` (open/mitigated/...), `source` |

---

### BusinessMemoryLog (business_memory_logs)

**Rol:** Log inmutable de cada cambio en el perfil de empresa. Permite trazabilidad de la evolución del conocimiento.

| Campo | Tipo | Notas |
|---|---|---|
| `field` | String | Campo de `CompanyProfile` que cambió |
| `oldValue` / `newValue` | Json | Valores antes/después |
| `source` | String | tool_execution/workflow/user/intent/system |
| `sourceId` | String? | ID de la ejecución que generó el cambio |
| `confidence` | Float | 0.0-1.0 de la fuente |

---

## 9. Dominio: Business Copilot

### CopilotConversation (copilot_conversations)

**Rol:** Estado serializado de una sesión del Business Copilot. Persiste entre peticiones HTTP.

| Campo | Tipo | Notas |
|---|---|---|
| `workspaceId` | String | FK → Workspace |
| `userId` | String | FK → User |
| `phase` | String | greeting/understanding/clarifying/planning/workflow_ready/done |
| `rawInput` | String? | Lo que escribió el usuario |
| `currentGoal` | String? | Objetivo extraído |
| `intentResult` | Json? | `IntentResult` serializado |
| `rankedPlans` | Json? | Array de `PlanSummary` (no los steps completos) |
| `selectedPlan` | Json? | Plan elegido por el usuario |
| `clarifyingQuestion` | String? | Pregunta actual |
| `collectedAnswers` | Json | `Record<string, string>` |
| `generatedWorkflowId` | String? | Workflow generado |
| `turnCount` | Int | Número de turnos |

---

## 10. Dominio: Auditoría y Observabilidad

### AuditLog (audit_logs)

**Rol:** Rastro inmutable de cada acción relevante en el sistema. Nunca se borra.

| Campo | Tipo | Notas |
|---|---|---|
| `orgId` | String | FK → Organization |
| `workspaceId` | String? | Si aplica |
| `actorUserId` | String? | FK → User (SetNull si se elimina) |
| `action` | String | `"tool.execute"`, `"workflow.create"`, etc. |
| `entityType` | String | `"tool_instance"`, `"workflow"`, `"record"` |
| `entityId` | String? | ID de la entidad |
| `result` | String | success/failure/denied |
| `metadata` | Json? | Datos adicionales (tokens, model, etc.) |
| `ipHint` / `userAgentHint` | String? | Para auditoría de seguridad |

**44 tipos de acción** definidos en `lib/audit.ts`:

```typescript
type AuditAction =
  | 'tool.view' | 'tool.install' | 'tool.uninstall' | 'tool.fork'
  | 'tool.generate' | 'tool.generate.fail' | 'tool.publish' | 'tool.archive'
  | 'tool.execute' | 'tool.execute.fail' | 'tool.execute.rate_limited'
  | 'tool.record.create' | 'tool.record.delete' | 'tool.record.view'
  | 'tool.share.enable' | 'tool.share.disable'
  | 'workflow.create' | 'workflow.update' | 'workflow.delete'
  | 'workflow.execute' | 'workflow.execute.fail'
  | 'workspace.create' | 'workspace.update' | 'workspace.delete'
  | 'workspace.member.invite' | 'workspace.member.remove'
  | 'client.create' | 'client.update' | 'client.archive'
  | 'import.start' | 'import.complete' | 'import.fail'
  | 'registry.search'
  | 'memory.profile.update' | 'memory.objective.create'
  | 'memory.asset.create' | 'memory.process.create' | 'memory.risk.create'
  | 'copilot.start' | 'copilot.message' | 'copilot.plan.select'
  | 'copilot.workflow.generate'
  | 'auth.denied' | 'permission.denied' | 'rate_limit.exceeded'
```

**Índices:** `[orgId, createdAt]`, `[workspaceId, createdAt]`, `[actorUserId, createdAt]`, `[action, createdAt]`, `[entityType, entityId]`

---

## 11. Índices y Rendimiento

### Índices de Lectura Frecuente

| Tabla | Índice | Query que sirve |
|---|---|---|
| `tool_executions` | `[toolInstanceId, createdAt]` | Historial de ejecuciones por instancia |
| `tool_executions` | `[workspaceId, createdAt]` | Analytics por workspace |
| `ai_usage` | `[userId, createdAt]` | Rate limiting por usuario |
| `ai_usage` | `[orgId, createdAt]` | Analytics de costes por org |
| `audit_logs` | `[orgId, createdAt]` | Timeline de auditoría |
| `audit_logs` | `[entityType, entityId]` | Historial de una entidad |
| `workflow_executions` | `[workflowId, createdAt]` | Historial de ejecuciones |
| `company_objectives` | `[workspaceId, status]` | Objetivos activos |
| `company_risks` | `[workspaceId, status]` | Riesgos abiertos |

### Índices de Unicidad Críticos

| Tabla | Constraint | Protege |
|---|---|---|
| `organizations` | `clerkOrgId UNIQUE` | Sincronización Clerk |
| `users` | `clerkId UNIQUE`, `email UNIQUE` | Login único |
| `workspaces` | `UNIQUE [orgId, slug]` | URLs de workspace únicos |
| `tool_instances` | `shareToken UNIQUE` | Tokens de compartir |
| `tool_registry_meta` | `toolDefinitionId UNIQUE` | 1:1 con ToolDefinition |
| `tool_capability_profiles` | `toolDefinitionId UNIQUE` | 1:1 con ToolDefinition |
| `tool_installation_configs` | `toolInstanceId UNIQUE` | 1:1 con ToolInstance |
| `company_profiles` | `workspaceId UNIQUE` | 1:1 con Workspace |

---

## 12. Patrones de Query

### Patrón 1: Cargar datos de workspace con filtro de tenant

```typescript
// SIEMPRE incluir orgId en queries de workspace
const workspace = await db.workspace.findFirst({
  where: {
    id: workspaceId,
    orgId: user.orgId,  // ← Filtro de tenant obligatorio
  },
})
```

### Patrón 2: Cargar ToolInstance con schema incluido

```typescript
const instance = await db.toolInstance.findFirst({
  where: { id: toolInstanceId, workspaceId },
  include: {
    toolDefinition: {
      select: { schema: true, name: true, category: true }
    },
    installationConfig: true,
  },
})
```

### Patrón 3: Analytics de ejecuciones por workspace

```typescript
const stats = await db.toolExecution.groupBy({
  by: ['status'],
  where: {
    workspaceId,
    createdAt: { gte: startDate },
  },
  _count: { id: true },
  _sum: { estimatedCostEUR: true },
})
```

### Patrón 4: Cargar BusinessContext completo

```typescript
const profile = await db.companyProfile.findUnique({
  where: { workspaceId },
  include: {
    objectives: { where: { status: 'active' } },
    risks: { where: { status: 'open' } },
    assets: { where: { status: 'active' } },
    processes: true,
  },
})
```

### Patrón 5: Registrar audit (fire-and-forget)

```typescript
// Nunca await — nunca bloquear el flujo principal
void db.auditLog.create({
  data: {
    orgId: user.orgId,
    actorUserId: user.id,
    action: 'tool.execute',
    entityType: 'tool_execution',
    entityId: executionId,
    result: 'success',
  },
})
```

---

## 13. Convenciones del Schema

### Nomenclatura

- **Modelos:** PascalCase (`ToolDefinition`, `CompanyProfile`)
- **Tablas:** snake_case plural (`tool_definitions`, `company_profiles`) — vía `@@map`
- **IDs:** CUID (`@id @default(cuid())`)
- **Timestamps:** `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- **Soft delete:** `isDeleted Boolean @default(false)` + `deletedAt DateTime?`

### Campos Json

Los campos `Json` almacenan:
- **Arrays simples:** `string[]`, `IOType[]`
- **Records:** `Record<string, string>` para `inputMapping`, `variables`
- **Objetos complejos:** `ToolSchemaV1`, `IntentResult`, `ExecutionPlan[]`

El tipo `Json` de Prisma mapea a `jsonb` en PostgreSQL.

### Cascades de Eliminación

| FK | OnDelete | Razón |
|---|---|---|
| `Workspace → Organization` | Cascade | Borrar org borra todo |
| `ToolInstance → Workspace` | Cascade | Borrar workspace borra instancias |
| `ToolRecord → ToolInstance` | Cascade | Los registros son de la instancia |
| `ToolInstance → ToolDefinition` | Restrict | No se puede borrar si hay instancias |
| `ToolExecution → User` | Restrict | Las ejecuciones son trazabilidad inmutable |
| `AuditLog → User` | SetNull | El log sobrevive al usuario |
| `AuditLog → Organization` | Cascade | Al borrar la org se borra todo |
