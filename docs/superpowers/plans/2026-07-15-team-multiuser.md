# Team Multi-usuario — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que varias personas de una misma empresa compartan un workspace MITIKUS con roles diferenciados (Owner, Admin, Editor, Viewer) y un flujo de invitación por link de 7 días.

**Architecture:** Se añaden dos modelos al schema (`OrgInvitation`, campo `enabledCategories` en `Organization`), tres API endpoints REST, una página pública `/invite/[token]`, y páginas de settings para gestionar equipo y categorías. El sistema de roles y permisos ya existe (`OrgRole`, `can()`, `assertCan()`), así que no se toca.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL (Railway), Clerk v6, TypeScript, Server Actions existentes en `src/app/actions/org.ts`.

---

## Mapa de ficheros

### Nuevos
- `apps/web/prisma/schema.prisma` — +`OrgInvitation` model, +`enabledCategories` en Organization
- `apps/web/src/app/api/invitations/route.ts` — POST (crear invitación)
- `apps/web/src/app/api/invitations/[token]/route.ts` — DELETE (revocar)
- `apps/web/src/app/api/invitations/[token]/accept/route.ts` — POST (aceptar)
- `apps/web/src/app/(public)/invite/[token]/page.tsx` — Página pública de aceptación
- `apps/web/src/app/(dashboard)/settings/team/page.tsx` — Settings → Equipo
- `apps/web/src/app/(dashboard)/settings/team/_components/InviteModal.tsx` — Modal crear invitación
- `apps/web/src/app/(dashboard)/settings/team/_components/PendingInvitationsTable.tsx` — Tabla invitaciones
- `apps/web/src/app/(dashboard)/settings/categories/page.tsx` — Settings → Categorías (solo OWNER)

### Modificados
- `apps/web/src/middleware.ts` — añadir `/invite/(.*)` a rutas públicas
- `apps/web/src/app/(dashboard)/org/team/page.tsx` — botón "Invitar" ya no disabled
- `apps/web/src/app/actions/org.ts` — +`removeMember`, +`listPendingInvitations`
- `apps/web/src/app/api/execute-tool/route.ts` — guard VIEWER → 403

---

## Task 1: Migración de base de datos

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Añadir `enabledCategories` a `Organization` y modelo `OrgInvitation`**

En `schema.prisma`, dentro del modelo `Organization` añadir al final (antes del cierre `}`):

```prisma
  enabledCategories  ToolCategory[]
```

Y añadir el nuevo modelo después de `Organization`:

```prisma
model OrgInvitation {
  id         String    @id @default(cuid())
  orgId      String
  email      String?
  role       OrgRole
  token      String    @unique @default(cuid())
  expiresAt  DateTime
  acceptedAt DateTime?
  revokedAt  DateTime?
  createdBy  String

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([orgId])
  @@map("org_invitations")
}
```

También añadir la relación inversa en `Organization`:

```prisma
  invitations        OrgInvitation[]
```

- [ ] **Step 2: Generar y aplicar la migración**

```bash
cd C:\Users\priet\protools-hub\apps\web
npx prisma migrate dev --name add_invitations_and_categories
```

Salida esperada: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verificar que el cliente Prisma se regeneró**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/prisma/schema.prisma apps/web/prisma/migrations/
git commit -m "feat(db): add OrgInvitation model and enabledCategories to Organization"
```

---

## Task 2: Middleware — ruta pública `/invite/[token]`

**Files:**
- Modify: `apps/web/src/middleware.ts`

- [ ] **Step 1: Añadir `/invite/(.*)` al matcher de rutas públicas**

En `src/middleware.ts`, en el array de `createRouteMatcher`, añadir la línea:

```typescript
  '/invite/(.*)',
