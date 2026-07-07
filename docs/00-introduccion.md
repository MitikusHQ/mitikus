# ProTools Hub — Documentación Oficial

## Documento 00 — Introducción y Guía de Lectura

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Clasificación:** Referencia Oficial

---

## Tabla de Contenidos

1. [Qué es ProTools Hub](#1-qué-es-protools-hub)
2. [Filosofía de Producto](#2-filosofía-de-producto)
3. [Principios de Diseño](#3-principios-de-diseño)
4. [Convenciones de la Documentación](#4-convenciones-de-la-documentación)
5. [Cómo Leer Esta Documentación](#5-cómo-leer-esta-documentación)
6. [Estructura Documental](#6-estructura-documental)
7. [Historial de Versiones](#7-historial-de-versiones)
8. [Glosario](#8-glosario)

---

## 1. Qué es ProTools Hub

ProTools Hub es una plataforma SaaS de automatización empresarial basada en inteligencia artificial. Permite a las organizaciones crear, instalar, ejecutar y orquestar herramientas de negocio generadas con IA, eliminar el trabajo repetitivo y tomar decisiones informadas apoyándose en un copiloto de dirección que aprende de la empresa.

**La propuesta central:** en lugar de adaptar el negocio a un software rígido, ProTools Hub genera el software a medida del negocio en segundos.

### 1.1 Posicionamiento

ProTools Hub no es:
- Un CRM
- Un ERP
- Un asistente de chat genérico
- Un constructor de formularios

ProTools Hub es una **plataforma de operaciones inteligente** que combina:

| Capacidad | Descripción |
|---|---|
| **Marketplace de herramientas** | Catálogo oficial de +50 herramientas de negocio por dominio |
| **Generación IA** | Creación de herramientas personalizadas desde lenguaje natural |
| **Workflow Engine** | Orquestación visual de cadenas de herramientas |
| **Business Memory** | Perfil persistente del conocimiento empresarial |
| **Business Copilot** | Director de Operaciones IA que planifica y propone estrategias |
| **Intent Engine** | Motor de interpretación de objetivos empresariales |
| **Planning Engine** | Motor de generación y ranking de planes de ejecución |
| **Analytics & Audit** | Telemetría completa con rastro de auditoría Enterprise |

### 1.2 Público Objetivo

ProTools Hub está diseñado para:

- **Directores de operaciones y gerentes generales** que necesitan estructurar procesos sin soporte IT
- **Consultoras y agencias de servicios profesionales** que trabajan con múltiples clientes
- **Departamentos de calidad, RRHH, ventas y marketing** con procesos repetitivos
- **Arquitectos y equipos de producto** que diseñan plataformas sobre ProTools Hub
- **Auditores internos y externos** que requieren trazabilidad Enterprise

---

## 2. Filosofía de Producto

### 2.1 No-code primero

El usuario no necesita saber programar. Describe en lenguaje natural lo que necesita y el sistema lo convierte en una herramienta estructurada, ejecutable y auditable.

### 2.2 La IA es el motor, no el conductor

La IA ejecuta las herramientas pero las decisiones son del usuario. El Copilot propone planes; el humano decide. El sistema nunca actúa sin confirmación explícita.

### 2.3 Todo es auditable

Cada acción en el sistema genera un registro inmutable en el `AuditLog`. Los costes IA son rastreados por usuario, workspace y organización. Los tokens y precios son transparentes.

### 2.4 Multi-tenant desde el inicio

El modelo de datos es multi-tenant desde la primera línea: `Organization → Workspace → Client → ToolInstance`. No hay datos compartidos entre organizaciones. El aislamiento es de nivel de base de datos.

### 2.5 Separación de capas

El sistema separa estrictamente:
- **Qué hace una herramienta** (ToolDefinition + schema)
- **Dónde se usa** (ToolInstance + workspace + client)
- **Cómo se configura** (ToolInstallationConfig)
- **Qué genera** (ToolExecution + ToolRecord)
- **Por qué se usó** (AuditLog + BusinessMemoryLog)

---

## 3. Principios de Diseño

### 3.1 SOLID aplicado a SaaS

| Principio | Aplicación en ProTools Hub |
|---|---|
| **S** — Single Responsibility | Cada engine tiene una única responsabilidad declarada |
| **O** — Open/Closed | Los providers AI son extensibles sin modificar el core |
| **L** — Liskov | `AIProvider` interface — Anthropic y OpenAI son intercambiables |
| **I** — Interface Segregation | `ToolRegistryMeta` y `ToolCapabilityProfile` separados por SOLID |
| **D** — Dependency Inversion | Los engines consumen tipos abstractos, no implementaciones |

### 3.2 Auditoría como ciudadano de primera clase

```typescript
// La auditoría es fire-and-forget y nunca bloquea el flujo principal
void audit({ orgId, action: 'tool.execute', entityType: 'tool_instance', ... })
```

### 3.3 Separación de Concerns en la UI

- **Server Components (RSC):** autenticación, datos, permisos
- **Client Components:** interactividad, estado, forms
- **WorkspaceShell:** layout único — las páginas no duplican shell

### 3.4 Schema as Truth

El `ToolSchemaV1` es el contrato entre la definición de una herramienta y todos los sistemas que la consumen. Está validado al crear/actualizar y almacenado como JSON en PostgreSQL.

---

## 4. Convenciones de la Documentación

### 4.1 Nomenclatura de archivos

| Prefijo | Tipo |
|---|---|
| `00-` a `25-` | Documentos principales numerados |
| `_lib/` | Tipos, helpers, constantes |
| `_components/` | Componentes React internos de la página |

### 4.2 Rutas de código

Los archivos se referencian desde la raíz del monorepo:

```
apps/web/src/lib/execution-engine.ts
packages/schema/src/tool-schema.ts
```

### 4.3 Diagramas

Todos los diagramas usan sintaxis Mermaid y son renderizables en GitHub, GitLab y herramientas de documentación compatibles.

### 4.4 Tipos y API

Los tipos TypeScript se muestran literales desde el código fuente. No se inventan tipos ni se simplifica la firma.

### 4.5 Afirmaciones

**Toda afirmación en esta documentación está respaldada por código existente o por el schema de base de datos.** Si algo aún no está implementado, se indica explícitamente con la etiqueta `[DISEÑO — No implementado]`.

---

## 5. Cómo Leer Esta Documentación

### 5.1 Por perfil

| Perfil | Documentos prioritarios |
|---|---|
| **Desarrollador nuevo** | 23 → 02 → 03 → 07 → 10 |
| **Arquitecto** | 02 → 03 → 07 → 08 → 09 → 11 |
| **Director de Producto** | 01 → 20 → 12 → 13 |
| **Administrador** | 22 → 14 → 15 → 16 |
| **Auditor / Compliance** | 03 → 15 → 13 → 24 |
| **Inversor / Due Diligence** | 01 → 02 → 20 → 25 |

### 5.2 Lectura secuencial recomendada

```
00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16
```

### 5.3 Referencias cruzadas

Los documentos se referencian entre sí con notación `[Doc NN]`. Los tipos de código se referencian con la ruta completa del archivo.

---

## 6. Estructura Documental

```
docs/
├── 00-introduccion.md              ← Este documento
├── 01-vision-producto.md
├── 02-arquitectura-general.md
├── 03-base-de-datos.md
├── 04-workspace.md
├── 05-marketplace.md
├── 06-tool-intelligence.md
├── 07-execution-engine.md
├── 08-intent-engine.md
├── 09-planning-engine.md
├── 10-workflow-engine.md
├── 11-business-memory.md
├── 12-business-copilot.md
├── 13-analytics-audit.md
├── 14-organization.md
├── 15-seguridad.md
├── 16-billing.md
├── 17-decision-engine.md           ← [DISEÑO]
├── 18-ai-router.md                 ← [DISEÑO]
├── 19-qa-sentinel.md
├── 20-historia-desarrollo.md
├── 21-biblioteca-superprompts.md
├── 22-manual-administrador.md
├── 23-manual-desarrollador.md
├── 24-api-reference.md
└── 25-changelog.md

documentation/docx/
└── [equivalentes en .docx generados desde Markdown]
```

---

## 7. Historial de Versiones

| Versión | Fecha | Descripción |
|---|---|---|
| 1.0 | 2026-06-29 | Primera versión oficial de la documentación completa |

---

## 8. Glosario

| Término | Definición |
|---|---|
| **ToolDefinition** | Plantilla reutilizable de una herramienta. Contiene el schema, descripción, categoría y metadatos. No tiene datos de cliente. |
| **ToolInstance** | Instalación de una ToolDefinition en un workspace/cliente concreto. Tiene configuración IA propia. |
| **ToolRecord** | Registro de datos creado mediante el uso de una ToolInstance. Almacena el mapa fieldId→valor. |
| **ToolExecution** | Registro de una llamada real a la API de IA para generar contenido. Incluye tokens, coste y resultado. |
| **Workflow** | Grafo dirigido de nodos (herramientas) conectados para ejecutarse en secuencia. |
| **WorkflowExecution** | Ejecución completa de un Workflow. Agrega el resultado de todos sus nodos. |
| **BusinessContext** | Objeto agregado con todo el conocimiento disponible sobre una empresa. Lo consumen los engines de IA. |
| **CopilotConversation** | Estado persistido de una sesión del Business Copilot. Máquina de estados con 6 fases. |
| **CanonicalGoal** | Objetivo empresarial normalizado. El Intent Engine traduce lenguaje natural a un CanonicalGoal. |
| **ExecutionPlan** | Plan de ejecución generado por el Planning Engine. Contiene fases, pasos, scores y riesgos. |
| **AIUsage** | Registro de cada llamada real a la API de Anthropic o OpenAI con tokens y coste en EUR. |
| **AuditLog** | Registro inmutable de cada acción relevante en el sistema. Nunca se elimina. |
| **BusinessMemoryLog** | Registro de cada cambio en el perfil de empresa, con fuente y nivel de confianza. |
| **WorkspaceShell** | Componente React que provee el layout completo del workspace (sidebar + topbar + main). |
| **Registry** | Catálogo oficial de herramientas con metadatos de búsqueda, ranking y clasificación. |
| **Capability Profile** | Perfil de inteligencia de una herramienta: qué hace, qué necesita, qué genera, con qué conecta. |
| **Provider** | Implementación de un proveedor de IA (Anthropic, OpenAI). Intercambiables vía interface. |
| **Intent Engine** | Motor que traduce texto libre en lenguaje natural a un `IntentResult` estructurado. |
| **Planning Engine** | Motor que convierte un `IntentResult` en uno o varios `ExecutionPlan` ordenados por score. |
| **Org** / **Organization** | Entidad raíz multi-tenant. Todos los datos pertenecen a una Org. |
| **Workspace** | Agrupación de herramientas, clientes y workflows dentro de una Org. |
| **CUID** | Identificador único generado por la librería `cuid`. Formato: `c...` de 25 caracteres. |
| **RSC** | React Server Component. Componente que se renderiza en el servidor con acceso a DB. |
| **Fire-and-forget** | Patrón de llamada asíncrona que no bloquea y no propaga errores al caller. Usado en `audit()`. |
