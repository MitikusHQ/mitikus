# ProTools Hub — Documentación Oficial

## Documento 18 — AI Router

> **Estado: DISEÑO — No implementado en el MVP**
> 
> Este documento describe el diseño del AI Router como referencia para la Fase 2. El sistema actual usa un provider fijo por ToolInstallationConfig. El AI Router añadirá selección dinámica de modelo.

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Clasificación:** Design Doc — Fase 2

---

## Tabla de Contenidos

1. [Visión](#1-visión)
2. [Problema que Resuelve](#2-problema-que-resuelve)
3. [Arquitectura Propuesta](#3-arquitectura-propuesta)
4. [Dimensiones de Routing](#4-dimensiones-de-routing)
5. [Algoritmo de Selección](#5-algoritmo-de-selección)
6. [Integración con el Execution Engine](#6-integración-con-el-execution-engine)
7. [Tabla de Routing de Referencia](#7-tabla-de-routing-de-referencia)

---

## 1. Visión

El **AI Router** selecciona dinámicamente el modelo de IA más adecuado para cada ejecución, optimizando el balance entre calidad, velocidad y coste según el contexto.

**Analogía:** Como un router de red selecciona la mejor ruta según condiciones de red, el AI Router selecciona el mejor modelo según las necesidades de la tarea.

---

## 2. Problema que Resuelve

### Sin AI Router (MVP actual)

El modelo se configura estáticamente en `ToolInstallationConfig`:
- Un workflow complejo usa siempre `claude-sonnet-4-6`
- Un checklist simple usa también `claude-sonnet-4-6`
- Un plan de estrategia también usa `claude-sonnet-4-6`

**Consecuencia:** Overpaying en tareas simples, underpowering en tareas complejas.

### Con AI Router

El sistema decide dinámicamente:
- "Este checklist es simple → `claude-haiku-4-5` (90% más barato)"
- "Este plan estratégico requiere razonamiento profundo → `claude-opus-4-8`"
- "Esta ejecución urgente → modelo más rápido disponible"
- "Usuario con límite de créditos bajo → modelo económico"

---

## 3. Arquitectura Propuesta

```
Execution Engine recibe ExecutionInput
    ↓
AI Router analiza:
    - ToolCapabilityProfile.qualityLevel
    - ExecutionInput.complexity (calculado)
    - User.remainingCredits
    - Task.urgency (si aplica)
    - Provider availability
    ↓
Selecciona: { provider, model }
    ↓
Execution Engine ejecuta con el modelo seleccionado
```

El AI Router es **transparente** para la capa de llamada — solo cambia el `provider` y `model` del `ExecutionInput`. El Execution Engine no necesita saber que hubo routing.

---

## 4. Dimensiones de Routing

### 4.1 Calidad Requerida

Basada en `ToolCapabilityProfile.qualityLevel`:

| qualityLevel | Modelos candidatos | Uso típico |
|---|---|---|
| `draft` | claude-haiku-4-5, gpt-4o-mini | Borradores, checklists simples |
| `standard` | claude-sonnet-4-6, gpt-4o-mini | La mayoría de herramientas |
| `professional` | claude-opus-4-8, claude-sonnet-4-6 | Planes estratégicos, informes ejecutivos |

### 4.2 Complejidad del Input

El AI Router analiza el `userPrompt` estimado para determinar complejidad:
- Número de campos a completar
- Longitud esperada del output
- Presencia de instrucciones de razonamiento multi-paso

### 4.3 Restricciones del Usuario

- `User.trialPlan = 'trial_personal'` → Prefiere modelos más económicos
- Créditos restantes < 20% del límite → Fuerza a modelo económico
- Límite de coste diario cercano → Fuerza a modelo económico

### 4.4 Disponibilidad del Provider

El router verifica el estado de los providers:
- Si Anthropic devuelve error 503 → fallback a OpenAI
- Si un modelo tiene alta latencia → prefiere alternativa más rápida

---

## 5. Algoritmo de Selección

```typescript
export interface RouterDecision {
  provider: string
  model:    string
  reason:   string    // Para logging y debugging
  costEst:  number    // Coste estimado en EUR
}

export function routeExecution(
  profile:   ToolCapabilityProfile,
  input:     ExecutionInput,
  userPlan:  string,
  budgetEUR: number
): RouterDecision {
  // 1. Determinar calidad mínima requerida
  const minQuality = profile.qualityLevel

  // 2. Filtrar candidatos por calidad
  const candidates = MODEL_CATALOG.filter(m => 
    meetsQuality(m, minQuality)
  )

  // 3. Si hay restricción de presupuesto, filtrar por coste
  const affordable = budgetEUR > 0
    ? candidates.filter(m => estimateCost(m, input) <= budgetEUR)
    : candidates

  // 4. Ordenar por balance calidad/coste
  const ranked = affordable.sort((a, b) => 
    scoreModel(a, profile) - scoreModel(b, profile)
  )

  return {
    provider: ranked[0].provider,
    model:    ranked[0].modelId,
    reason:   `Quality: ${minQuality}, Budget: €${budgetEUR}`,
    costEst:  estimateCost(ranked[0], input),
  }
}
```

---

## 6. Integración con el Execution Engine

```typescript
// execution-engine.ts (versión con AI Router)
export async function runToolExecution(
  input: ExecutionInput
): Promise<ExecutionOutput> {
  // Si no se especifica modelo, el Router decide
  const routerDecision = input.config?.model
    ? null
    : routeExecution(input.toolProfile, input, input.userPlan, input.budgetEUR)

  const effectiveConfig = {
    ...input.config,
    provider: routerDecision?.provider ?? input.config?.provider ?? 'anthropic',
    model:    routerDecision?.model ?? input.config?.model ?? DEFAULT_MODEL,
  }

  // Ejecutar con el modelo seleccionado
  const provider = getProvider(effectiveConfig.provider)
  const output = await provider.run(systemPrompt, userPrompt, effectiveConfig.model)

  return { ...output, routedBy: routerDecision?.reason }
}
```

El campo `routedBy` permite análisis de qué porcentaje de ejecuciones usa routing dinámico vs. config manual.

---

## 7. Tabla de Routing de Referencia

| Herramienta | qualityLevel | Modelo por defecto | Modelo router draft | Modelo router pro |
|---|---|---|---|---|
| iso9001-audit | professional | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-opus-4-8 |
| corrective-action | standard | claude-sonnet-4-6 | claude-haiku-4-5 | claude-sonnet-4-6 |
| quality-checklist | draft | claude-haiku-4-5 | claude-haiku-4-5 | claude-haiku-4-5 |
| strategic-plan | professional | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-opus-4-8 |
| employee-onboarding | standard | claude-sonnet-4-6 | claude-haiku-4-5 | claude-sonnet-4-6 |
| crm-leads | draft | claude-haiku-4-5 | claude-haiku-4-5 | claude-haiku-4-5 |
| company-diagnosis | professional | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-opus-4-8 |

**Ahorros estimados con AI Router:**
- 30-40% de reducción en coste IA para workspaces con uso mixto
- Sin pérdida de calidad en herramientas que lo requieren
