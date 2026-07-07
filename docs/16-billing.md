# ProTools Hub — Documentación Oficial

## Documento 16 — Billing y Modelo de Acceso

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado (Beta)

---

## Tabla de Contenidos

1. [Estado Actual — Beta](#1-estado-actual--beta)
2. [Modelo de Trial](#2-modelo-de-trial)
3. [Límites y Control de Acceso](#3-límites-y-control-de-acceso)
4. [Plan de Monetización Futuro](#4-plan-de-monetización-futuro)
5. [Implementación Técnica](#5-implementación-técnica)

---

## 1. Estado Actual — Beta

ProTools Hub está actualmente en **fase Beta**. No hay cobro activo. El acceso se controla mediante un sistema de trials con límites de uso.

El modelo de billing completo (Stripe, planes, facturación) no está implementado en el MVP. El campo `plan` en `Organization` (`FREE/PRO`) está preparado pero no se usa activamente.

---

## 2. Modelo de Trial

Cada usuario en beta tiene un `trialPlan` asignado automáticamente al registrarse:

| trialPlan | Descripción | Asignado cuando |
|---|---|---|
| `trial_personal` | Límites reducidos | Email personal (gmail, hotmail, etc.) |
| `trial_business` | Límites ampliados | Email empresarial (dominio corporativo) |
| `blocked` | Sin acceso | Email desechable o fraude detectado |

### Detección de Tipo de Email

El campo `emailType` clasifica el email del usuario:

```typescript
type EmailType = 'personal' | 'business' | 'disposable' | 'unknown'
```

La clasificación se hace al crear el usuario:
- Dominios personales conocidos → `personal` → `trial_personal`
- Dominios desechables conocidos → `disposable` → `blocked`
- Otros dominios → `business` → `trial_business`
- Sin clasificar → `unknown` → `trial_personal`

---

## 3. Límites y Control de Acceso

**Archivo:** `apps/web/src/lib/ai-rate-limit.ts`

Los límites se configuran vía variables de entorno:

```bash
# Por usuario
MAX_AI_GENERATIONS_PER_USER_DAY=10        # trial_personal
MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=20   # por workspace
MAX_AI_GENERATIONS_GLOBAL_DAY=50          # límite global de la plataforma
MAX_AI_ESTIMATED_COST_DAY_EUR=2.0         # coste máximo en EUR/día

# trial_business tiene 2.5x más límite
TRIAL_BUSINESS_MULTIPLIER=2.5
```

### Verificación de Límites

```typescript
export async function checkRateLimit(
  userId: string,
  workspaceId: string,
  orgId: string
): Promise<void> {
  const [userCount, workspaceCount, globalCount, userCost] = await Promise.all([
    countTodayUsage({ userId }),
    countTodayUsage({ workspaceId }),
    countTodayUsage({}),
    sumTodayCost({ userId }),
  ])
  
  const limits = getLimitsForUser(user.trialPlan)
  
  if (userCount >= limits.perUserDay)
    throw new RateLimitError('daily_user', userCount, limits.perUserDay)
  
  if (workspaceCount >= limits.perWorkspaceDay)
    throw new RateLimitError('daily_workspace', ...)
    
  if (globalCount >= MAX_GLOBAL_DAY)
    throw new RateLimitError('daily_global', ...)
    
  if (userCost >= MAX_COST_DAY_EUR)
    throw new RateLimitError('daily_cost', ...)
}
```

---

## 4. Plan de Monetización Futuro

### Modelo SaaS Previsto

| Tier | Usuarios objetivo | Precio previsto | Incluye |
|---|---|---|---|
| **Starter** | Autónomos, freelancers | €29/mes | 1 workspace, 500 ejecuciones/mes |
| **Professional** | Consultoras pequeñas | €79/mes | 5 workspaces, 2.000 ejecuciones/mes |
| **Business** | Departamentos empresa | €249/mes | 20 workspaces, 10.000 ejecuciones/mes |
| **Enterprise** | Grandes organizaciones | Negociado | Sin límite, SLA, SSO, soporte dedicado |

### Créditos de IA

Por encima del límite incluido, los usuarios compran créditos adicionales:
- 1 crédito = 1.000 ejecuciones adicionales
- Precio: €0.05 por crédito (ajustado según coste de modelos)

### Herramientas Premium

El marketplace tendrá herramientas de `tier='premium'` con coste adicional:
- Herramientas especializadas (sector legal, médico, financiero)
- Herramientas de socios (partners)
- Precio: pago único o suscripción mensual

---

## 5. Implementación Técnica

### Campos Actuales en el Schema

```prisma
model Organization {
  plan Plan @default(FREE)  // Preparado para billing real
}

enum Plan {
  FREE
  PRO
}

model User {
  emailType  String @default("unknown")         // personal|business|disposable|unknown
  trialPlan  String @default("trial_personal")  // trial_personal|trial_business|blocked
}
```

### Integración con Stripe (Roadmap)

Cuando se implemente billing real:
1. `Organization` recibirá `stripeCustomerId` y `stripeSubscriptionId`
2. Webhooks de Stripe actualizarán `Organization.plan`
3. Los límites se calcularán desde el plan en lugar de `trialPlan`
4. Un job diario sincronizará el estado de las suscripciones

### Sin Impacto en el Core

El sistema de billing está **completamente desacoplado** de los engines (Execution, Intent, Planning, Copilot). Solo el sistema de rate limiting consulta `User.trialPlan`. El resto del sistema no sabe si el usuario paga o no.