```

Debe quedar entre `/shared/(.*)` y `/sitemap.xml`, por ejemplo.

- [ ] **Step 2: Verificar que el servidor arranca sin errores**

```bash
cd C:\Users\priet\protools-hub
npm run dev
```

Abrir `http://localhost:3002/invite/test` — debe renderizar (aunque no exista el token) sin redirigir a sign-in.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat(auth): add /invite/* to public routes"
```

---

## Task 3: Server actions — removeMember y listPendingInvitations

**Files:**
- Modify: `apps/web/src/app/actions/org.ts`

- [ ] **Step 1: Añadir tipo `PendingInvitation`**

Al bloque de tipos en `org.ts` (después de `OrgActivityItem`):

```typescript
export interface PendingInvitation {
  id: string
  email: string | null
  role: OrgRole
  roleLabel: string
  token: string
  expiresAt: string
  createdAt: string
  isExpired: boolean
}
```

- [ ] **Step 2: Añadir `removeMember` al final del fichero**

```typescript
export async function removeMember(
  targetUserId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const actor = await requireUser()
    assertCan(actor, 'manage_members', { orgId: actor.orgId, userId: actor.id, entityType: 'member', entityId: targetUserId })

    if (actor.id === targetUserId) return { error: 'No puedes eliminarte a ti mismo' }

    const target = await db.user.findFirst({ where: { id: targetUserId, orgId: actor.orgId } })
    if (!target) return { error: 'Usuario no encontrado' }
    if (target.role === 'OWNER') return { error: 'No se puede eliminar al propietario' }

    await db.user.delete({ where: { id: targetUserId } })

    audit({
      orgId: actor.orgId,
      actorUserId: actor.id,
      action: 'org.member_removed',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { targetEmail: target.email },
    })

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al eliminar miembro' }
  }
}
```

- [ ] **Step 3: Añadir `listPendingInvitations`**

```typescript
export async function listPendingInvitations(): Promise<PendingInvitation[] | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, 'manage_members', { orgId: user.orgId, userId: user.id })

    const invitations = await db.orgInvitation.findMany({
      where: { orgId: user.orgId, acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    const now = new Date()
    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      roleLabel: ROLE_LABELS[inv.role],
      token: inv.token,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      isExpired: inv.expiresAt < now,
    }))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al listar invitaciones' }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/actions/org.ts
git commit -m "feat(actions): add removeMember and listPendingInvitations"
```

---

## Task 4: API — POST /api/invitations (crear invitación)

**Files:**
- Create: `apps/web/src/app/api/invitations/route.ts`

- [ ] **Step 1: Crear el fichero**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'
import type { OrgRole } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_INVITE_ROLES: OrgRole[] = ['ADMIN', 'EDITOR', 'VIEWER']
const TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const actor = await requireUser()
    assertCan(actor, 'manage_members', { orgId: actor.orgId, userId: actor.id })

    const body: { role?: string; email?: string } = await req.json().catch(() => ({}))
    const role = body.role as OrgRole | undefined
    const email = body.email?.trim().toLowerCase() || null

    if (!role || !VALID_INVITE_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido. Usa ADMIN, EDITOR o VIEWER.' }, { status: 400 })
    }

    // Solo OWNER puede invitar ADMINs
    if (role === 'ADMIN' && actor.role !== 'OWNER') {
      return NextResponse.json({ error: 'Solo el propietario puede invitar administradores.' }, { status: 403 })
    }

    const invitation = await db.orgInvitation.create({
      data: {
        orgId: actor.orgId,
        email,
        role,
        expiresAt: new Date(Date.now() + TTL_MS),
        createdBy: actor.id,
      },
    })

    audit({
      orgId: actor.orgId,
      actorUserId: actor.id,
      action: 'org.invitation_created',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { role, email },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.mitikus.com'
    const link = `${appUrl}/invite/${invitation.token}`

    return NextResponse.json({ token: invitation.token, link, expiresAt: invitation.expiresAt })
  } catch (e) {
    if ((e as Error).message?.includes('Sin permisos')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Probar manualmente (opcional)**

Con el servidor corriendo, usar curl o una herramienta REST para verificar que `POST /api/invitations` con `{role: "EDITOR"}` devuelve un objeto con `link`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/invitations/route.ts
git commit -m "feat(api): POST /api/invitations — create invitation link"
```

---

## Task 5: API — DELETE y POST /accept para invitaciones

**Files:**
- Create: `apps/web/src/app/api/invitations/[token]/route.ts`
- Create: `apps/web/src/app/api/invitations/[token]/accept/route.ts`

