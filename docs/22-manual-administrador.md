# ProTools Hub — Documentación Oficial

## Documento 22 — Manual del Administrador

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Audiencia:** OWNER y ADMIN de la organización

---

## Tabla de Contenidos

1. [Primeros Pasos](#1-primeros-pasos)
2. [Gestión de Organización](#2-gestión-de-organización)
3. [Gestión de Workspaces](#3-gestión-de-workspaces)
4. [Gestión de Miembros](#4-gestión-de-miembros)
5. [Configuración de Límites IA](#5-configuración-de-límites-ia)
6. [Auditoría y Compliance](#6-auditoría-y-compliance)
7. [Backup y Recuperación](#7-backup-y-recuperación)
8. [Resolución de Problemas](#8-resolución-de-problemas)

---

## 1. Primeros Pasos

### 1.1 Acceso Inicial

Tras el registro, el sistema redirige al **onboarding** (`/onboarding`):

1. **Nombre de la organización:** Nombre legal o comercial
2. **Sector:** Seleccionar el sector más cercano al negocio
3. **Primer Workspace:** Crear el workspace inicial (puede renombrarse después)

Tras el onboarding, el usuario queda en el **Dashboard** del primer workspace.

### 1.2 Panel de Organización

Accesible desde el menú superior → **Organización** (`/org`).

El panel de organización muestra:
- Resumen de workspaces y miembros
- Uso global de IA en el período
- Acceso a configuración y miembros

---

## 2. Gestión de Organización

### 2.1 Editar Información

En `/org` → **Configuración**:
- Nombre de la organización
- Sector económico

Los cambios son inmediatos y aplican a toda la organización.

### 2.2 Eliminar Organización

**Solo el OWNER puede eliminar la organización.**

La eliminación es **irreversible** y borra:
- Todos los workspaces
- Todos los clientes
- Todas las herramientas instaladas
- Todos los workflows
- Todo el historial de ejecuciones
- Todo el Audit Log

Para eliminar: `/org` → **Configuración** → **Zona de peligro** → **Eliminar organización** → Confirmar con el nombre de la organización.

---

## 3. Gestión de Workspaces

### 3.1 Crear Workspace

`/org` → **Workspaces** → **Nuevo Workspace**

Campos:
- **Nombre:** Descriptivo del área o cliente (ej. "Departamento de Calidad", "Cliente ACME")
- El **slug** se genera automáticamente desde el nombre (editable)

### 3.2 Editar Workspace

Desde la lista de workspaces, hacer click en el workspace → **Configuración**.

### 3.3 Eliminar Workspace

`/workspace/[id]` → **Configuración** → **Eliminar Workspace**

La eliminación borra todos los datos del workspace (herramientas, workflows, registros).

### 3.4 Buenas Prácticas

Para **consultoras:** Un workspace por cliente.
```
Organización: "Consultoría XYZ"
├── Workspace: "Cliente ACME"
├── Workspace: "Cliente BETA"
└── Workspace: "Interno"
```

Para **empresas:** Un workspace por departamento.
```
Organización: "Empresa ABC"
├── Workspace: "Calidad"
├── Workspace: "Recursos Humanos"
└── Workspace: "Ventas"
```

---

## 4. Gestión de Miembros

### 4.1 Invitar Miembros

La invitación se gestiona desde **Clerk** (panel de administración de Clerk):
1. Ir al dashboard de Clerk → **Organización** → **Miembros**
2. Hacer click en **Invitar**
3. Introducir el email y seleccionar el rol
4. El invitado recibe un email de Clerk
5. Al aceptar, el sistema crea automáticamente el usuario en ProTools Hub

> **Nota:** No hay gestión de miembros directamente en ProTools Hub — se hace desde Clerk.

### 4.2 Roles Disponibles

| Rol | Descripción | Cuándo usar |
|---|---|---|
| **OWNER** | Acceso total + gestión de la org | Solo el fundador/propietario |
| **ADMIN** | Gestión de miembros y configuración | Responsables de área |
| **EDITOR** | Crear/editar herramientas y workflows | Consultores, analistas |
| **OPERATOR** | Solo ejecutar herramientas | Usuarios del día a día |
| **VIEWER** | Solo lectura | Clientes, directivos que consultan |

### 4.3 Cambiar Rol

Desde Clerk → **Organización** → **Miembros** → Cambiar rol del usuario.

El cambio aplica inmediatamente en ProTools Hub.

### 4.4 Eliminar Miembro

Desde Clerk → **Organización** → **Miembros** → Eliminar al usuario.

El usuario pierde acceso inmediatamente. Sus datos históricos (ejecuciones, registros) se preservan para auditoría.

---

## 5. Configuración de Límites IA

### 5.1 Límites Actuales (Beta)

Los límites de IA se configuran mediante **variables de entorno** del servidor. En la versión beta no hay UI para cambiarlos sin acceso al servidor.

```bash
MAX_AI_GENERATIONS_PER_USER_DAY=10
MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=20
MAX_AI_GENERATIONS_GLOBAL_DAY=50
MAX_AI_ESTIMATED_COST_DAY_EUR=2.0
```

### 5.2 Ver Consumo Actual

`/workspace/[id]/usage` → Panel de administración (solo OWNER/ADMIN).

Muestra:
- Consumo del día vs. límite
- Consumo del mes
- Distribución por usuario
- Coste estimado en EUR

### 5.3 Alertas de Límite

Cuando un usuario alcanza el 80% de su límite diario:
- La barra de progreso en `/usage` se vuelve naranja
- Los intentos adicionales devuelven error 429

Cuando el límite se alcanza:
- La barra se vuelve roja
- El usuario ve el mensaje "Has alcanzado tu límite diario de generaciones IA"
- Se registra el evento `rate_limit.exceeded` en el AuditLog

---

## 6. Auditoría y Compliance

### 6.1 Acceso al Audit Log

`/workspace/[id]/audit` (solo OWNER/ADMIN)

El Audit Log muestra todas las acciones en el workspace con:
- Quién lo hizo (actor)
- Qué hizo (acción)
- En qué entidad
- Resultado (éxito/fallo/denegado)
- Timestamp exacto

### 6.2 Filtros de Auditoría

| Filtro | Opciones |
|---|---|
| Acción | tool.install, tool.execute, workflow.create, etc. |
| Tipo de entidad | tool_instance, workflow, workspace, etc. |
| Actor | Cualquier miembro de la organización |
| Resultado | success, failure, denied |
| Período | Últimas 24h, 7 días, 30 días, personalizado |

### 6.3 Exportación (Roadmap)

La exportación del Audit Log a CSV/PDF para auditoras externas está en el roadmap de la versión Enterprise. Actualmente, los registros son accesibles directamente en la base de datos PostgreSQL.

### 6.4 Retención del Audit Log

El Audit Log **nunca se borra** automáticamente. Los registros son inmutables. Solo la eliminación de la organización borra el Audit Log en cascade.

---

## 7. Backup y Recuperación

### 7.1 Backup de la Base de Datos

ProTools Hub no incluye un sistema de backup automático en el MVP. Se recomienda:

1. **Backups automáticos** de PostgreSQL (pg_dump) — configurar en el servidor
2. **Retención:** Mínimo 30 días de histórico
3. **Testing:** Verificar la restauración mensualmente

```bash
# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restaurar
psql $DATABASE_URL < backup_20260629.sql
```

### 7.2 Datos No Recuperables

Si se elimina accidentalmente:
- Una **Organización** → Todos los datos son irrecuperables (excepto desde backup)
- Un **Workspace** → Todos los datos del workspace son irrecuperables
- Un **ToolRecord** → El registro está marcado `isDeleted=true` — recuperable por la DB

### 7.3 Recuperación de Records Eliminados

Los `ToolRecord` se eliminan con **soft delete** (`isDeleted=true`). Para recuperar:

```sql
UPDATE tool_records 
SET is_deleted = false, deleted_at = null 
WHERE id = 'record_id_here';
```

Esta operación requiere acceso directo a la base de datos.

---

## 8. Resolución de Problemas

### 8.1 Usuario No Puede Acceder

**Síntoma:** El usuario ve la pantalla de login o el onboarding aunque ya registrara su cuenta.

**Causa probable:** El webhook de Clerk no procesó la creación del usuario correctamente.

**Solución:**
1. Verificar en la base de datos que el usuario existe: `SELECT * FROM users WHERE email = 'usuario@ejemplo.com'`
2. Si no existe, forzar un re-sync desde Clerk: Dashboard Clerk → Usuario → Reenviar webhook

---

### 8.2 Ejecución IA Falla con Error 429

**Síntoma:** Al ejecutar una herramienta, aparece "Has alcanzado tu límite diario".

**Causa:** El usuario ha superado el límite de generaciones IA del día.

**Solución:**
- El límite se resetea a medianoche (UTC)
- Un ADMIN puede aumentar los límites editando las variables de entorno del servidor y reiniciando la aplicación

---

### 8.3 Workflow Falla en un Nodo Específico

**Síntoma:** El workflow se ejecuta parcialmente y un nodo queda en estado `FAILED`.

**Diagnóstico:**
1. Ir a `/workspace/[id]/workflows/[id]/executions/[execId]`
2. Expandir el nodo fallido
3. Leer el log de error

**Causas comunes:**
- El campo de la herramienta no tiene valor (variable no rellenada)
- La interpolación de variable falló (`{{variables.key}}` no existe)
- Timeout de la API de IA (aumentar `maxTokens` o simplificar el input)

---

### 8.4 Herramienta No Genera Resultado Esperado

**Síntoma:** La herramienta ejecuta pero el resultado no es útil o relevante.

**Causa probable:** El system prompt o las instrucciones no son suficientemente específicas.

**Solución:**
1. Ir a la configuración de la instancia de la herramienta
2. En `customInstructions`, añadir contexto específico del sector o empresa
3. Si necesario, usar `systemPromptOverride` para reemplazar el prompt completo

---

### 8.5 El Copilot No Reconoce el Objetivo

**Síntoma:** El Copilot no avanza de la fase `understanding` o siempre pregunta.

**Causa:** El Intent Engine no detectó un goal con confidence ≥ medium.

**Solución:**
- Ser más específico en el mensaje: "Quiero preparar la certificación ISO 9001" vs. "mejorar calidad"
- Completar el Business Memory con el sector de la empresa — mejora el contexto del Intent Engine
