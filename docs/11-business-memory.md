# ProTools Hub — Documentación Oficial

## Documento 11 — Business Memory Engine

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Archivos fuente:** `apps/web/src/lib/business-memory/`

---

## Tabla de Contenidos

1. [Responsabilidad](#1-responsabilidad)
2. [Arquitectura de Archivos](#2-arquitectura-de-archivos)
3. [El BusinessContext](#3-el-businesscontext)
4. [CompanyProfile — El Perfil Central](#4-companyprofile--el-perfil-central)
5. [Objetivos, Activos, Procesos y Riesgos](#5-objetivos-activos-procesos-y-riesgos)
6. [BusinessMemoryLog — Trazabilidad del Conocimiento](#6-businessmemorylog--trazabilidad-del-conocimiento)
7. [Nivel de Confianza](#7-nivel-de-confianza)
8. [API Routes](#8-api-routes)
9. [Integración con Otros Engines](#9-integración-con-otros-engines)

---

## 1. Responsabilidad

El **Business Memory Engine** es el sistema de conocimiento estructurado sobre la empresa del workspace. Aprende de cada interacción, acumula contexto empresarial y provee ese contexto a todos los engines de IA.

**Analogía:** Es la "carpeta del cliente" de un consultor experimentado — contiene todo lo que el sistema sabe sobre la empresa: sector, tamaño, objetivos actuales, riesgos abiertos, activos tecnológicos y procesos documentados.

**Diferencia con el Copilot:** El Business Memory almacena datos persistentes sobre la empresa. El Copilot usa esos datos para razonar, pero es el motor conversacional, no el de almacenamiento.

---

## 2. Arquitectura de Archivos

```
lib/business-memory/
├── index.ts              ← API pública del módulo
├── memory-types.ts       ← Tipos TypeScript (sin dependencia de Prisma)
├── memory-reader.ts      ← getBusinessContext(), getMemorySummary()
├── memory-writer.ts      ← updateCompanyProfile(), addObjective(), etc.
├── memory-updater.ts     ← Actualización automática desde ejecuciones
├── memory-enricher.ts    ← Enriquecimiento con datos de herramientas
├── context-builder.ts    ← Construcción del BusinessContext agregado
├── confidence-calculator.ts ← Cálculo del nivel de confianza
├── objective-manager.ts  ← CRUD de objetivos
├── risk-manager.ts       ← CRUD y detección de riesgos
└── suggestion-engine.ts  ← Generación de sugerencias para el Copilot
```

---

## 3. El BusinessContext

El `BusinessContext` es el objeto agregado que consumen todos los engines. Se construye bajo demanda a partir de los datos del workspace:

```typescript
export interface BusinessContext {
  workspaceId:      string
  companyName:      string | null
  sector:           string | null
  country:          string | null
  website:          string | null
  size:             CompanySize         // micro|small|medium|large|enterprise|unknown
  languages:        string[]
  services:         string[]
  products:         string[]
  markets:          string[]
  competitors:      string[]
  regulations:      string[]
  certifications:   string[]
  softwareUsed:     string[]
  digitalMaturity:  DigitalMaturity     // emerging|developing|advanced|leading
  departments:      string[]
  activeObjectives: CompanyObjectiveData[]
  openRisks:        CompanyRiskData[]
  knownProcesses:   CompanyProcessData[]
  keyAssets:        CompanyAssetData[]
  confidence:       number              // 0.0-1.0
  lastUpdated:      string | null
  isEmpty:          boolean             // true si no hay datos aún
}
```

### getBusinessContext()

```typescript
// memory-reader.ts
export async function getBusinessContext(
  workspaceId: string
): Promise<BusinessContext>
```

Carga todos los datos del workspace en una sola operación:
1. Busca `CompanyProfile` del workspace
2. Si no existe, retorna `BusinessContext` vacío (`isEmpty: true`)
3. Si existe, carga relaciones: `objectives[]`, `assets[]`, `processes[]`, `risks[]`
4. Filtra: solo objetivos `active`, solo riesgos `open`, solo activos `active`
5. Calcula `confidence` con `calculateConfidence()`

---

## 4. CompanyProfile — El Perfil Central

El `CompanyProfile` es la entidad raíz del Business Memory. Existe exactamente uno por workspace (`1:1`).

### Campos Principales

| Campo | Tipo | Descripción |
|---|---|---|
| `companyName` | String? | Nombre de la empresa |
| `sector` / `subsector` | String? | Sector económico (tech, retail, educación...) |
| `country` / `city` | String? | Ubicación |
| `size` | CompanySize | Tamaño: micro/small/medium/large/enterprise |
| `languages` | String[] | Idiomas de la empresa |
| `markets` | String[] | Mercados donde opera |
| `services` / `products` | String[] | Oferta de la empresa |
| `customers` | String[] | Segmentos de clientes |
| `competitors` | String[] | Competidores conocidos |
| `regulations` | String[] | Normativas que aplican (ISO, RGPD...) |
| `certifications` | String[] | Certificaciones obtenidas |
| `softwareUsed` | String[] | Software y herramientas actuales |
| `integrations` | String[] | Integraciones activas |
| `digitalMaturity` | DigitalMaturity | Nivel de madurez digital |
| `departments` | String[] | Departamentos de la empresa |
| `confidence` | Float | 0.0-1.0 — nivel de conocimiento |

### Actualización del Perfil

```typescript
// memory-writer.ts
export async function updateCompanyProfile(
  workspaceId: string,
  update: CompanyProfileUpdate,
  event: MemoryUpdateEvent
): Promise<CompanyProfile>
```

Cada actualización:
1. Hace `upsert` del `CompanyProfile`
2. Crea un `BusinessMemoryLog` con el campo, valor anterior, valor nuevo, fuente y confianza
3. Recalcula el `confidence` del perfil

---

## 5. Objetivos, Activos, Procesos y Riesgos

### CompanyObjective

Los objetivos empresariales del workspace.

```typescript
export interface CompanyObjectiveData {
  id:               string
  canonicalGoal:    string | null  // Vinculado a un CanonicalGoal del Intent Engine
  label:            string
  description:      string | null
  status:           ObjectiveStatus  // active|completed|paused|cancelled
  priority:         ObjectivePriority // low|medium|high|critical
  progress:         number           // 0-100
  dueDate:          string | null
  linkedWorkflowId: string | null    // Workflow que implementa este objetivo
}
```

Los objetivos `active` con `priority: 'high' | 'critical'` alimentan directamente las sugerencias del Copilot.

---

### CompanyAsset

Activos tecnológicos y de negocio conocidos.

```typescript
export type AssetType = 'web' | 'erp' | 'crm' | 'software' | 'document' | 'equipment' | 'integration' | 'other'
```

Los assets `active` forman parte del `BusinessContext.keyAssets` y permiten al Planning Engine saber qué integraciones existen.

---

### CompanyProcess

Procesos de negocio documentados.

```typescript
export type ProcessMaturity = 'informal' | 'documented' | 'optimized' | 'automated'
```

El dominio del proceso (marketing, hr, quality...) permite al Intent Engine y Planning Engine contextualizar mejor las recomendaciones.

---

### CompanyRisk

Riesgos detectados en el negocio.

```typescript
export type RiskSource = 'manual' | 'tool_execution' | 'workflow' | 'system'
```

Los riesgos `open` con `level: 'high' | 'critical'` se muestran en el panel del Copilot y ajustan el scoring del Planning Engine.

**Detección automática de riesgos:** El sistema puede detectar riesgos automáticamente al ejecutar herramientas de diagnóstico (SWOT, Risk Matrix). La fuente queda registrada como `tool_execution`.

---

## 6. BusinessMemoryLog — Trazabilidad del Conocimiento

Cada cambio en el `CompanyProfile` genera un `BusinessMemoryLog`:

```typescript
export interface BusinessMemoryLog {
  field:       string   // Campo actualizado ("sector", "regulations")
  oldValue:    Json?    // Valor anterior
  newValue:    Json     // Nuevo valor
  source:      string   // tool_execution|workflow|user|intent|system
  sourceId:    string?  // ID de la ejecución o evento
  actorUserId: string?  // Usuario que generó el cambio
  confidence:  Float    // 0.0-1.0 de la fuente
}
```

**Fuentes del conocimiento:**

| Source | Descripción | Confianza típica |
|---|---|---|
| `user` | El usuario actualizó manualmente | 1.0 |
| `tool_execution` | Se detectó al ejecutar una herramienta | 0.6-0.8 |
| `workflow` | Se detectó al ejecutar un workflow | 0.7 |
| `intent` | El Intent Engine infirió del texto | 0.5 |
| `system` | El sistema lo asignó por defecto | 0.3 |

---

## 7. Nivel de Confianza

El campo `confidence` del `CompanyProfile` es un indicador de cuánto sabe el sistema sobre la empresa.

**Archivo:** `confidence-calculator.ts`

```typescript
function calculateConfidence(profile: CompanyProfile): number {
  let score = 0
  
  if (profile.companyName) score += 0.15
  if (profile.sector)       score += 0.10
  if (profile.country)      score += 0.05
  if (profile.size !== 'unknown') score += 0.10
  if (profile.services.length > 0) score += 0.10
  if (profile.products.length > 0) score += 0.05
  if (profile.regulations.length > 0) score += 0.10
  if (profile.digitalMaturity !== 'emerging') score += 0.05
  if (profile.departments.length > 0) score += 0.05
  
  // Bonus por completitud de objetivos y procesos
  const hasObjectives = await countObjectives(profile.id) > 0
  const hasProcesses  = await countProcesses(profile.id) > 0
  
  if (hasObjectives) score += 0.15
  if (hasProcesses)  score += 0.10
  
  return Math.min(score, 1.0)
}
```

La confianza se muestra en la UI del Copilot como "X% conocimiento empresa" con una barra de progreso.

---

## 8. API Routes

### GET /api/memory/context

Devuelve el `BusinessContext` completo del workspace.

```
GET /api/memory/context?workspaceId=xxx
→ 200 { context: BusinessContext }
```

### PATCH /api/memory/profile

Actualiza campos del `CompanyProfile`.

```
PATCH /api/memory/profile
{
  workspaceId: string,
  updates: CompanyProfileUpdate
}
→ 200 { profile: CompanyProfile, confidence: number }
```

### POST /api/memory/objectives

Crea un nuevo objetivo empresarial.

```
POST /api/memory/objectives
{
  workspaceId: string,
  objective: { label, description, priority, dueDate }
}
→ 201 { objective: CompanyObjectiveData }
```

---

## 9. Integración con Otros Engines

### Intent Engine

El `BusinessContext` enriquece el análisis del Intent Engine:
- El sector ajusta el scoring de goals (empresa tech → goals IT priorizan)
- Las regulations añaden goals de compliance automáticamente
- Los objetivos activos aumentan el score de goals relacionados

### Planning Engine

El `BusinessContext` alimenta el scoring del Planning Engine:
- `businessFit` usa sector, madurez digital y normativas
- `riskAdjusted` usa los riesgos abiertos relacionados con el dominio
- Los activos `integrations` permiten generar pasos de integración en los planes

### Business Copilot

El Copilot carga el `BusinessContext` en la fase `greeting` y lo muestra en el panel lateral:
- Datos de empresa en `CompanyContextPanel`
- Objetivos activos en `ObjectivesPanel`
- Riesgos críticos en `RisksPanel`

Las sugerencias del Copilot (`getCopilotSuggestions()`) se generan directamente desde el `BusinessContext`:
- Goals sin completar → sugerencias de tipo `objective`
- Riesgos abiertos → sugerencias de tipo `risk`
- Procesos sin automatizar → sugerencias de tipo `process`
- Dominios sin herramientas → sugerencias de tipo `domain`
