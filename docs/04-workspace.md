# ProTools Hub — Documentación Oficial

## Documento 04 — Workspace

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

## Tabla de Contenidos

1. [Qué es un Workspace](#1-qué-es-un-workspace)
2. [Arquitectura del WorkspaceShell](#2-arquitectura-del-workspaceshell)
3. [Navegación y Rutas](#3-navegación-y-rutas)
4. [Páginas del Workspace](#4-páginas-del-workspace)
5. [Patrones de Layout](#5-patrones-de-layout)
6. [Clientes dentro del Workspace](#6-clientes-dentro-del-workspace)
7. [Creación y Configuración](#7-creación-y-configuración)

---

## 1. Qué es un Workspace

Un **Workspace** es la unidad operativa principal en ProTools Hub. Dentro de una organización pueden existir múltiples workspaces para:
- Separar departamentos (Calidad, RRHH, Ventas)
- Gestionar diferentes clientes de una consultora
- Aislar proyectos o áreas de negocio

**Relación en el modelo:** `Organization → [Workspace+] → Client → ToolInstance`

Cada workspace tiene:
- Sus propias herramientas instaladas (`ToolInstance`)
- Sus propios clientes (`Client`)
- Sus propios workflows
- Su propio perfil de empresa (`CompanyProfile`)
- Sus propias conversaciones con el Copilot

El workspace tiene un `slug` único dentro de la organización, usado en las URLs:
```
/workspace/[workspaceId]/
```

---

## 2. Arquitectura del WorkspaceShell

El `WorkspaceShell` es el componente React que provee el layout completo de todas las páginas del workspace.

**Archivo:** `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`

```
WorkspaceShell (Client Component)
├── <TopBar>          — Breadcrumb, nombre del workspace, acciones globales
├── <SideBar>         — Navegación principal
│   ├── Dashboard
│   ├── Herramientas
│   ├── Workflows
│   ├── Clientes
│   ├── Copilot
│   ├── Analytics
│   ├── Auditoría
│   └── Configuración
└── <main>            — Contenido de la página (children)
```

**Regla crítica:** Las páginas que se renderizan dentro del `WorkspaceShell` NO deben añadir sus propios elementos shell (`<header>`, `<main>`, `<nav>`). El shell ya los provee. Las páginas son el `children` de `<main>`.

### Patrón de Root Correcto en Páginas

```tsx
// ✅ CORRECTO — página dentro del WorkspaceShell
export default async function SomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* contenido */}
    </div>
  )
}

// ❌ INCORRECTO — duplica shell elements
export default async function SomePage() {
  return (
    <main className="...">  {/* WorkspaceShell ya tiene <main> */}
      <header>...</header>  {/* WorkspaceShell ya tiene TopBar */}
    </main>
  )
}
```

---

## 3. Navegación y Rutas

### Estructura de Rutas

```
app/
├── (auth)/
│   ├── sign-in/            → /sign-in
│   ├── sign-up/            → /sign-up
│   └── sso-callback/       → /sso-callback
│
├── (dashboard)/
│   ├── layout.tsx          → Layout raíz (verifica auth y org)
│   ├── org/                → /org (panel de organización)
│   └── workspace/[workspaceId]/
│       ├── layout.tsx      → WorkspaceShell
│       ├── page.tsx        → /workspace/[id]         Dashboard
│       ├── analytics/      → /workspace/[id]/analytics
│       ├── audit/          → /workspace/[id]/audit
│       ├── clients/        → /workspace/[id]/clients
│       ├── copilot/        → /workspace/[id]/copilot
│       ├── generate/       → /workspace/[id]/generate
│       ├── import/         → /workspace/[id]/import
│       ├── tools/          → /workspace/[id]/tools  (herramientas instaladas)
│       │   └── [instanceId]/ → /workspace/[id]/tools/[instanceId]
│       ├── usage/          → /workspace/[id]/usage
│       └── workflows/[workflowId]/ → Editor de workflow
│
├── onboarding/             → /onboarding
└── tools/                  → /tools (Marketplace — standalone, fuera del dashboard)
```

### Nota sobre el Marketplace

La ruta `/tools` (Marketplace) es **standalone** — no pertenece al grupo `(dashboard)` y tiene su propio layout completo con `<header>` y `<main>`. Esto es correcto e intencional: el marketplace es accesible desde fuera del contexto de un workspace.

---

## 4. Páginas del Workspace

### 4.1 Dashboard (`page.tsx`)

Vista general del workspace. Muestra:
- Estadísticas rápidas (herramientas instaladas, ejecuciones recientes, coste del período)
- Accesos directos a las últimas herramientas usadas
- Estado del Business Memory (confianza del perfil)

**Patrón de carga:** Server Component con `requireUser()` + queries paralelas en `Promise.all`.

---

### 4.2 Herramientas Instaladas (`tools/`)

Vista de todas las `ToolInstance` del workspace. Permite:
- Ver el historial de registros por instancia
- Ejecutar la herramienta con IA
- Configurar los parámetros de IA de la instancia
- Compartir la instancia (toggle `shareEnabled`)
- Archivar la instancia

**Vista de detalle:** `tools/[instanceId]/` — muestra:
- Los registros del ToolRecord
- El historial de ejecuciones (`ToolExecution`)
- El formulario de ejecución IA
- La configuración de la instalación

---

### 4.3 Copilot (`copilot/`)

El Business Copilot — Director de Operaciones IA.

**Layout:** Grid `lg:grid-cols-3`
- Panel izquierdo (`lg:col-span-1`): CompanyContext + Objectives + Risks
- Panel principal (`lg:col-span-2`): CopilotInterface (Client Component)

**Carga del servidor:**
```typescript
const [context, suggestions] = await Promise.all([
  getBusinessContext(workspaceId),
  getCopilotSuggestions(workspaceId),
])
```

Ver [Doc 12 — Business Copilot] para el detalle del motor.

---

### 4.4 Analytics (`analytics/`)

Dashboard de métricas de uso del workspace.

Componentes:
- `MetricCard` — métricas numéricas con tendencia
- `BarChart` / `DonutChart` — visualizaciones de uso por herramienta
- `HorizontalBarList` — ranking de herramientas más usadas
- `AnalyticsInsights` — insights generados con patrones de uso
- `RangeSelector` — selector de período (7d, 30d, 90d)

---

### 4.5 Auditoría (`audit/`)

Timeline de eventos del Audit Log filtrado por workspace.

Componentes:
- `AuditTimeline` — lista cronológica de eventos
- `AuditFilters` — filtros por acción, entidad, actor, resultado
- `AuditEventRow` — fila de evento con metadata expandible
- `AuditEntityBadge` / `AuditResultBadge` — indicadores visuales

---

### 4.6 Uso IA (`usage/`)

Dashboard de consumo de IA por el workspace.

Componentes:
- Métricas de tokens por período
- Coste estimado en EUR
- Distribución por modelo
- `AdminPanel` — gestión de límites (solo OWNER/ADMIN)

**Ancho de columna:** `max-w-3xl` (más estrecho que analytics — apropiado para contenido de métricas)

---

### 4.7 Generar (`generate/`)

Interfaz para generar nuevas herramientas desde lenguaje natural. Crea un `GenerationRequest` y llama al Execution Engine para generar el `ToolSchemaV1`.

---

### 4.8 Importar (`import/`)

Interfaz para importar herramientas desde archivos existentes (CSV, Excel, PDF, DOCX, JSON). Usa el Import Engine del package `@protools/import-engine`.

---

### 4.9 Workflows (`workflows/[workflowId]/`)

Editor visual de workflows basado en React Flow. Permite:
- Añadir nodos (herramientas)
- Conectar nodos con aristas
- Configurar variables y mapeos de input
- Ejecutar el workflow

Ver [Doc 10 — Workflow Engine] para el detalle.

---

### 4.10 Clientes (`clients/`)

CRUD de clientes del workspace. Permite:
- Crear/editar/archivar clientes
- Asociar herramientas a clientes específicos
- Ver las herramientas instaladas por cliente

---

## 5. Patrones de Layout

### Ancho de Contenido por Página

| Página | Clase max-width | Razón |
|---|---|---|
| Dashboard | `max-w-6xl` | Múltiples columnas de estadísticas |
| Copilot | `max-w-5xl` | Grid 3 columnas |
| Analytics | `max-w-5xl` | Charts y tablas anchas |
| Audit | `max-w-5xl` | Lista de eventos con detalles |
| Usage | `max-w-3xl` | Métricas compactas |
| Generate | `max-w-2xl` | Formulario centrado |
| Import | `max-w-2xl` | Upload y progreso |

### Estructura de Espaciado

Todas las páginas usan la misma estructura base:
```tsx
<div className="max-w-Ncl mx-auto px-6 py-8 space-y-8">
  {/* Secciones de la página */}
</div>
```

---

## 6. Clientes dentro del Workspace

Un `Client` representa a una empresa o persona a quien se le presta servicio.

### Uso en la Práctica

Una consultora usa ProTools Hub así:
- **Workspace:** "Consultoría A"
- **Clients:** "Cliente ACME", "Cliente BETA", "Cliente GAMMA"
- Cada cliente tiene sus propias `ToolInstance` con sus datos

### Asociación de Herramientas a Clientes

Al instalar una herramienta, el usuario puede:
1. Instalarla a nivel de workspace (sin cliente) — para uso general
2. Instalarla para un cliente específico — datos aislados por cliente

La `ToolInstance` tiene el campo `clientId: String?`. Un workspace puede tener:
- Instancias sin cliente (compartidas)
- Instancias por cliente (aisladas)

---

## 7. Creación y Configuración

### Crear un Workspace

La creación de workspace ocurre durante el onboarding o desde el panel de organización (`/org`).

Campos requeridos:
- `name` — Nombre del workspace
- `slug` — Identificador único en la org (autogenerado desde el nombre)

La creación registra un evento `workspace.create` en el AuditLog.

### Permisos de Acceso

El acceso al workspace está controlado por el rol del usuario en la organización:

| Acción | OWNER | ADMIN | EDITOR | OPERATOR | VIEWER |
|---|---|---|---|---|---|
| Ver el workspace | ✓ | ✓ | ✓ | ✓ | ✓ |
| Instalar herramientas | ✓ | ✓ | ✓ | — | — |
| Ejecutar herramientas | ✓ | ✓ | ✓ | ✓ | — |
| Crear workflows | ✓ | ✓ | ✓ | — | — |
| Ver analytics/audit | ✓ | ✓ | — | — | — |
| Gestionar clientes | ✓ | ✓ | ✓ | — | — |
| Eliminar workspace | ✓ | — | — | — | — |

> Referencia de permisos completa: `apps/web/src/lib/permissions.ts`
