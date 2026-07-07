# ProTools Hub — Documentación Oficial

## Documento 06 — Tool Intelligence

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Archivos fuente:** `apps/web/src/lib/tool-intelligence/`, `lib/registry-intelligence/`

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [ToolCapabilityProfile — El Perfil de Inteligencia](#2-toolcapabilityprofile--el-perfil-de-inteligencia)
3. [Tool Intelligence Engine](#3-tool-intelligence-engine)
4. [Registry Intelligence Engine](#4-registry-intelligence-engine)
5. [Grafo de Compatibilidad](#5-grafo-de-compatibilidad)
6. [Tipos IOType](#6-tipos-iotype)

---

## 1. Visión General

El sistema de inteligencia de herramientas es la capa que convierte el catálogo de herramientas en un grafo de conocimiento. Permite:

- **Compatibilidad:** ¿Se puede conectar la herramienta A con la herramienta B en un workflow?
- **Recomendaciones:** ¿Qué herramientas debería el usuario usar juntas?
- **Búsqueda semántica:** ¿Qué herramienta encaja mejor con la descripción del usuario?
- **Planning:** ¿Qué herramientas componen un plan para un objetivo dado?

Está compuesto de dos subsistemas:

| Subsistema | Archivos | Rol |
|---|---|---|
| **Tool Intelligence** | `lib/tool-intelligence/` | Análisis individual y relaciones entre herramientas |
| **Registry Intelligence** | `lib/registry-intelligence/` | Búsqueda y ranking del catálogo global |

---

## 2. ToolCapabilityProfile — El Perfil de Inteligencia

**Archivo:** `apps/web/prisma/schema.prisma` — modelo `ToolCapabilityProfile`

Cada herramienta oficial tiene un `ToolCapabilityProfile` que codifica:

### businessDomain

El dominio empresarial al que pertenece:
```typescript
type BusinessDomain =
  | 'strategy' | 'hr' | 'finance' | 'it'
  | 'marketing' | 'quality' | 'operations'
  | 'legal' | 'sales' | 'admin' | 'procurement'
```

### businessGoals

Array de `CanonicalGoal` slugs que esta herramienta apoya:
```json
["iso9001_certification", "process_quality_control", "continuous_improvement"]
```

### inputTypes / outputTypes

Arrays de `IOType` que definen el contrato de datos:
- `inputTypes`: qué datos necesita la herramienta para funcionar
- `outputTypes`: qué genera la herramienta como resultado

Ver [sección 6 — IOType].

### dependencies / relatedTools / alternativeTools

```json
{
  "dependencies":    ["company-diagnosis"],       // debe ejecutarse ANTES
  "relatedTools":    ["corrective-action", "preventive-action"],  // usa junto
  "alternativeTools": ["iso14001-audit"]          // alternativa para un propósito similar
}
```

### automationFriendly

`true` si la herramienta puede ejecutarse en un workflow sin intervención humana. `false` requiere inputs manuales que no pueden pre-rellenarse.

---

## 3. Tool Intelligence Engine

**Archivos:** `lib/tool-intelligence/`

```
tool-intelligence/
├── index.ts               ← API pública
├── compatibility.ts       ← checkCompatibility()
├── recommendations.ts     ← getRecommendations()
├── capability-graph.ts    ← CapabilityGraph class
├── types.ts               ← CompatibilityResult, Recommendation
```

### checkCompatibility()

```typescript
export function checkCompatibility(
  sourceTool: ToolCapabilityProfile,
  targetTool: ToolCapabilityProfile
): CompatibilityResult

interface CompatibilityResult {
  compatible:   boolean
  score:        number        // 0.0-1.0
  matchedTypes: string[]      // IOTypes que conectan
  reasons:      string[]      // Explicación en lenguaje natural
}
```

**Algoritmo:**
1. Comprueba si algún `outputType` de `source` está en `inputTypes` de `target`
2. Comprueba si `target` está en `source.relatedTools`
3. Comprueba si comparten `businessDomain` o `businessGoals`

### getRecommendations()

```typescript
export function getRecommendations(
  installedTools: ToolCapabilityProfile[],
  allTools: ToolCapabilityProfile[]
): Recommendation[]

interface Recommendation {
  toolSlug:   string
  reason:     string      // "Complementa tu herramienta de auditoría"
  score:      number
  category:   'complementary' | 'dependency' | 'domain_expansion'
}
```

---

## 4. Registry Intelligence Engine

**Archivos:** `lib/registry-intelligence/`

```
registry-intelligence/
├── index.ts               ← API pública
├── searcher.ts            ← searchRegistry()
├── ranker.ts              ← rankResults()
├── similarity.ts          ← findSimilar()
├── scorer.ts              ← scoreMatch()
```

### searchRegistry()

```typescript
export function searchRegistry(
  query: string,
  tools: ToolWithRegistryMeta[],
  options?: SearchOptions
): RankedResult[]

interface RankedResult {
  tool:  ToolWithRegistryMeta
  score: number           // 0.0-1.0
  matchedOn: string[]     // Campos que coincidieron
}
```

**Ponderación de campos:**

| Campo | Peso |
|---|---|
| `name` match exacto | 1.0 |
| `name` match parcial | 0.8 |
| `tags` match | 0.7 |
| `keywords` match | 0.6 |
| `synonyms` match | 0.5 |
| `description` match | 0.4 |
| `displayCategory` match | 0.3 |

### findSimilar()

```typescript
export function findSimilar(
  targetTool: ToolCapabilityProfile,
  allTools: ToolCapabilityProfile[]
): SimilarTool[]
```

Usa la intersección de `businessGoals`, `businessDomain`, `inputTypes` y `outputTypes` para determinar similitud.

---

## 5. Grafo de Compatibilidad

El `CapabilityGraph` es la representación en memoria de las relaciones entre herramientas.

```typescript
// capability-graph.ts
export class CapabilityGraph {
  private nodes: Map<string, ToolCapabilityProfile>
  private edges: Map<string, string[]>  // slug → [compatible slugs]
  
  addTool(profile: ToolCapabilityProfile): void
  getCompatible(slug: string): string[]
  getDependencies(slug: string): string[]
  getRelated(slug: string): string[]
  topologicalSort(slugs: string[]): string[]
}
```

El grafo se construye al inicializar el Planning Engine y se usa para:
- Ordenar herramientas en un workflow (topological sort)
- Validar que un workflow no tiene ciclos
- Generar sugerencias de herramientas adicionales

---

## 6. Tipos IOType

Los `IOType` son el "lenguaje" de los datos entre herramientas. Permiten determinar compatibilidad automáticamente.

### IOTypes Definidos

```typescript
type IOType =
  // Datos de empresa
  | 'company_info'          // Información básica de la empresa
  | 'company_profile'       // Perfil completo
  
  // Datos de calidad
  | 'quality_data'          // Datos de calidad/KPIs
  | 'audit_findings'        // Hallazgos de auditoría
  | 'nonconformity_data'    // No conformidades
  
  // Outputs de análisis
  | 'audit_report'          // Informe de auditoría
  | 'action_plan'           // Plan de acciones
  | 'risk_assessment'       // Evaluación de riesgos
  | 'diagnostic_report'     // Informe de diagnóstico
  | 'strategic_plan'        // Plan estratégico
  
  // Datos de RRHH
  | 'employee_data'         // Datos del empleado
  | 'performance_data'      // Datos de desempeño
  | 'job_requirements'      // Requisitos del puesto
  
  // Datos de ventas/marketing
  | 'lead_data'             // Datos de leads
  | 'customer_data'         // Datos de clientes
  | 'campaign_data'         // Datos de campaña
  | 'market_data'           // Datos de mercado
  
  // Datos de compras
  | 'supplier_data'         // Datos de proveedor
  | 'rfp_data'              // Datos de RFP
  
  // Datos financieros
  | 'financial_data'        // Datos financieros
  | 'budget_data'           // Datos de presupuesto
  
  // Outputs genéricos
  | 'text_output'           // Texto sin estructura
  | 'checklist'             // Lista de verificación
  | 'report'                // Informe genérico
  | 'recommendation'        // Recomendaciones
```

### Ejemplo de Compatibilidad via IOTypes

```
company-diagnosis
  inputTypes:  ['company_info', 'company_profile']
  outputTypes: ['diagnostic_report', 'risk_assessment']

swot-analysis
  inputTypes:  ['company_info', 'diagnostic_report']  ← Acepta output de company-diagnosis
  outputTypes: ['strategic_plan', 'report']

strategic-plan
  inputTypes:  ['diagnostic_report', 'strategic_plan'] ← Acepta output de swot-analysis
  outputTypes: ['strategic_plan', 'action_plan']
```

**Resultado:** `company-diagnosis → swot-analysis → strategic-plan` es una cadena compatible y el Planning Engine la genera automáticamente para el goal `business_diagnosis`.
