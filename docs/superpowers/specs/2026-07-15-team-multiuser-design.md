# Diseño: Multi-usuario y roles de equipo — MITIKUS

**Fecha:** 2026-07-15  
**Estado:** Aprobado  
**Scope:** Una org → un workspace → equipo completo con roles

---

## 1. Contexto

MITIKUS es actualmente una plataforma individual. Cada usuario tiene su propia org y workspace. El objetivo es permitir que una consultora IT tenga un único espacio compartido donde varios trabajadores colaboren con distintos niveles de acceso.

Los clientes finales **no tienen cuenta** en MITIKUS — reciben los resultados como exports (PDF, email, texto).

---

## 2. Roles y permisos

Se usan los `OrgRole` ya existentes en el schema de Prisma. Solo se activan cuatro de los seis disponibles:

| Rol MITIKUS | OrgRole BD | Descripción |
|-------------|-----------|-------------|
| Owner / CEO | `OWNER` | Único por org. Define categorías activas, gestiona billing, acceso total |
| Admin | `ADMIN` | Invita/elimina miembros, cambia roles, crea herramientas |
| Consultor | `EDITOR` | Ejecuta herramientas, crea registros, exporta resultados |
| Viewer | `VIEWER` | Solo lectura y exportación |

### Matriz de permisos

| Acción | OWNER | ADMIN | EDITOR | VIEWER |
|--------|-------|-------|--------|--------|
| Gestionar miembros (invitar, cambiar rol, eliminar) | ✅ | ✅ | ❌ | ❌ |
| Definir categorías activas de la org | ✅ | ❌ | ❌ | ❌ |
| Crear/editar/eliminar herramientas | ✅ | ✅ | ❌ | ❌ |
| Ejecutar herramientas con IA | ✅ | ✅ | ✅ | ❌ |
| Ver resultados del equipo | ✅ | ✅ | ✅ | ✅ |
| Exportar (PDF / email / texto) | ✅ | ✅ | ✅ | ✅ |
| Acceso a billing | ✅ | ❌ | ❌ | ❌ |

---

## 3. Flujo de invitación por link interno

### Modelo de datos — tabla nueva `OrgInvitation`

```prisma
model OrgInvitation {
  id          String    @id @default(cuid())
  orgId       String
  email       String?               // opcional — el Admin puede no saber el email
  role        OrgRole               // rol que tendrá al aceptar
  token       String    @unique     // token seguro firmado (crypto.randomUUID())
  expiresAt   DateTime              // now + 7 días
  acceptedAt  DateTime?             // null = pendiente
  revokedAt   DateTime?             // null = activa
  createdBy   String                // userId del Admin que la creó

  org         Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([orgId])
  @@map("org_invitations")
}
```

### Flujo paso a paso

1. **Admin** va a Settings → Equipo → "Invitar miembro"
2. Elige rol (Admin / Consultor / Viewer) y pulsa "Generar link"
3. El sistema crea un `OrgInvitation` con token UUID y `expiresAt = now + 7d`
4. Se muestra el link `mitikus.com/invite/[token]` con botón "Copiar"
5. El Admin lo envía por el canal que prefiera (email, Slack, WhatsApp)
6. El invitado abre el link:
   - **Sin cuenta** → redirige a `/sign-up?redirect=/invite/[token]`, al terminar vuelve al token
   - **Con cuenta** → muestra pantalla de aceptación con nombre de org y rol asignado
   - **Token expirado o revocado** → mensaje claro, no hay acción posible
7. Al aceptar → se crea/actualiza el `User` con `orgId` de la org invitante y el `role` del token
8. El invitado accede al workspace directamente

### Rutas nuevas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/invite/[token]` | Page (pública) | Pantalla de aceptación de invitación |
| `POST /api/invitations` | API (Admin+) | Crea una invitación, devuelve el link |
| `POST /api/invitations/[token]/accept` | API (auth) | Acepta la invitación |
| `DELETE /api/invitations/[token]` | API (Admin+) | Revoca una invitación pendiente |

---

## 4. Gestión de miembros (Settings → Equipo)

Página accesible para OWNER y ADMIN con dos secciones:

### 4a. Miembros actuales
- Tabla: avatar, nombre, email, rol (dropdown editable por Admin/Owner), fecha de entrada
- Acción: cambiar rol (no se puede cambiar el rol del Owner ni degradar al único Admin)
- Acción: eliminar miembro (con confirmación — el usuario pierde acceso inmediatamente)

### 4b. Invitaciones pendientes
- Tabla: rol asignado, fecha de creación, fecha de expiración, estado (Activa / Expirada)
- Acción: copiar link de nuevo
- Acción: revocar (marca `revokedAt`)

---

## 5. Gestión de categorías (Settings → Categorías)

Solo visible para OWNER.

- Lista de todas las `ToolCategory` del sistema con toggle on/off
- Por defecto todas activas al crear la org
- Si una categoría se desactiva:
  - Los Admins no pueden crear herramientas de ese tipo
  - Las herramientas existentes de esa categoría se ocultan en el workspace (no se eliminan)
  - Si se reactiva, vuelven a aparecer

### Modelo de datos — campo nuevo en `Organization`

```prisma
enabledCategories  ToolCategory[]  @default([])  // vacío = todas activas
```

Semántica: array vacío → todas activas (comportamiento por defecto). Array con valores → solo esas activas. Esto evita tener que migrar orgs existentes.

---

## 6. Guards en la UI

- Los botones de acción se renderizan condicionalmente según el rol del usuario en sesión
- El rol se lee desde `user.role` (ya disponible en sesión vía Clerk + DB)
- Los endpoints de API validan el rol server-side — la UI es solo UX, no seguridad
- Un VIEWER que acceda directamente a una URL de ejecución recibe 403

---

## 7. Qué NO entra en este scope

- Invitaciones por email transaccional (Resend/SendGrid) — el Admin copia y pega el link
- Permisos a nivel de herramienta individual (una herramienta visible solo para ciertos consultores)
- Workspaces múltiples por org
- Clientes con acceso a MITIKUS

---

## 8. Impacto en código existente

| Área | Cambio |
|------|--------|
| `schema.prisma` | +`OrgInvitation` model, +`enabledCategories` en `Organization` |
| `middleware.ts` | Añadir `/invite/(.*)` a rutas públicas |
| `api/invitations/` | 3 endpoints nuevos |
| `app/invite/[token]/` | Page nueva (pública) |
| `app/(dashboard)/settings/` | Páginas Equipo + Categorías |
| Guards en layout/pages | Condicionar acciones según `user.role` |
| `api/execute-tool` | Añadir check VIEWER → 403 |