- [ ] **Step 1: Crear `[token]/route.ts` (DELETE — revocar)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const actor = await requireUser()
    assertCan(actor, 'manage_members', { orgId: actor.orgId, userId: actor.id })

    const invitation = await db.orgInvitation.findFirst({
      where: { token, orgId: actor.orgId, acceptedAt: null, revokedAt: null },
    })
    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada o ya no está activa' }, { status: 404 })
    }

    await db.orgInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    })

    audit({
      orgId: actor.orgId,
      actorUserId: actor.id,
      action: 'org.invitation_revoked',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { token },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if ((e as Error).message?.includes('Sin permisos')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Crear `[token]/accept/route.ts` (POST — aceptar)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const user = await requireUser()

    const invitation = await db.orgInvitation.findUnique({ where: { token } })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }
    if (invitation.revokedAt) {
      return NextResponse.json({ error: 'Esta invitación ha sido revocada' }, { status: 410 })
    }
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Esta invitación ya fue aceptada' }, { status: 410 })
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Esta invitación ha caducado' }, { status: 410 })
    }

    // Actualizar usuario: cambiar org y rol
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { orgId: invitation.orgId, role: invitation.role },
      }),
      db.orgInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ])

    audit({
      orgId: invitation.orgId,
      actorUserId: user.id,
      action: 'org.invitation_accepted',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { role: invitation.role },
    })

    return NextResponse.json({ ok: true, orgId: invitation.orgId })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/invitations/
git commit -m "feat(api): DELETE /api/invitations/[token] and POST /accept"
```

---

## Task 6: Página pública `/invite/[token]`

**Files:**
- Create: `apps/web/src/app/(public)/invite/[token]/page.tsx`

Nota: si no existe `(public)` como route group, crear la carpeta. No requiere layout especial — hereda el root layout.

- [ ] **Step 1: Verificar si existe `app/(public)/`**

Si no existe, crear la carpeta `apps/web/src/app/(public)/`. No necesita `layout.tsx` propio.

- [ ] **Step 2: Crear la página**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const { userId } = await auth()

  const invitation = await db.orgInvitation.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  })

  // Token inválido
  if (!invitation) {
    return <InviteError message="Este link de invitación no existe o ha sido eliminado." />
  }

  // Revocado
  if (invitation.revokedAt) {
    return <InviteError message="Esta invitación ha sido revocada por el administrador." />
  }

  // Ya aceptado
  if (invitation.acceptedAt) {
    return <InviteError message="Esta invitación ya fue aceptada." />
  }

  // Caducado
  if (invitation.expiresAt < new Date()) {
    return <InviteError message="Esta invitación ha caducado. Solicita una nueva al administrador." />
  }

  // Sin sesión → redirigir a sign-up con return URL
  if (!userId) {
    redirect(`/sign-up?redirect_url=/invite/${token}`)
  }

  const ROLE_LABEL: Record<string, string> = {
    ADMIN: 'Administrador',
    EDITOR: 'Consultor',
    VIEWER: 'Lector',
    OWNER: 'Propietario',
    MEMBER: 'Miembro',
    OPERATOR: 'Operador',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-sm space-y-6 text-center">
        <div className="text-4xl">🤝</div>
        <div>
          <h1 className="text-xl font-semibold">Te han invitado a {invitation.org.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Únete como <span className="font-medium text-foreground">{ROLE_LABEL[invitation.role] ?? invitation.role}</span>
          </p>
        </div>
        <AcceptButton token={token} />
        <p className="text-xs text-muted-foreground">
          Esta invitación caduca el{' '}
          {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(invitation.expiresAt)}
        </p>
      </div>
    </div>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-sm space-y-4 text-center">
        <div className="text-4xl">❌</div>
        <h1 className="text-xl font-semibold">Invitación no válida</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <a href="/" className="inline-block text-sm text-primary underline">Volver al inicio</a>
      </div>
    </div>
  )
}

// Client component para el botón de aceptar
import { AcceptButton } from './_components/AcceptButton'
```

- [ ] **Step 3: Crear `_components/AcceptButton.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al aceptar la invitación')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? 'Uniéndome...' : 'Aceptar invitación'}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Ajustar el import en `page.tsx`**

Mover la línea `import { AcceptButton } from './_components/AcceptButton'` al principio del fichero (antes del `export default`). TypeScript no admite imports en medio del fichero.

El fichero final de `page.tsx` debe tener todos los imports arriba:

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AcceptButton } from './_components/AcceptButton'
// ... resto del código
```

- [ ] **Step 5: Probar en el navegador**

Con el servidor corriendo, acceder a `http://localhost:3002/invite/token-inexistente` — debe mostrar la pantalla de error "no existe".

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(public\)/invite/
git commit -m "feat(ui): add public /invite/[token] acceptance page"
```

---

## Task 7: Settings → Equipo (página completa con invitaciones)

**Files:**
- Create: `apps/web/src/app/(dashboard)/settings/team/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/team/_components/InviteModal.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/team/_components/PendingInvitationsTable.tsx`
- Modify: `apps/web/src/app/(dashboard)/org/team/page.tsx` — botón "Invitar" deja de ser disabled

- [ ] **Step 1: Crear `PendingInvitationsTable.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { PendingInvitation } from '@/app/actions/org'

