# ProTools Hub — Documentación Oficial

## Documento 24 — API Reference

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Base URL:** `/api`

---

## Tabla de Contenidos

1. [Autenticación](#1-autenticación)
2. [Herramientas — Ejecución y Generación](#2-herramientas--ejecución-y-generación)
3. [Marketplace — Catálogo](#3-marketplace--catálogo)
4. [Business Copilot](#4-business-copilot)
5. [Business Memory](#5-business-memory)
6. [Intent Engine](#6-intent-engine)
7. [Planning Engine](#7-planning-engine)
8. [Workflows](#8-workflows)
9. [Importación](#9-importación)
10. [Webhooks](#10-webhooks)
11. [Respuestas de Error](#11-respuestas-de-error)

---

## 1. Autenticación

Todas las rutas API (excepto `/api/webhooks/**` y `/api/onboarding/**`) requieren autenticación con Clerk.

**Headers requeridos:**
```
Cookie: __session=<clerk_session_token>
```

Las peticiones sin sesión válida reciben `401 Unauthorized`.

**Respuesta de error de auth:**
```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

---

## 2. Herramientas — Ejecución y Generación

### POST /api/execute-tool

Ejecuta una herramienta con IA.

**Request:**
```typescript
{
  toolInstanceId: string,     // ID de la ToolInstance
  workspaceId:    string,     // ID del Workspace
  variables:      Record<string, unknown>  // Valores de los campos
}
```

**Response 200:**
```typescript
{
  executionId:      string,
  result:           string,   // Texto/markdown generado por la IA
  inputTokens:      number,
  outputTokens:     number,
  estimatedCostEUR: number,
  durationMs:       number,
  model:            string,
  provider:         string,
}
```

**Errores:**
- `400` — Variables inválidas o toolInstanceId no pertenece al workspace
- `404` — ToolInstance no encontrada
- `429` — Rate limit alcanzado
- `500` — Error de la API de IA (con `errorMessage`)

---

### POST /api/generate-tool

Genera una nueva herramienta desde lenguaje natural.

**Request:**
```typescript
{
  workspaceId:     string,
  naturalLanguage: string,    // Descripción de la herramienta
  category?:       ToolCategory
}
```

**Response 201:**
```typescript
{
  generationRequestId: string,
  schema:              ToolSchemaV1,  // Schema generado
  toolDefinitionId?:   string,        // Si se aceptó automáticamente
  tokensUsed:          number,
  durationMs:          number,
}
```

---

### POST /api/generate-tool/accept

Acepta un schema generado y crea la ToolDefinition.

**Request:**
```typescript
{
  generationRequestId: string,
  workspaceId:         string,
  name?:               string,  // Override del nombre generado
}
```

**Response 201:**
```typescript
{
  toolDefinitionId: string,
  toolInstanceId:   string,     // Instancia creada automáticamente
}
```

---

## 3. Marketplace — Catálogo

### POST /api/tools/install

Instala una herramienta en un workspace.

**Request:**
```typescript
{
  toolDefinitionId: string,
  workspaceId:      string,
  clientId?:        string,    // null = no asociado a cliente
  name?:            string,    // Override del nombre de la definición
}
```

**Response 201:**
```typescript
{
  toolInstanceId:   string,
  toolDefinitionId: string,
  workspaceId:      string,
}
```

---

### POST /api/tools/fork

Crea una copia editable de una herramienta del catálogo.

**Request:**
```typescript
{
  toolDefinitionId: string,
  workspaceId:      string,
}
```

**Response 201:**
```typescript
{
  toolDefinitionId: string,  // ID de la nueva definición (fork)
}
```

---

### POST /api/tools/search-similar

Busca herramientas similares a una dada.

**Request:**
```typescript
{
  toolDefinitionId: string,
  limit?:           number,   // Default: 5
}
```

**Response 200:**
```typescript
{
  similar: Array<{
    toolDefinitionId: string,
    name:             string,
    slug:             string,
    similarity:       number,  // 0.0-1.0
    reason:           string,
  }>
}
```

---

## 4. Business Copilot

### POST /api/copilot/start

Inicia una nueva conversación con el Copilot.

**Request:**
```typescript
{
  workspaceId: string
}
```

**Response 200 — CopilotResponse:**
```typescript
{
  conversationId: string,
  phase:          'greeting',
  message:        string,
  context:        BusinessContext,
  suggestions:    CopilotSuggestion[],
  plans:          [],
  selectedPlan:   null,
  workflowId:     null,
  question:       null,
  actions:        CopilotAction[],
  responseMs:     number,
}
```

---

### POST /api/copilot/message

Envía un mensaje en la conversación.

**Request:**
```typescript
{
  conversationId: string,
  workspaceId:    string,
  message:        string,
}
```

**Response 200 — CopilotResponse** (phase puede ser: understanding, clarifying, planning)

---

### POST /api/copilot/select-plan

Selecciona un plan de los propuestos.

**Request:**
```typescript
{
  conversationId: string,
  workspaceId:    string,
  planId:         string,
}
```

**Response 200 — CopilotResponse** (phase: workflow_ready, workflowId: string)

---

### GET /api/copilot/suggestions

Obtiene sugerencias rápidas sin iniciar conversación.

**Query params:** `workspaceId: string`

**Response 200:**
```typescript
{
  suggestions: CopilotSuggestion[]
}
```

---

## 5. Business Memory

### GET /api/memory/context

Devuelve el BusinessContext del workspace.

**Query params:** `workspaceId: string`

**Response 200:**
```typescript
{
  context: BusinessContext
}
```

---

### PATCH /api/memory/profile

Actualiza el perfil de empresa del workspace.

**Request:**
```typescript
{
  workspaceId: string,
  updates: {
    companyName?:    string,
    sector?:         string,
    country?:        string,
    size?:           CompanySize,
    regulations?:    string[],
    certifications?: string[],
    digitalMaturity?: DigitalMaturity,
    // ...más campos de CompanyProfile
  }
}
```

**Response 200:**
```typescript
{
  profile:    CompanyProfile,
  confidence: number,
}
```

---

### POST /api/memory/objectives

Crea un objetivo empresarial.

**Request:**
```typescript
{
  workspaceId: string,
  objective: {
    label:          string,
    description?:   string,
    priority:       ObjectivePriority,
    dueDate?:       string,          // ISO 8601
    canonicalGoal?: string,
  }
}
```

**Response 201:**
```typescript
{
  objective: CompanyObjectiveData
}
```

---

## 6. Intent Engine

### POST /api/intent/analyze

Analiza el texto del usuario y detecta el objetivo empresarial.

**Request:**
```typescript
{
  workspaceId:            string,
  input:                  string,
  includeBusinessContext?: boolean,  // Default: true
}
```

**Response 200:**
```typescript
{
  intentResult: IntentResult
}
```

Donde `IntentResult`:
```typescript
{
  canonicalGoal:       string,
  domain:              BusinessDomain,
  entities:            string[],
  constraints:         string[],
  primaryTools:        string[],
  confidence:          'high' | 'medium' | 'low',
  needsClarification:  boolean,
  suggestedQuestion:   string | null,
  rawInput:            string,
  normalizedInput:     string,
}
```

---

## 7. Planning Engine

### POST /api/plans/generate

Genera planes de ejecución para un objetivo.

**Request:**
```typescript
{
  workspaceId:             string,
  intentResult:            IntentResult,
  includeBusinessContext?: boolean,
}
```

**Response 200:**
```typescript
{
  plans:       ExecutionPlan[],   // 3 planes ordenados por score
  recommended: ExecutionPlan,     // plans[0]
  context:     BusinessContext,
}
```

---

## 8. Workflows

### POST /api/workflows/[workflowId]/execute

Ejecuta un workflow completo.

**Path params:** `workflowId: string`

**Request:**
```typescript
{
  workspaceId: string,
  variables:   Record<string, string>,  // Variables globales del workflow
}
```

**Response 200:**
```typescript
{
  executionId:   string,
  status:        'COMPLETED' | 'FAILED',
  finalOutput:   string,
  totalCostEUR:  number,
  durationMs:    number,
  nodeResults: Array<{
    nodeId:    string,
    label:     string,
    status:    WorkflowNodeStatus,
    output:    string,
    durationMs: number,
    costEUR:   number,
  }>
}
```

---

### GET /api/workflows/[workflowId]/executions

Lista el historial de ejecuciones de un workflow.

**Query params:**
- `workspaceId: string`
- `limit?: number` (Default: 20)
- `offset?: number`

**Response 200:**
```typescript
{
  executions: WorkflowExecution[],
  total:      number,
}
```

---

## 9. Importación

### POST /api/import/convert

Convierte un archivo a un ToolSchemaV1.

**Content-Type:** `multipart/form-data`

**Form data:**
```
file:        File      (CSV, Excel, PDF, DOCX, JSON)
workspaceId: string
```

**Response 200:**
```typescript
{
  schema:       ToolSchemaV1,
  confidence:   number,        // 0.0-1.0 — confianza del parser
  warnings:     string[],      // Advertencias del proceso
  format:       string,        // Formato detectado
}
```

---

### POST /api/import/save

Guarda un schema importado como ToolDefinition.

**Request:**
```typescript
{
  workspaceId: string,
  schema:      ToolSchemaV1,
  importSourceId: string,
}
```

**Response 201:**
```typescript
{
  toolDefinitionId: string,
  toolInstanceId:   string,
}
```

---

### GET /api/pdf/[recordId]

Genera un PDF del ToolRecord.

**Path params:** `recordId: string`

**Response:** `application/pdf`

---

## 10. Webhooks

### POST /api/webhooks/clerk

Webhook de sincronización de Clerk. **No requiere autenticación de usuario** — usa firma HMAC.

**Headers requeridos:**
```
svix-id:        <event-id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

**Eventos procesados:**
- `user.created` → INSERT User + Organization
- `user.updated` → UPDATE User
- `user.deleted` → Soft-delete User
- `organizationMembership.created` → UPDATE User.orgId + role
- `organizationMembership.updated` → UPDATE User.role
- `organizationMembership.deleted` → Gestión de expulsión

**Response 200:**
```json
{ "received": true }
```

---

## 11. Respuestas de Error

### Formato Estándar

```typescript
{
  error:   string,    // Descripción del error
  code?:   string,    // Código interno del error
  details?: unknown,  // Detalles adicionales (solo en dev)
}
```

### Códigos HTTP

| Código | Descripción | Cuándo |
|---|---|---|
| `200` | OK | Respuesta exitosa |
| `201` | Created | Recurso creado |
| `400` | Bad Request | Input inválido |
| `401` | Unauthorized | Sin sesión de Clerk |
| `403` | Forbidden | Sin permisos (role insuficiente) |
| `404` | Not Found | Recurso no existe o no pertenece al tenant |
| `429` | Too Many Requests | Rate limit alcanzado |
| `500` | Internal Server Error | Error inesperado del servidor |

### Errores Específicos

| Code | Significado |
|---|---|
| `AUTH_REQUIRED` | No hay sesión activa |
| `PERMISSION_DENIED` | Rol insuficiente para la acción |
| `RATE_LIMIT_USER` | Límite de usuario/día alcanzado |
| `RATE_LIMIT_WORKSPACE` | Límite de workspace/día alcanzado |
| `RATE_LIMIT_GLOBAL` | Límite global de la plataforma |
| `RATE_LIMIT_COST` | Límite de coste EUR/día alcanzado |
| `TOOL_NOT_FOUND` | ToolInstance no existe en el workspace |
| `WORKSPACE_NOT_FOUND` | Workspace no existe o no es de esta org |
| `SCHEMA_INVALID` | ToolSchemaV1 no válido |
| `AI_ERROR` | Error de la API de IA |
| `AI_TIMEOUT` | Timeout de la API de IA |
