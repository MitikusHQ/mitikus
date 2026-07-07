# ProTools Hub — Documentación Oficial

## Documento 08 — Intent Engine

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Archivos fuente:** `apps/web/src/lib/intent-engine/`

---

## Tabla de Contenidos

1. [Responsabilidad](#1-responsabilidad)
2. [Tipos del Sistema](#2-tipos-del-sistema)
3. [CanonicalGoals — Los 37 Objetivos Empresariales](#3-canonicalgoals--los-37-objetivos-empresariales)
4. [Algoritmo de Análisis](#4-algoritmo-de-análisis)
5. [Uso en el Copilot](#5-uso-en-el-copilot)
6. [API Route](#6-api-route)

---

## 1. Responsabilidad

El **Intent Engine** traduce texto libre en lenguaje natural a un `IntentResult` estructurado que los engines posteriores (Planning, Copilot) pueden consumir de forma programática.

> **Una sola pregunta:** ¿Qué quiere hacer esta empresa?  
> **Una sola respuesta:** Un `IntentResult` con un objetivo canónico, dominio, entidades y restricciones.

El engine no llama a ninguna IA. Es un sistema de reglas basado en keywords y scoring.

---

## 2. Tipos del Sistema

**Archivo:** `apps/web/src/lib/intent-engine/types.ts`

```typescript
export type BusinessDomain =
  | 'marketing' | 'sales' | 'hr' | 'quality'
  | 'compliance_legal' | 'procurement' | 'strategy'
  | 'it' | 'finance_admin'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface IntentResult {
  canonicalGoal:   string           // slug del CanonicalGoal detectado
  domain:          BusinessDomain   // dominio empresarial
  entities:        string[]         // entidades mencionadas (empresa, producto, etc.)
  constraints:     string[]         // restricciones (presupuesto, plazo, normativa)
  primaryTools:    string[]         // herramientas primarias recomendadas (slugs)
  confidence:      ConfidenceLevel  // high | medium | low
  needsClarification: boolean       // si el engine necesita más información
  suggestedQuestion: string | null  // pregunta de aclaración (si needsClarification)
  rawInput:        string           // texto original del usuario
  normalizedInput: string           // texto normalizado (lowercase, sin stopwords)
}
```

---

## 3. CanonicalGoals — Los 37 Objetivos Empresariales

**Archivo:** `apps/web/src/lib/intent-engine/goals.ts`

Cada `CanonicalGoal` tiene:
- `slug` — identificador único
- `domain` — dominio empresarial
- `keywords[]` — palabras clave para detección
- `primaryTools[]` — slugs de herramientas recomendadas
- `requiredEntities[]` — entidades necesarias para el plan

### Dominio: Marketing (6 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `seo_content_strategy` | seo, contenido, blog, palabras clave | content-plan, keyword-research, content-brief |
| `social_media_campaign` | redes sociales, campaña, instagram, linkedin | social-calendar, hashtag-strategy, content-pillar |
| `email_marketing_automation` | email, newsletter, automatización, leads | email-campaign, email-sequence, lead-nurturing |
| `brand_identity_development` | marca, identidad, branding, logo | brand-identity, brand-guidelines, value-proposition |
| `digital_advertising` | publicidad, anuncios, google ads, facebook ads | ad-copy, campaign-budget, audience-targeting |
| `market_research_analysis` | investigación de mercado, competencia, análisis | competitor-analysis, market-sizing, customer-survey |

### Dominio: Sales (4 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `lead_generation_pipeline` | leads, pipeline, prospectos, captación | crm-leads, lead-scoring, outreach-sequence |
| `sales_process_optimization` | proceso de ventas, cierre, objeciones | sales-pipeline, objection-handler, proposal-template |
| `crm_implementation` | crm, gestión de clientes, seguimiento | crm-leads, opportunity-tracking, customer-profile |
| `customer_retention_loyalty` | retención, fidelización, churn, satisfacción | customer-satisfaction, loyalty-program, churn-analysis |

### Dominio: HR (5 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `employee_onboarding` | incorporación, onboarding, bienvenida | employee-onboarding, onboarding-checklist |
| `performance_management` | evaluación, desempeño, KPIs, objetivos | performance-review, okr-tracker, goal-setting |
| `talent_recruitment` | reclutamiento, selección, candidatos, ofertas | job-description, interview-guide, candidate-evaluation |
| `training_development` | formación, capacitación, plan de formación | training-plan, skill-gap-analysis, learning-path |
| `hr_compliance_rgpd` | contrato, nómina, RGPD, compliance | employment-contract, gdpr-hr-checklist, leave-policy |

### Dominio: Quality (4 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `iso9001_certification` | iso, iso9001, calidad, certificación | iso9001-audit, corrective-action, quality-inspection |
| `process_quality_control` | control de calidad, no conformidad, inspección | quality-checklist, nonconformity-report, quality-inspection |
| `supplier_quality_management` | proveedor, auditoría de proveedor, evaluación | supplier-audit, supplier-evaluation, supply-chain-risk |
| `continuous_improvement` | mejora continua, kaizen, lean, eficiencia | improvement-plan, corrective-action, root-cause-analysis |

### Dominio: Compliance / Legal (4 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `gdpr_compliance` | rgpd, gdpr, protección de datos, privacidad | gdpr-compliance-checklist, data-processing-agreement |
| `legal_contract_management` | contrato, acuerdo, NDA, términos | nda-generator, contract-review-checklist |
| `regulatory_compliance_audit` | cumplimiento normativo, auditoría legal, regulación | compliance-audit, regulatory-checklist |
| `risk_management` | gestión de riesgos, riesgo operacional, matriz | risk-matrix, risk-register, business-continuity |

### Dominio: Procurement (3 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `supplier_selection_rfp` | RFP, proveedor, licitación, selección | rfp-generator, supplier-evaluation, vendor-comparison |
| `purchase_order_management` | pedido, orden de compra, aprovisionamiento | purchase-order, supplier-invoice, procurement-checklist |
| `supply_chain_optimization` | cadena de suministro, inventario, logística | supply-chain-risk, inventory-analysis |

### Dominio: Strategy (4 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `strategic_planning` | plan estratégico, estrategia, objetivos | strategic-plan, okr-tracker, balanced-scorecard |
| `business_diagnosis` | diagnóstico, análisis empresa, situación | company-diagnosis, swot-analysis, digital-maturity |
| `business_model_innovation` | modelo de negocio, canvas, propuesta de valor | business-model-canvas, value-proposition, competitor-analysis |
| `digital_transformation` | transformación digital, digitalización, tecnología | digital-maturity, digital-roadmap, technology-assessment |

### Dominio: IT (3 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `cybersecurity_assessment` | seguridad, ciberseguridad, vulnerabilidades | security-audit, vulnerability-checklist, incident-response |
| `it_project_management` | proyecto IT, metodología, scrum, sprint | project-plan, sprint-planning, technical-spec |
| `software_selection_evaluation` | software, herramienta, evaluación, selección | software-evaluation, technology-assessment |

### Dominio: Finance / Admin (4 goals)

| Slug | Keywords clave | Herramientas primarias |
|---|---|---|
| `financial_planning_budget` | presupuesto, financiero, previsión | budget-planning, financial-forecast, cost-analysis |
| `accounting_reporting` | contabilidad, informe financiero, KPIs | financial-report, kpi-dashboard, accounting-checklist |
| `investment_analysis` | inversión, ROI, rentabilidad | investment-analysis, roi-calculator, business-case |
| `administrative_operations` | administración, gestión operativa, procedimientos | admin-checklist, procedure-manual, meeting-minutes |

---

## 4. Algoritmo de Análisis

**Archivo:** `apps/web/src/lib/intent-engine/` (normalizer, scorer, analyzer)

### Paso 1: Normalización del Input

```typescript
// normalizer.ts
function normalizeInput(rawInput: string): string {
  return rawInput
    .toLowerCase()
    .normalize('NFD')                    // elimina tildes
    .replace(/[̀-ͯ]/g, '')     // elimina diacríticos
    .replace(/[^a-z0-9\s]/g, ' ')       // elimina puntuación
    .replace(/\s+/g, ' ')               // normaliza espacios
    .trim()
}
```

### Paso 2: Extracción de Entidades

El analyzer extrae:
- **Nombres de empresa** (detectado por mayúsculas previas a normalización)
- **Normativas** (ISO, RGPD, GDPR, SOC2...)
- **Fechas y plazos** (Q1, diciembre, enero...)
- **Presupuestos** (€, EUR, euros, budget...)

### Paso 3: Scoring de Goals

Para cada `CanonicalGoal`, calcula un score basado en:
- Número de keywords que aparecen en el texto normalizado
- Peso de cada keyword (algunas son más discriminativas)
- Bonus por coincidencia de `requiredEntities`

```typescript
// scorer.ts
function scoreGoal(normalizedInput: string, goal: CanonicalGoal): number {
  let score = 0
  for (const keyword of goal.keywords) {
    if (normalizedInput.includes(keyword)) {
      score += keyword.split(' ').length > 1 ? 2 : 1  // bigramas valen doble
    }
  }
  return score
}
```

### Paso 4: Selección del Goal

```typescript
// Ordena goals por score descendente
const ranked = allGoals.map(g => ({ goal: g, score: scoreGoal(input, g) }))
  .sort((a, b) => b.score - a.score)

const best = ranked[0]
const confidence: ConfidenceLevel =
  best.score >= 3 ? 'high' :
  best.score >= 1 ? 'medium' : 'low'
```

### Paso 5: Detección de Necesidad de Aclaración

Si `confidence === 'low'` o `best.score === 0`, el engine pone `needsClarification: true` y genera una `suggestedQuestion` basada en el dominio detectado o pidiendo más contexto.

---

## 5. Uso en el Copilot

El Copilot invoca el Intent Engine al recibir el primer mensaje del usuario:

```typescript
// business-copilot/orchestrator.ts
const intentResult = await analyzeIntent({
  rawInput: message,
  businessContext: context,  // añade contexto de BusinessMemory al análisis
})

if (intentResult.needsClarification) {
  return transition({ phase: 'clarifying', question: intentResult.suggestedQuestion })
}

return transition({ phase: 'planning', intentResult })
```

El `BusinessContext` enriquece el análisis: si la empresa es del sector tecnológico, los goals de IT reciben un boost en el scoring.

---

## 6. API Route

**Archivo:** `apps/web/src/app/api/intent/analyze/route.ts`

```
POST /api/intent/analyze
{
  workspaceId: string,
  input: string,
  includeBusinessContext?: boolean
}

→ 200 { intentResult: IntentResult }
```

La API Route:
1. Llama a `requireUser()` para autenticación
2. Si `includeBusinessContext`, carga el `BusinessContext` del workspace
3. Invoca el Intent Engine con input + contexto
4. Registra un evento en el AuditLog
5. Devuelve el `IntentResult`