interface Props {
  invitations: PendingInvitation[]
  appUrl: string
}

export function PendingInvitationsTable({ invitations: initial, appUrl }: Props) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initial)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function handleRevoke(token: string) {
    setRevoking(token)
    const res = await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.token !== token))
    }
    setRevoking(null)
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${appUrl}/invite/${token}`)
  }

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No hay invitaciones pendientes.</p>
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Email / Rol</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Caduca</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {invitations.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/20">
              <td className="px-4 py-3">
                <div className="font-medium">{inv.email ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{inv.roleLabel}</div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(inv.expiresAt))}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${inv.isExpired ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                  {inv.isExpired ? 'Caducada' : 'Activa'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  {!inv.isExpired && (
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Copiar link
                    </button>
                  )}
                  <button
                    onClick={() => handleRevoke(inv.token)}
                    disabled={revoking === inv.token}
                    className="text-xs text-destructive hover:underline disabled:opacity-50"
                  >
                    Revocar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Crear `InviteModal.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { OrgRole } from '@prisma/client'

const INVITE_ROLES: { value: OrgRole; label: string; description: string }[] = [
  { value: 'EDITOR', label: 'Consultor', description: 'Ejecuta herramientas, crea registros, exporta' },
  { value: 'VIEWER', label: 'Lector', description: 'Solo lectura y exportación' },
  { value: 'ADMIN', label: 'Administrador', description: 'Gestiona el equipo y las herramientas' },
]

interface Props {
  actorRole: OrgRole
  onInviteCreated: () => void
}

