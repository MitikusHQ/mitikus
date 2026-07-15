# Diseño: Generación de workflows con IA

**Fecha:** 2026-07-15  
**Estado:** Aprobado  
**Scope:** Wizard modal conversacional que genera un workflow completo desde lenguaje natural

---

## 1. Contexto

Los workflows se crean hoy manualmente en un canvas ReactFlow. El usuario arrastra herramientas del catálogo y las conecta. El objetivo es permitir describir el workflow en lenguaje natural y que la IA lo genere automáticamente, instalando las herramientas necesarias si aún no están en el workspace.

---

## 2. Flujo de usuario

### Puntos de entrada

El botón **"Generar con IA"** aparece en dos sitios:

1. **`/workflows/new`** — como alternativa al formulario manual (dos columnas: formulario a la izquierda, CTA de IA a la derecha)
2. **Canvas vacío** — bloque central con icono y texto "Describe tu proceso y la IA monta el workflow" cuando el workflow no tiene nodos

### Modal de 3 pasos

**Paso 1 — Contexto**
- Campo: objetivo del workflow (texto libre, ej: "onboarding de nuevos clientes")
- Campo: sector o tipo de empresa (texto libre, ej: "consultoría IT")
- Botón: "Siguiente →"

**Paso 2 — Preguntas de la IA**
- La IA devuelve 2-3 preguntas cortas basadas en el contexto
- El usuario responde con texto libre
- Botón: "Generar workflow"

**Paso 3 — Preview y confirmación**
- Lista de nodos que se crearán (nombre + categoría + orden)
- Badge "Se instalará" en las herramientas que no están en el workspace
- Botón: "Crear workflow" → ejecuta instalación + creación + abre editor
- Botón: "← Volver a editar" → vuelve al paso 1 con los datos rellenados

### Post-confirmación
1. Se instalan automáticamente las herramientas marcadas como pendientes
2. Se crea el workflow con nombre generado por la IA
3. Se guardan los nodos y conexiones en secuencia lineal
4. Se redirige al editor con el canvas ya poblado

---

## 3. API

### `POST /api/workflows/generate`

**Request — paso "questions":**
```json
{
  "step": "questions",
  "objective": "onboarding de nuevos clientes",
  "sector": "consultoría IT"
}
```

**Response — paso "questions":**
```json
{
  "questions": [
    "¿Necesitas recopilar documentación del cliente antes de empezar?",
    "¿Quieres generar un informe final del proceso?",
    "¿El proceso incluye evaluación o scoring del cliente?"
  ]
}
```

**Request — paso "generate":**
```json
{
  "step": "generate",
  "objective": "onboarding de nuevos clientes",
  "sector": "consultoría IT",
  "answers": ["Sí, necesito recopilar contrato y NDA", "Sí, informe ejecutivo", "No"],
  "availableTools": [
    { "id": "...", "slug": "checklist-documentos", "name": "Checklist de documentos", "description": "...", "category": "checklist" }
  ]
}
```

**Response — paso "generate":**
```json
{
  "workflowName": "Onboarding de clientes — Consultoría IT",
  "nodes": [
    { "toolId": "cuid-xxx", "toolSlug": "checklist-documentos", "toolName": "Checklist de documentos", "label": "Recopilar documentación", "reason": "Para recopilar contrato y NDA antes de iniciar" },
    { "toolId": "cuid-yyy", "toolSlug": "ficha-cliente", "toolName": "Ficha de cliente", "label": "Registrar datos del cliente", "reason": "Datos básicos del cliente para el proceso" },
    { "toolId": "cuid-zzz", "toolSlug": "informe-ejecutivo", "toolName": "Informe ejecutivo", "label": "Generar informe final", "reason": "Resumen del proceso de onboarding" }
  ],
  "connectionsLinear": true
}
```

La IA solo puede seleccionar herramientas de `availableTools` (catálogo público). Si ninguna encaja, puede indicar `"toolId": null` y se omite ese nodo.

---

## 4. Lógica del servidor

```
POST /api/workflows/generate
  ├── step=questions → llamada Claude → devuelve preguntas
  └── step=generate
        ├── llamada Claude con herramientas disponibles → JSON de nodos
        ├── para cada nodo: verificar si toolInstance existe en workspace
        │   └── si no existe → llamar installToolFromRegistry(toolDefinitionId, workspaceId)
        ├── createWorkflow(workspaceId, workflowName)
        └── saveWorkflowGraph(workflowId, nodes, connections lineales)
```

Las conexiones son siempre lineales: nodo[0]→nodo[1]→nodo[2]... El usuario puede reordenar en el editor después.

Los límites de rate limiting de IA existentes (`checkAllLimits`) se aplican en ambas llamadas.

---

## 5. Componentes UI

| Archivo | Responsabilidad |
|---------|----------------|
| `workflows/new/page.tsx` | Añadir columna derecha con CTA "Generar con IA" |
| `workflows/[id]/_components/WorkflowEditor.tsx` | Detectar canvas vacío y mostrar CTA |
| `workflows/_components/AIWorkflowModal.tsx` | Modal 3 pasos (Client Component) |
| `api/workflows/generate/route.ts` | Endpoint que orquesta las dos llamadas a Claude |

---

## 6. Posicionamiento de nodos en el canvas

Los nodos se colocan en disposición horizontal con separación fija:

```
nodo[0]: x=100, y=200
nodo[1]: x=350, y=200
nodo[2]: x=600, y=200
...
```

Separación entre nodos: 250px en X. Si hay más de 5 nodos, se hace zigzag (alternando Y: 200 / 350) para que quepan en pantalla.

---

## 7. Qué NO entra en este scope

- Workflows con bifurcaciones o condicionales (la IA genera siempre secuencia lineal)
- Sugerir herramientas que no existen en el catálogo público (solo selecciona entre las disponibles)
- Generación incremental / chat en tiempo real dentro del canvas
- Guardado de workflows generados como plantillas reutilizables
