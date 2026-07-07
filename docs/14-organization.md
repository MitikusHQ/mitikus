# ProTools Hub — Documentación Oficial

## Documento 14 — Organization

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado

---

## Tabla de Contenidos

1. [Modelo Multi-tenant](#1-modelo-multi-tenant)
2. [Organization — La Raíz del Tenant](#2-organization--la-raíz-del-tenant)
3. [Ciclo de Vida de una Organización](#3-ciclo-de-vida-de-una-organización)
4. [Sincronización con Clerk](#4-sincronización-con-clerk)
5. [Panel de Organización (`/org`)](#5-panel-de-organización-org)
6. [Gestión de Miembros](#6-gestión-de-miembros)
7. [Escalado Multi-organización](#7-escalado-multi-organización)

---

## 1. Modelo Multi-tenant

ProTools Hub es **multi-tenant desde la primera línea de código**. La jerarquía es:

```
Organization (raíz del tenant)
├── User[] (miembros)
└── Workspace[]
    ├── Client[]
    ├── ToolInstance[]
    ├── Workflow[]
    └── CompanyProfile
```

**Aislamiento:** Todos los datos pertenecen a una `Organization`. Las queries siempre filtran por `orgId`. No existen datos compartidos entre organizaciones.

**Tipos de organización:**
1. **Personal** (`clerkOrgId = null`): Cuenta individual sin organización de Clerk
2. **Organizacional** (`clerkOrgId != null`): Vinculada a una organización en Clerk

---

## 2. Organization — La Raíz del Tenant

```prisma
model Organization {
  id         String   @id @default(cuid())
  clerkOrgId String?  @unique
  name       String
  sector     String?
  plan       Plan     @default(FREE)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  users      User[]
  workspaces Workspace[]
  auditLogs  AuditLog[]
}
```

### Campos

| Campo | Descripción |
|---|---|
| `id` | CUID interno |
| `clerkOrgId` | ID de la organización en Clerk (null para cuentas personales) |
| `name` | Nombre de la organización |
| `sector` | Sector económico (para personalización) |
| `plan` | Plan de suscripción (FREE/PRO) |

---

## 3. Ciclo de Vida de una Organización

### Creación

**Trigger:** Webhook de Clerk `user.created`

Cuando un nuevo usuario se registra:
1. Clerk crea el usuario y opcionalmente la organización
2. El webhook llama a `POST /api/webhooks/clerk`
3. El sistema crea:
   - `Organization` con `clerkOrgId` (o null para personal)
   - `User` vinculado a la org
4. Se redirige al onboarding

### Onboarding

**Ruta:** `/onboarding`

El onboarding completa:
- Nombre de la organización
- Sector
- Creación del primer Workspace

Sin onboarding completo, el usuario no puede acceder al dashboard.

### Eliminación

**Solo OWNER puede eliminar la organización.** La eliminación:
1. Borra en cascade: todos los Workspaces, Clientes, ToolInstances, AuditLogs
2. Los usuarios quedan sin organización (se les redirige a registro)
3. Se registra el evento en el AuditLog antes de borrar

---

## 4. Sincronización con Clerk

**Archivo:** `apps/web/src/app/api/webhooks/clerk/route.ts`

Clerk es el sistema de identidad. La DB de ProTools Hub sincroniza los cambios relevantes:

| Evento Clerk | Acción en DB |
|---|---|
| `user.created` | INSERT Organization (si aplica) + INSERT User |
| `user.updated` | UPDATE User (name, email) |
| `user.deleted` | Soft-delete o anonymize User |
| `organizationMembership.created` | INSERT User en la nueva org |
| `organizationMembership.updated` | UPDATE User.role |
| `organizationMembership.deleted` | Gestión de salida del miembro |

### Validación del Webhook

```typescript
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
try {
  const evt = wh.verify(body, {
    'svix-id':        svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  }) as WebhookEvent
} catch (err) {
  return new Response('Error: Invalid signature', { status: 400 })
}
```

### Mapeo de Roles Clerk → OrgRole

```typescript
function mapClerkRole(clerkRole: string): OrgRole {
  switch (clerkRole) {
    case 'org:admin':   return 'ADMIN'
    case 'org:member':  return 'MEMBER'
    default:            return 'VIEWER'
  }
}
```

El rol `OWNER` solo se asigna manualmente al creador de la organización.

---

## 5. Panel de Organización (`/org`)

**Ruta:** `/org`  
**Acceso:** Solo OWNER y ADMIN

El panel muestra:
- Información de la organización (nombre, sector, plan)
- Lista de workspaces con estadísticas rápidas
- Gestión de miembros (invitar, cambiar rol, eliminar)
- Uso global de IA en la organización
- Configuración de límites (solo OWNER)

---

## 6. Gestión de Miembros

Los miembros se gestionan **principalmente desde el panel de Clerk** (dashboard de Clerk). ProTools Hub sincroniza los cambios automáticamente vía webhook.

### Invitación de Miembros

1. El ADMIN/OWNER invita desde el panel de Clerk
2. El invitado recibe un email de Clerk
3. Al aceptar, Clerk crea la membresía
4. El webhook crea el `User` en ProTools Hub con el rol asignado

### Cambio de Rol

1. OWNER/ADMIN cambia el rol en Clerk
2. Webhook `organizationMembership.updated` sincroniza el cambio
3. El nuevo rol aplica inmediatamente en las queries de permisos

### Expulsión de Miembros

1. ADMIN/OWNER elimina la membresía en Clerk
2. Webhook gestiona la salida
3. El `User` queda en DB (para preservar audit trail) pero sin acceso

---

## 7. Escalado Multi-organización

Un mismo email puede pertenecer a múltiples organizaciones en Clerk, pero en ProTools Hub cada `User` está vinculado a **una sola** `Organization` (`orgId: String`).

**Caso de uso:** Un consultor que trabaja en varias organizaciones necesitaría cuentas separadas.

**Roadmap (no implementado):** El campo `clerkOrgId` y la arquitectura de datos permite añadir soporte multi-organización por usuario en el futuro sin cambios de schema.