export function InviteModal({ actorRole, onInviteCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<OrgRole>('EDITOR')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const availableRoles = actorRole === 'OWNER'
    ? INVITE_ROLES
    : INVITE_ROLES.filter((r) => r.value !== 'ADMIN')

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email: email || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setLink(data.link)
      onInviteCreated()
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setLink(null)
    setError(null)
    setEmail('')
    setRole('EDITOR')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Invitar miembro
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Invitar nuevo miembro</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {!link ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email (opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rol</label>
                  <div className="space-y-2">
                    {availableRoles.map((r) => (
                      <label key={r.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${role === r.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button onClick={handleClose} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30">
                    Cancelar
                  </button>
                  <button onClick={handleCreate} disabled={loading} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {loading ? 'Generando...' : 'Generar link'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Link listo. Compártelo con el invitado — caduca en 7 días.</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={link}
                    className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 text-xs font-mono truncate"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(link)}
                    className="shrink-0 rounded-lg border px-3 py-2 text-xs hover:bg-muted/30"
                  >
                    Copiar
                  </button>
                </div>
                <button onClick={handleClose} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Hecho
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Crear `settings/team/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { listOrgMembers, listPendingInvitations } from '@/app/actions/org'
import { TeamMembersTable } from '@/app/(dashboard)/org/_components/TeamMembersTable'
import { InviteModal } from './_components/InviteModal'
import { PendingInvitationsTable } from './_components/PendingInvitationsTable'

export default async function SettingsTeamPage() {
  const user = await requireUser()
  if (!can(user, 'manage_members')) redirect('/dashboard')

  const [membersResult, invitationsResult] = await Promise.all([
    listOrgMembers(),
    listPendingInvitations(),
  ])

  const members = 'error' in membersResult ? [] : membersResult
  const invitations = 'error' in invitationsResult ? [] : invitationsResult
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.mitikus.com'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
          </p>
        </div>
        <InviteModal actorRole={user.role} onInviteCreated={() => {}} />
      </div>

      {/* Miembros actuales */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Miembros</h2>
        <TeamMembersTable
          members={members}
          currentUserId={user.id}
          actorRole={user.role}
          showRemove
        />
      </section>

      {/* Invitaciones pendientes */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Invitaciones pendientes</h2>
        <PendingInvitationsTable invitations={invitations} appUrl={appUrl} />
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Añadir prop `showRemove` a `TeamMembersTable`**

En `TeamMembersTable.tsx`, la prop `showRemove?: boolean` activa un botón "Eliminar" por fila (solo visible cuando `showRemove && actorRole !== 'VIEWER'` y el target no es OWNER).

Añadir a la interfaz `Props`:
```typescript
showRemove?: boolean
```

Añadir en cada fila de la tabla (dentro del `<td>` de rol, o como columna nueva):
```typescript
{showRemove && member.role !== 'OWNER' && !isMe && (
  <RemoveButton memberId={member.id} onRemoved={() => setMembers((prev) => prev.filter((m) => m.id !== member.id))} />
)}
```

Crear `RemoveButton` como componente inline en el mismo fichero:
```typescript
function RemoveButton({ memberId, onRemoved }: { memberId: string; onRemoved: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm('¿Eliminar a este miembro del equipo?')) return
    setLoading(true)
    const { removeMember } = await import('@/app/actions/org')
    const result = await removeMember(memberId)
    if ('success' in result) onRemoved()
    setLoading(false)
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-xs text-destructive hover:underline disabled:opacity-50 ml-2"
    >
      {loading ? '...' : 'Eliminar'}
    </button>
  )
}
```

- [ ] **Step 5: Verificar en el navegador**

Navegar a `http://localhost:3002/settings/team` con usuario ADMIN u OWNER. Verificar que aparecen miembros y el botón "Invitar miembro" abre el modal.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/settings/team/ apps/web/src/app/\(dashboard\)/org/_components/TeamMembersTable.tsx
git commit -m "feat(ui): settings/team page with invite modal and pending invitations"
```

---

## Task 8: Settings → Categorías (solo OWNER)

**Files:**
- Create: `apps/web/src/app/(dashboard)/settings/categories/page.tsx`

- [ ] **Step 1: Crear la página**

```typescript
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { CategoryToggles } from './_components/CategoryToggles'
import type { ToolCategory } from '@prisma/client'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  AUDIT: 'Auditoría',
  EVALUATION: 'Evaluación',
  CHECKLIST: 'Checklist',
  CRM: 'CRM',
  REPORT: 'Reportes',
  HR: 'Recursos Humanos',
  OPERATIONS: 'Operaciones',
  FINANCE: 'Finanzas',
  CUSTOM: 'Personalizada',
}

export default async function SettingsCategoriesPage() {
  const user = await requireUser()
  if (user.role !== 'OWNER') redirect('/dashboard')

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    select: { enabledCategories: true },
  })

  const enabled = org?.enabledCategories ?? []

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Categorías activas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controla qué tipos de herramientas pueden crearse en tu organización. Todas activas por defecto.
        </p>
      </div>
      <CategoryToggles orgId={user.orgId} enabledCategories={enabled} categoryLabels={CATEGORY_LABELS} />
    </div>
  )
}
```

- [ ] **Step 2: Crear `_components/CategoryToggles.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { ToolCategory } from '@prisma/client'

const ALL_CATEGORIES: ToolCategory[] = [
  'AUDIT', 'EVALUATION', 'CHECKLIST', 'CRM', 'REPORT', 'HR', 'OPERATIONS', 'FINANCE', 'CUSTOM',
]

interface Props {
  orgId: string
  enabledCategories: ToolCategory[]
  categoryLabels: Record<ToolCategory, string>
}

export function CategoryToggles({ orgId, enabledCategories: initial, categoryLabels }: Props) {
  // empty = all enabled
  const [enabled, setEnabled] = useState<Set<ToolCategory>>(
    initial.length === 0 ? new Set(ALL_CATEGORIES) : new Set(initial),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(cat: ToolCategory) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const categories = enabled.size === ALL_CATEGORIES.length ? [] : Array.from(enabled)
    await fetch('/api/org/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card divide-y">
        {ALL_CATEGORIES.map((cat) => (
          <label key={cat} className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/20">
            <span className="text-sm font-medium">{categoryLabels[cat]}</span>
            <div
              onClick={() => toggle(cat)}
              className={`relative w-10 h-5 rounded-full transition-colors ${enabled.has(cat) ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled.has(cat) ? 'translate-x-5' : ''}`} />
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-xs text-green-600">Guardado ✓</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear `PATCH /api/org/categories`**

Crear `apps/web/src/app/api/org/categories/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ToolCategory } from '@prisma/client'

export const runtime = 'nodejs'

const VALID: ToolCategory[] = ['AUDIT','EVALUATION','CHECKLIST','CRM','REPORT','HR','OPERATIONS','FINANCE','CUSTOM']

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser()
    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Solo el propietario puede modificar las categorías' }, { status: 403 })
    }

    const body: { categories?: string[] } = await req.json().catch(() => ({}))
    const categories = (body.categories ?? []).filter((c): c is ToolCategory => VALID.includes(c as ToolCategory))

    await db.organization.update({
      where: { id: user.orgId },
      data: { enabledCategories: categories },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Verificar en el navegador**

Navegar a `http://localhost:3002/settings/categories` con OWNER. Desactivar una categoría, guardar, recargar — debe persistir el estado.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/settings/categories/ apps/web/src/app/api/org/categories/
git commit -m "feat(ui): settings/categories page with owner-only category toggles"
```

---

## Task 9: Guard VIEWER → 403 en execute-tool

**Files:**
- Modify: `apps/web/src/app/api/execute-tool/route.ts`

- [ ] **Step 1: Añadir check de rol al inicio del handler POST**

Localizar la línea donde se hace `requireUser()` en `route.ts`. Justo después, añadir:

```typescript
if (!can(user, 'execute_tool')) {
  return NextResponse.json({ error: 'Sin permisos para ejecutar herramientas' }, { status: 403 })
}
```

Asegurarse de que `can` está importado desde `@/lib/permissions`.

- [ ] **Step 2: Probar con usuario VIEWER**

Si hay un usuario de prueba con rol VIEWER en local, intentar ejecutar una herramienta — debe recibir 403. Si no, verificar que el import de `can` compila sin errores con `npm run type-check`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/execute-tool/route.ts
git commit -m "feat(auth): block VIEWER from executing tools (403)"
```

---

## Task 10: Actualizar botón en `/org/team/page.tsx` y añadir nav a Settings

**Files:**
- Modify: `apps/web/src/app/(dashboard)/org/team/page.tsx`

- [ ] **Step 1: Reemplazar el botón disabled por un link a settings/team**

Sustituir el bloque del botón disabled:

```typescript
{/* Invite placeholder — disabled */}
<button
  type="button"
  disabled
  ...
>
  Invitar miembro
  <span className="text-[10px] opacity-70">(próximamente)</span>
</button>
```

Por:

```typescript
<a
  href="/settings/team"
  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
>
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
  Gestionar equipo
</a>
```

- [ ] **Step 2: Commit y push**

```bash
git add apps/web/src/app/\(dashboard\)/org/team/page.tsx
git commit -m "feat(ui): link org/team page to settings/team"
git push
```

---

## Task 11: Deploy a producción

- [ ] **Step 1: Verificar que no hay errores de TypeScript**

```bash
cd C:\Users\priet\protools-hub\apps\web
npm run type-check
```

Debe terminar sin errores.

- [ ] **Step 2: Ejecutar migración en producción (Railway)**

La migración de Railway se aplica automáticamente en el deploy si `prisma migrate deploy` está en el build script. Verificar en `package.json` que existe:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

Si no existe `prisma migrate deploy`, añadirlo antes de `next build`.

- [ ] **Step 3: Deploy**

```bash
cd C:\Users\priet\protools-hub
npx vercel deploy --prod
```

- [ ] **Step 4: Verificar en producción**

- Acceder a `https://app.mitikus.com/settings/team` — debe cargar la página de equipo.
- Generar una invitación de prueba — el link `app.mitikus.com/invite/[token]` debe funcionar.
- Acceder al link en incógnito — debe mostrar la pantalla de aceptación o redirigir a sign-up.

---

## Self-Review

### Cobertura de spec

| Requisito spec | Task |
|---|---|
| OrgInvitation model | Task 1 |
| enabledCategories en Organization | Task 1 |
| /invite/[token] pública | Tasks 2, 6 |
| POST /api/invitations | Task 4 |
| POST /api/invitations/[token]/accept | Task 5 |
| DELETE /api/invitations/[token] | Task 5 |
| Settings → Equipo con invitaciones | Task 7 |
| Settings → Categorías (solo OWNER) | Task 8 |
| Guard VIEWER en execute-tool | Task 9 |
| PATCH /api/org/categories | Task 8 |
| Botón Invitar activo en org/team | Task 10 |
| Deploy y migración producción | Task 11 |

### Consistencia de tipos

- `PendingInvitation` se define en Task 3 (`actions/org.ts`) y se usa en Tasks 7.
- `InviteModal` recibe `actorRole: OrgRole` — disponible desde `requireUser()`.
- `PendingInvitationsTable` recibe `invitations: PendingInvitation[]` y `appUrl: string`.
- `TeamMembersTable` recibe nueva prop `showRemove?: boolean` — retrocompatible.
- `CategoryToggles` recibe `enabledCategories: ToolCategory[]` — array vacío = todas activas.

### Sin placeholders

Todos los pasos contienen código completo. No hay "TBD" ni "TODO".
