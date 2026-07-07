# ProTools Hub — Documentación Oficial

## Documento 01 — Visión del Producto

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

## Tabla de Contenidos

1. [Origen e Historia](#1-origen-e-historia)
2. [El Problema](#2-el-problema)
3. [La Visión](#3-la-visión)
4. [Misión](#4-misión)
5. [Propuesta de Valor](#5-propuesta-de-valor)
6. [Casos de Uso](#6-casos-de-uso)
7. [Público Objetivo](#7-público-objetivo)
8. [Diferenciación Competitiva](#8-diferenciación-competitiva)
9. [Análisis Competitivo](#9-análisis-competitivo)
10. [Roadmap](#10-roadmap)
11. [Modelo SaaS](#11-modelo-saas)

---

## 1. Origen e Historia

ProTools Hub nació de la observación de un problema estructural en la adopción de software empresarial: las PyMEs y departamentos de empresas medianas pagan por software genérico que no se adapta a sus procesos, o bien pagan a consultoras para que les diseñen herramientas a medida con costes prohibitivos.

El proyecto comenzó como un experimento sobre hasta qué punto la IA generativa podía reemplazar el ciclo completo de diseño → desarrollo → despliegue de una herramienta de negocio. La conclusión fue que, con la arquitectura correcta, el tiempo de creación de una herramienta pasaba de semanas a segundos.

La primera implementación fue un generador de herramientas de auditoría en lenguaje natural. A partir de ahí, el sistema creció para incluir un marketplace, workflows, memoria empresarial y un copilot de dirección.

### 1.1 Línea de tiempo del proyecto

| Sprint / Release | Hito |
|---|---|
| Sprint 1 | Auth (Clerk), Organization, User, Workspace, modelo multi-tenant básico |
| Sprint 2 | ToolDefinition, ToolInstance, ToolRecord, Marketplace básico |
| Sprint 3 | Execution Engine (Anthropic), ToolExecution, AIUsage, rate limiting |
| Sprint 4 | Workflow Engine, WorkflowExecution, React Flow canvas |
| Sprint 5 | Business Memory, Intent Engine, Planning Engine |
| Sprint 5.1 | Business Copilot, WorkspaceShell refactor, RC-1A Bugfix Blocks 1-5 |

> Referencia completa: [Doc 20 — Historia Completa del Desarrollo]

---

## 2. El Problema

### 2.1 El Software Empresarial Genérico No Sirve

Las empresas de 5 a 500 empleados enfrentan un dilema:

1. **Software genérico:** CRMs, ERPs y suites de ofimática que cubren el 60% de sus necesidades pero requieren adaptar los procesos al software, no al revés.
2. **Desarrollo a medida:** Costoso (€15.000 - €150.000 por proyecto), lento (3-12 meses) y difícil de mantener.
3. **Hojas de cálculo:** La solución por defecto para el 80% de los procesos internos. Frágiles, no auditables, no escalables.

### 2.2 La Consultoría es Cara e Ineficiente

Las consultoras facturan entre €800 y €2.500/día por diseñar procesos y herramientas que el cliente no puede mantener de forma autónoma. El conocimiento queda en la consultora, no en la empresa.

### 2.3 La IA Generativa Sin Estructura No Escala

Las empresas que intentan usar ChatGPT o Claude directamente se encuentran con:
- Prompts ad-hoc sin estructura
- Sin persistencia del contexto empresarial
- Sin auditoría ni trazabilidad
- Sin integración con sus datos y procesos
- Sin orquestación de múltiples tareas

### 2.4 Cuantificación del Problema

| Problema | Impacto estimado |
|---|---|
| Tiempo dedicado a procesos repetitivos | 40-60% del tiempo de trabajo |
| Coste de desarrollo de herramientas a medida | €15K-€150K por herramienta |
| Tiempo de diseño de un proceso documentado | 2-8 semanas con consultora |
| Adopción de software genérico | 60-70% de las funcionalidades nunca se usan |

---

## 3. La Visión

**ProTools Hub aspira a ser el sistema operativo empresarial de la próxima década para organizaciones de hasta 1.000 empleados.**

En 5 años, una empresa puede llegar a ProTools Hub con una descripción de su negocio y obtener en menos de una hora:
- Un catálogo de herramientas adaptadas a su sector y tamaño
- Un conjunto de procesos documentados y ejecutables con IA
- Un plan estratégico generado a partir de su contexto
- Una orquestación automatizada de sus operaciones críticas
- Un copilot de dirección que aprende de cada ejecución

La visión no es reemplazar al consultor humano. Es **democratizar el acceso a la consultoría de procesos** para organizaciones que no pueden pagarlo.

---

## 4. Misión

> **Hacer que cualquier organización pueda automatizar sus operaciones con IA en el tiempo que tarda en describir lo que necesita.**

La misión se concreta en tres compromisos:

1. **Velocidad:** De la necesidad a la herramienta funcional en menos de 60 segundos.
2. **Adaptabilidad:** El sistema aprende del negocio; el negocio no se adapta al sistema.
3. **Confianza:** Cada acción es auditable, cada coste es transparente, cada resultado es trazable.

---

## 5. Propuesta de Valor

### 5.1 Para el Director de Operaciones

> "Antes necesitaba una consultora y 3 meses para documentar mi proceso de onboarding. Ahora tengo una herramienta ejecutable en 30 segundos."

| Antes | Con ProTools Hub |
|---|---|
| Proceso en hoja de cálculo no auditable | Herramienta estructurada con registro de datos |
| Consultoría a €1.500/día | Generación IA a fracción de céntimo |
| 3-8 semanas para diseñar un proceso | Segundos para generar una herramienta |
| Sin trazabilidad de quién hizo qué | Audit log inmutable por acción |
| Sin visibilidad de costes IA | Dashboard de consumo por usuario/workspace |

### 5.2 Para la Consultora de Servicios Profesionales

> "Puedo entregar herramientas personalizadas a mis clientes el mismo día de la reunión inicial."

- Crea herramientas para cada cliente desde plantillas del marketplace
- Cada workspace es un cliente aislado con sus propios datos
- El Business Memory aprende del cliente automáticamente
- Puede compartir herramientas entre clientes con un fork

### 5.3 Para el Equipo de Calidad / RRHH / Ventas

> "Todo el equipo usa la misma herramienta, con los mismos campos, y el directivo ve los resultados en tiempo real."

- No-code: cualquier persona puede ejecutar herramientas sin formación técnica
- Roles granulares: OWNER, ADMIN, EDITOR, OPERATOR, VIEWER
- Los workflows encadenan herramientas automáticamente

---

## 6. Casos de Uso

### 6.1 Auditoría ISO 9001

Un responsable de calidad necesita preparar la empresa para la certificación ISO 9001. En ProTools Hub:

1. El Copilot detecta el objetivo "iso9001_certification" desde lenguaje natural
2. El Planning Engine genera 3 planes (completo, rápido, económico)
3. El usuario selecciona el plan completo
4. Se genera un Workflow con: `iso9001-audit → corrective-action → preventive-action → quality-inspection`
5. El equipo ejecuta cada herramienta con los datos de la empresa
6. El Audit Log registra cada ejecución para la certificadora

### 6.2 Incorporación de Empleados

Una empresa en crecimiento necesita estandarizar el onboarding:

1. El responsable de RRHH instala "Employee Onboarding" del marketplace
2. Personaliza los campos para su empresa (nombre, departamento, equipo, accesos)
3. Ejecuta la herramienta para cada nuevo empleado
4. El sistema genera un checklist de tareas con IA personalizado
5. El registro queda en el historial auditable

### 6.3 Pipeline de Ventas con CRM

Un director comercial necesita seguimiento de oportunidades:

1. Instala `crm-leads`, `opportunity-tracking` y `sales-pipeline`
2. El equipo comercial registra cada lead con la herramienta CRM
3. Se ejecuta un workflow que conecta las 3 herramientas
4. El analytics muestra las ejecuciones por herramienta y coste IA

### 6.4 Diagnóstico Estratégico

Un CEO quiere analizar el estado de su empresa:

1. El Copilot sugiere "Diagnóstico empresarial" basándose en la memoria de la empresa
2. El Planning Engine genera: `swot-analysis → company-diagnosis → digital-maturity → strategic-plan`
3. El CEO ejecuta el workflow completo
4. Recibe 4 informes IA conectados que forman un diagnóstico integral

### 6.5 Importación de Herramienta Existente

Una empresa tiene un checklist de proveedor en Excel:

1. Sube el archivo Excel al Import Engine
2. El sistema detecta los campos, tipos y estructura
3. Convierte el Excel en un `ToolSchemaV1` válido
4. La herramienta queda disponible en el workspace con soporte IA

---

## 7. Público Objetivo

### 7.1 Segmento Principal: Consultoras y Agencias

**Perfil:** Consultoras de procesos, agencias de transformación digital, despachos de consultoría de negocio.

**Tamaño:** 2-50 empleados, gestionan 10-200 clientes.

**Dolor:** Necesitan entregar valor rápido al cliente con herramientas personalizadas sin equipo de desarrollo.

**Valor:** Cada cliente tiene su workspace aislado. Las herramientas se generan y adaptan en tiempo real.

### 7.2 Segmento Secundario: Departamentos de Empresa Mediana

**Perfil:** Departamentos de calidad, RRHH, ventas, compras en empresas de 50-500 empleados.

**Tamaño:** 5-50 personas en el departamento.

**Dolor:** Procesos en hojas de cálculo, sin trazabilidad, sin automatización.

**Valor:** Herramientas estructuradas, ejecutables con IA, con audit log.

### 7.3 Segmento Terciario: Autónomos y Freelancers de Alto Valor

**Perfil:** Consultores independientes, coaches de negocio, asesores.

**Tamaño:** 1-3 personas, 10-50 clientes.

**Dolor:** No tienen recursos para desarrollar herramientas propias.

**Valor:** Acceso a un catálogo profesional y generación IA por fracción de céntimo.

---

## 8. Diferenciación Competitiva

### 8.1 vs. Herramientas de IA Generales (ChatGPT, Claude, Gemini)

| Dimensión | ChatGPT/Claude | ProTools Hub |
|---|---|---|
| Estructura | Sin estructura — respuesta libre | ToolSchema validado con campos tipados |
| Persistencia | Sin memoria de empresa | Business Memory aprende automáticamente |
| Auditoría | Ninguna | Audit log inmutable por cada acción |
| Workflows | No | Editor visual con React Flow |
| Multi-tenant | No | Sí — Organization → Workspace → Client |
| Costes | Visible solo en la cuenta | Dashboard por usuario/workspace/org |

### 8.2 vs. No-Code Builders (Notion, Airtable, Monday)

| Dimensión | Notion/Airtable | ProTools Hub |
|---|---|---|
| Generación IA | Limitada a asistentes genéricos | Motor de generación con ToolSchema |
| Dominio | Horizontal — para todo | Vertical — operaciones de negocio |
| Workflows IA | No | Sí — con Execution Engine por nodo |
| Contexto empresa | No aprende | Business Memory por workspace |
| Planning | No | Intent + Planning Engine |

### 8.3 vs. ERPs y CRMs

| Dimensión | ERP/CRM | ProTools Hub |
|---|---|---|
| Tiempo de implementación | 3-18 meses | Segundos a minutos |
| Coste | €10K-€500K | SaaS por suscripción |
| Adaptabilidad | Configurable pero rígido | Generativo — se adapta al lenguaje del usuario |
| Soporte técnico | Requiere equipo IT | No-code completo |

### 8.4 Ventaja Diferencial Principal

**El Knowledge Graph de herramientas + Business Memory + Planning Engine** es la diferencia fundamental. Ningún competidor tiene un sistema que:
1. Entienda el objetivo empresarial en lenguaje natural
2. Genere un plan de 3 estrategias con scoring multi-dimensión
3. Seleccione herramientas compatibles según el contexto de la empresa
4. Genere un workflow ejecutable automáticamente
5. Aprenda del resultado para mejorar futuras sugerencias

---

## 9. Análisis Competitivo

### 9.1 Mapa de Competidores

```
Alta especialización en IA
         ↑
         │         ProTools Hub ★
         │
         │  ← Baja madurez →  ← Alta madurez
         │
    ChatGPT         Notion         SAP
    Claude          Airtable       Salesforce
    Gemini          Monday         HubSpot
         │
         ↓
Baja especialización en IA
```

### 9.2 Posicionamiento

ProTools Hub ocupa el cuadrante **"Alta especialización IA + Alta madurez de producto"** en el espacio de herramientas de operaciones empresariales. Es el único competidor con:
- Memoria empresarial persistente
- Motor de planificación con scoring
- Workflows IA con editor visual
- Audit trail Enterprise

---

## 10. Roadmap

### 10.1 Completado (Sprint 1-5.1 / RC-1A)

- [x] Auth multi-tenant con Clerk
- [x] Marketplace oficial con +50 herramientas
- [x] Execution Engine (Anthropic + OpenAI)
- [x] Workflow Engine con React Flow
- [x] Business Memory (perfil empresa, objetivos, activos, procesos, riesgos)
- [x] Intent Engine con 35+ CanonicalGoals
- [x] Planning Engine (3 estrategias, scoring 6D, risk assessment)
- [x] Business Copilot (máquina de estados 6 fases)
- [x] Analytics + Audit + IA Usage dashboards
- [x] Import Engine (CSV, Excel, PDF, DOCX, JSON)
- [x] RC-1A Layout Bugfix (WorkspaceShell consistente en toda la app)

### 10.2 Próximas Fases (Post RC-1A)

#### Fase 2 — Intelligence Layer
- [ ] Decision Engine — motor de decisión automática basado en datos históricos
- [ ] AI Router — selección dinámica de modelo según coste/calidad/velocidad
- [ ] Tool Compatibility Graph — recomendaciones inter-herramienta
- [ ] Business Memory Auto-update — actualización automática desde ejecuciones

#### Fase 3 — Collaboration & Scale
- [ ] Workspace sharing entre organizaciones
- [ ] Tool marketplace público (community tier)
- [ ] API pública documentada para integraciones externas
- [ ] Webhooks outbound para integraciones

#### Fase 4 — Enterprise
- [ ] SSO SAML para Enterprise
- [ ] Audit export a CSV/PDF para auditoras externas
- [ ] Custom domains
- [ ] SLA garantizado con uptime dashboard

#### Fase 5 — Platform
- [ ] SDK para crear herramientas programáticamente
- [ ] Plugin system para providers de IA adicionales
- [ ] White-label para consultoras partner

---

## 11. Modelo SaaS

### 11.1 Planes Actuales (Beta)

| Plan | Descripción | Estado |
|---|---|---|
| `trial_personal` | Email personal, límites reducidos | Activo en beta |
| `trial_business` | Email empresarial, límites ampliados | Activo en beta |
| `blocked` | Acceso bloqueado (email desechable o fraude) | Activo en beta |

> El modelo de planes está implementado en `src/lib/plan-limits.ts` y controlado por el campo `trialPlan` en el modelo `User`.

### 11.2 Límites de Beta

| Límite | trial_personal | trial_business |
|---|---|---|
| Generaciones IA/día | 10 | 25 |
| Generaciones IA/mes | 100 | 500 |
| Herramientas instaladas | 10 | 50 |

Estos límites se configuran mediante variables de entorno:
```
MAX_AI_GENERATIONS_PER_USER_DAY=10
MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=20
MAX_AI_GENERATIONS_GLOBAL_DAY=50
MAX_AI_ESTIMATED_COST_DAY_EUR=2.0
```

### 11.3 Modelo de Monetización Previsto

| Nivel | Target | Precio estimado |
|---|---|---|
| **Starter** | Autónomos, freelancers | €29/mes |
| **Professional** | Consultoras 2-10 usuarios | €79/mes |
| **Business** | Departamentos 10-50 usuarios | €249/mes |
| **Enterprise** | Organizaciones 50+ usuarios | Negociado |

El modelo es una combinación de:
- **Suscripción mensual** por usuario/workspace
- **Consumo IA** por encima del incluido (créditos adicionales)
- **Herramientas premium** del marketplace (tier `premium`)

### 11.4 Unit Economics del Motor IA

El coste de la IA para ProTools Hub se estima así:

| Modelo | Input (€/1M tokens) | Output (€/1M tokens) | Ejecución típica |
|---|---|---|---|
| claude-sonnet-4-6 | ~€2.70 | ~€13.50 | ~€0.03-0.08 |
| gpt-4o-mini | ~€0.14 | ~€0.55 | ~€0.01-0.03 |
| claude-haiku-4-5 | ~€0.23 | ~€1.15 | ~€0.005-0.02 |

Con un precio de €29/mes y un uso moderado, el margen bruto estimado es del 70-85% dependiendo del tier.
