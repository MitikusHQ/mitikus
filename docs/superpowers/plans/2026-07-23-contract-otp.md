# Contract OTP Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir verificación OTP por email al flujo de firma pública de contratos, con protección de intentos, rate limiting de reenvío y auditoría de verificación.

**Architecture:** Antes de mostrar el PDF al firmante, se le pide un código de 6 dígitos enviado a su email. El código se hashea con bcryptjs y se guarda en el modelo `Contract` junto con metadatos de expiración, intentos y timestamp de solicitud. Al verificar el código, se marca `otpVerifiedAt` y se permite el acceso al PDF. `signClientContract` rechaza si no hay `otpVerifiedAt` válido. Si el contrato no tiene `clientEmail`, se salta la verificación (contratos internos).

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, Resend (email ya instalado), bcryptjs (ya instalado — verificar), `crypto.randomInt`

---

## Mapa de archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/web/prisma/schema.prisma` |
| Modificar | `apps/web/src/app/actions/contracts.ts` |
| Modificar | `apps/web/src/lib/email.ts` |
| Crear | `apps/web/src/app/contracts/sign/[token]/_components/OtpVerifyClient.tsx` |
| Modificar | `apps/web/src/app/contracts/sign/[token]/page.tsx` |
| Modificar | `apps/web/src/app/contracts/sign/[token]/_components/PublicSignClient.tsx` |

---

## Task 1: Prisma schema — campos OTP en Contract

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Añadir campos OTP al modelo Contract**

En `apps/web/prisma/schema.prisma`, dentro del modelo `Contract`, añadir después de `clientIp String?`:

```prisma
  otpCode        String?
  otpExpiresAt   DateTime?
  otpAttempts    Int       @default(0)
  otpRequestedAt DateTime?
  otpVerifiedAt  DateTime?
```

El bloque completo del modelo después del cambio quedará:

```prisma
model Contract {
  id                String         @id @default(cuid())
  workspaceId       String
  title             String
  pdfData           Bytes
  status            ContractStatus @default(DRAFT)
  clientName        String?
  clientEmail       String?
  shareToken        String         @unique @default(cuid())

  internalSignature Bytes?
  internalAccepted  Boolean        @default(false)
  internalSignedAt  DateTime?

  clientSignature   Bytes?
  clientAccepted    Boolean        @default(false)
  clientSignedAt    DateTime?
  clientIp          String?

  otpCode           String?
  otpExpiresAt      DateTime?
  otpAttempts       Int            @default(0)
  otpRequestedAt    DateTime?
  otpVerifiedAt     DateTime?

  signedPdfData     Bytes?

  createdBy         String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  workspace         Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator           User           @relation(fields: [createdBy], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@index([workspaceId, status])
  @@map("contracts")
}
```

- [ ] **Step 2: Aplicar el schema**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx prisma db push
```

Esperado: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Verificar que bcryptjs está disponible**

```powershell
cd C:\Users\priet\protools-hub\apps\web
node -e "require('bcryptjs'); console.log('ok')"
```

Si falla: `npm install bcryptjs @types/bcryptjs --workspace=apps/web`

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/prisma/schema.prisma
git commit -m "feat: add OTP fields to Contract schema"
```

---

## Task 2: Server actions OTP + modificar signClientContract

**Files:**
- Modify: `apps/web/src/app/actions/contracts.ts`

Lee el archivo completo antes de editar. Necesitas añadir tres server actions nuevos y modificar `signClientContract`.

- [ ] **Step 1: Añadir imports al inicio de contracts.ts**

Al inicio del archivo (justo después de los imports existentes), añadir si no existen ya:

```typescript
import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
```

- [ ] **Step 2: Añadir server action `requestOtp`**

Añadir al final del archivo (antes del cierre):

```typescript
export async function requestOtp(shareToken: string): Promise<{ sent: boolean; waitSeconds?: number }> {
  const contract = await db.contract.findUnique({
    where:  { shareToken },
    select: { id: true, clientEmail: true, status: true, otpRequestedAt: true },
  })
  if (!contract || !contract.clientEmail || contract.status === 'SIGNED') {
    return { sent: false }
  }

  // Rate limiting: no permitir nuevo OTP hasta 60s después del último
  if (contract.otpRequestedAt) {
    const elapsed = Date.now() - contract.otpRequestedAt.getTime()
    const waitMs  = 60_000 - elapsed
    if (waitMs > 0) {
      return { sent: false, waitSeconds: Math.ceil(waitMs / 1000) }
    }
  }

  const code    = String(randomInt(100000, 999999))
  const hashed  = await bcrypt.hash(code, 10)
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

  await db.contract.update({
    where: { shareToken },
    data: {
      otpCode:        hashed,
      otpExpiresAt:   expires,
      otpAttempts:    0,
      otpRequestedAt: new Date(),
      otpVerifiedAt:  null,
    },
  })

  const { sendContractOtpEmail } = await import('@/lib/email')
  await sendContractOtpEmail({
    to:            contract.clientEmail,
    code,
    expiresInMin:  10,
  })

  return { sent: true }
}
```

- [ ] **Step 3: Añadir server action `verifyOtp`**

```typescript
export async function verifyOtp(
  shareToken: string,
  code: string,
): Promise<{ ok: boolean; error?: 'invalid' | 'expired' | 'max_attempts' }> {
  const contract = await db.contract.findUnique({
    where:  { shareToken },
    select: {
      id:           true,
      otpCode:      true,
      otpExpiresAt: true,
      otpAttempts:  true,
    },
  })

  if (!contract?.otpCode || !contract.otpExpiresAt) {
    return { ok: false, error: 'invalid' }
  }

  if (contract.otpAttempts >= 3) {
    return { ok: false, error: 'max_attempts' }
  }

  if (new Date() > contract.otpExpiresAt) {
    return { ok: false, error: 'expired' }
  }

  const match = await bcrypt.compare(code, contract.otpCode)

  if (!match) {
    await db.contract.update({
      where: { shareToken },
      data:  { otpAttempts: { increment: 1 } },
    })
    return { ok: false, error: 'invalid' }
  }

  await db.contract.update({
    where: { shareToken },
    data:  { otpVerifiedAt: new Date(), otpAttempts: 0 },
  })

  return { ok: true }
}
```

- [ ] **Step 4: Añadir server action `getOtpStatus`** (para la página, para saber si ya se envió un OTP y cuánto tiempo falta para reenviar)

```typescript
export async function getOtpStatus(
  shareToken: string,
): Promise<{ hasEmail: boolean; alreadyVerified: boolean; waitSeconds: number }> {
  const contract = await db.contract.findUnique({
    where:  { shareToken },
    select: { clientEmail: true, otpVerifiedAt: true, otpRequestedAt: true },
  })

  if (!contract) return { hasEmail: false, alreadyVerified: false, waitSeconds: 0 }

  const alreadyVerified = !!contract.otpVerifiedAt
  const hasEmail        = !!contract.clientEmail

  let waitSeconds = 0
  if (contract.otpRequestedAt) {
    const elapsed = Date.now() - contract.otpRequestedAt.getTime()
    const waitMs  = 60_000 - elapsed
    if (waitMs > 0) waitSeconds = Math.ceil(waitMs / 1000)
  }

  return { hasEmail, alreadyVerified, waitSeconds }
}
```

- [ ] **Step 5: Modificar `signClientContract` para exigir OTP verificado**

Busca la función `signClientContract` en el archivo. Al inicio de la función, justo después de verificar que `status === 'SENT'`, añade la validación de OTP.

La función actualmente empieza algo así:
```typescript
export async function signClientContract(
  shareToken:  string,
  dataUrl:     string,
  accepted:    boolean,
  clientIp:    string,
) {
```

Busca la línea donde se hace `findUnique` del contrato dentro de esta función y añade `otpVerifiedAt` y `clientEmail` al `select`. Luego, después de verificar `status === 'SENT'`, añade:

```typescript
// Si el contrato tiene email de cliente, exigir que el OTP haya sido verificado
if (contract.clientEmail && !contract.otpVerifiedAt) {
  throw new Error('OTP_NOT_VERIFIED')
}
```

- [ ] **Step 6: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/app/actions/contracts.ts
git commit -m "feat: add requestOtp, verifyOtp, getOtpStatus actions + OTP guard in signClientContract"
```

---

## Task 3: Email OTP — añadir `sendContractOtpEmail`

**Files:**
- Modify: `apps/web/src/lib/email.ts`

- [ ] **Step 1: Añadir la función al final del archivo**

```typescript
export async function sendContractOtpEmail({
  to,
  code,
  expiresInMin,
}: {
  to:           string
  code:         string
  expiresInMin: number
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from:    'MITIKUS <noreply@mitikus.com>',
    to,
    subject: `Tu código de verificación: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Código de verificación</p>
        <p style="color: #666; margin-bottom: 24px;">
          Para acceder al contrato que te han enviado para firmar, introduce este código:
        </p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">
          Este código caduca en ${expiresInMin} minutos. Si no solicitaste este código, ignora este email.
        </p>
      </div>
    `,
  })
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/lib/email.ts
git commit -m "feat: add sendContractOtpEmail"
```

---

## Task 4: Componente OtpVerifyClient

**Files:**
- Create: `apps/web/src/app/contracts/sign/[token]/_components/OtpVerifyClient.tsx`

Este componente se muestra en lugar del PDF cuando el firmante no ha verificado su identidad todavía. Gestiona: envío inicial automático del OTP al montar, input de 6 dígitos, contador de reenvío, mensajes de error y callback `onVerified` cuando el código es correcto.

- [ ] **Step 1: Crear el archivo**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { requestOtp, verifyOtp } from '@/app/actions/contracts'

interface Props {
  shareToken:    string
  clientEmail:   string
  initialWait:   number
  onVerified:    () => void
}

export function OtpVerifyClient({ shareToken, clientEmail, initialWait, onVerified }: Props) {
  const [code,        setCode]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [verifying,   setVerifying]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [waitSeconds, setWaitSeconds] = useState(initialWait)
  const [sent,        setSent]        = useState(initialWait > 0) // si ya hay wait, ya se envió antes
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Ticker del contador de reenvío
  useEffect(() => {
    if (waitSeconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setWaitSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [waitSeconds])

  // Enviar OTP automáticamente al montar si no hay wait activo
  useEffect(() => {
    if (initialWait <= 0) {
      void handleSend()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSend() {
    setSending(true)
    setError(null)
    const result = await requestOtp(shareToken)
    setSending(false)
    if (result.sent) {
      setSent(true)
      setWaitSeconds(60)
    } else if (result.waitSeconds) {
      setWaitSeconds(result.waitSeconds)
      setSent(true)
    } else {
      setError('No se pudo enviar el código. Inténtalo de nuevo.')
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setVerifying(true)
    setError(null)
    const result = await verifyOtp(shareToken, code)
    setVerifying(false)
    if (result.ok) {
      onVerified()
    } else {
      if (result.error === 'max_attempts') {
        setError('Has superado el máximo de intentos. Solicita un nuevo código.')
        setCode('')
      } else if (result.error === 'expired') {
        setError('El código ha caducado. Solicita uno nuevo.')
        setCode('')
      } else {
        setError('Código incorrecto. Inténtalo de nuevo.')
      }
    }
  }

  // Enmascarar email: borja@mitikus.com → b***@mitikus.com
  const maskedEmail = clientEmail.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}***${c}`)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">📨</div>
          <h1 className="text-xl font-semibold mb-2">Verifica tu identidad</h1>
          <p className="text-sm text-muted-foreground">
            {sent
              ? <>Hemos enviado un código de 6 dígitos a <strong>{maskedEmail}</strong></>
              : 'Enviando código...'}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={verifying || sending}
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-lg border border-input bg-background px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || verifying || sending}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {verifying ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {waitSeconds > 0 ? (
            <p className="text-xs text-muted-foreground">
              Reenviar código en <span className="font-medium tabular-nums">{waitSeconds}s</span>
            </p>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Reenviar código'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          El código caduca en 10 minutos.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/contracts/sign/[token]/_components/OtpVerifyClient.tsx"
git commit -m "feat: add OtpVerifyClient component"
```

---

## Task 5: Actualizar page.tsx y PublicSignClient

**Files:**
- Modify: `apps/web/src/app/contracts/sign/[token]/page.tsx`
- Modify: `apps/web/src/app/contracts/sign/[token]/_components/PublicSignClient.tsx`

### Parte A: `page.tsx`

La página ahora necesita decidir si mostrar `OtpVerifyClient` o `PublicSignClient`. Para ello, pasa al cliente los datos necesarios: si tiene email, si ya está verificado, y el tiempo de espera para reenvío.

- [ ] **Step 1: Actualizar page.tsx**

El archivo actualmente importa `getContractByToken` y renderiza `PublicSignClient`. Hay que añadir la llamada a `getOtpStatus` y pasar `clientEmail`, `alreadyVerified` y `waitSeconds` al cliente.

Reemplazar el contenido completo de `apps/web/src/app/contracts/sign/[token]/page.tsx` por:

```typescript
import { notFound } from 'next/navigation'
import { getContractByToken, getOtpStatus } from '@/app/actions/contracts'
import { PublicSignClient } from './_components/PublicSignClient'
import { OtpVerifyClient }  from './_components/OtpVerifyClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicSignPage({ params }: Props) {
  const { token } = await params

  let contract
  try {
    contract = await getContractByToken(token)
  } catch {
    notFound()
  }

  if (!contract) notFound()

  if (contract.status === 'SIGNED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-2">Contrato ya firmado</h1>
          <p className="text-sm text-muted-foreground">
            Este contrato ya ha sido firmado por ambas partes.
          </p>
        </div>
      </div>
    )
  }

  const { hasEmail, alreadyVerified, waitSeconds } = await getOtpStatus(token)

  // Si el contrato tiene email y no ha verificado OTP → pantalla de verificación
  if (hasEmail && !alreadyVerified) {
    return (
      <OtpVerifyClient
        shareToken={token}
        clientEmail={contract.clientEmail!}
        initialWait={waitSeconds}
        onVerified={() => {}}
      />
    )
  }

  return (
    <PublicSignClient
      shareToken={token}
      contractTitle={contract.title}
      pdfDataArray={contract.pdfDataArray}
      workspaceName={contract.creatorName}
    />
  )
}
```

**PROBLEMA:** `OtpVerifyClient` es un componente cliente con un callback `onVerified`, pero `page.tsx` es un Server Component. No podemos pasar un callback JS desde el servidor al cliente. La solución es hacer que `OtpVerifyClient` sea el componente raíz que controla el estado `verified` y renderiza `PublicSignClient` internamente cuando se verifica.

Reemplazar el contenido de `page.tsx` por esta versión correcta:

```typescript
import { notFound } from 'next/navigation'
import { getContractByToken, getOtpStatus } from '@/app/actions/contracts'
import { SignFlowClient } from './_components/SignFlowClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicSignPage({ params }: Props) {
  const { token } = await params

  let contract
  try {
    contract = await getContractByToken(token)
  } catch {
    notFound()
  }

  if (!contract) notFound()

  if (contract.status === 'SIGNED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-2">Contrato ya firmado</h1>
          <p className="text-sm text-muted-foreground">
            Este contrato ya ha sido firmado por ambas partes.
          </p>
        </div>
      </div>
    )
  }

  const { hasEmail, alreadyVerified, waitSeconds } = await getOtpStatus(token)

  return (
    <SignFlowClient
      shareToken={token}
      contractTitle={contract.title}
      pdfDataArray={contract.pdfDataArray}
      workspaceName={contract.creatorName}
      clientEmail={contract.clientEmail ?? null}
      requiresOtp={hasEmail && !alreadyVerified}
      initialWait={waitSeconds}
    />
  )
}
```

### Parte B: Crear `SignFlowClient` (orquestador)

En lugar de modificar `PublicSignClient`, creamos un nuevo componente `SignFlowClient` que orquesta el flujo OTP → firma.

- [ ] **Step 2: Crear `SignFlowClient.tsx`**

```typescript
// apps/web/src/app/contracts/sign/[token]/_components/SignFlowClient.tsx
'use client'

import { useState } from 'react'
import { OtpVerifyClient }  from './OtpVerifyClient'
import { PublicSignClient } from './PublicSignClient'

interface Props {
  shareToken:    string
  contractTitle: string
  pdfDataArray:  number[]
  workspaceName: string | null
  clientEmail:   string | null
  requiresOtp:   boolean
  initialWait:   number
}

export function SignFlowClient({
  shareToken,
  contractTitle,
  pdfDataArray,
  workspaceName,
  clientEmail,
  requiresOtp,
  initialWait,
}: Props) {
  const [otpVerified, setOtpVerified] = useState(!requiresOtp)

  if (!otpVerified && clientEmail) {
    return (
      <OtpVerifyClient
        shareToken={shareToken}
        clientEmail={clientEmail}
        initialWait={initialWait}
        onVerified={() => setOtpVerified(true)}
      />
    )
  }

  return (
    <PublicSignClient
      shareToken={shareToken}
      contractTitle={contractTitle}
      pdfDataArray={pdfDataArray}
      workspaceName={workspaceName}
    />
  )
}
```

- [ ] **Step 3: Actualizar page.tsx** para importar `SignFlowClient` en lugar de `PublicSignClient`:

El contenido correcto de `page.tsx` es el que usa `SignFlowClient` (segunda versión del Step 1 arriba).

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/contracts/sign/[token]/"
git commit -m "feat: add OTP verification flow to contract signing"
```

---

## Task 6: TypeScript check + build + deploy

**Files:** ninguno nuevo

- [ ] **Step 1: TypeScript check**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 60
```

Errores comunes a corregir:
- `bcryptjs` sin tipos: `npm install @types/bcryptjs --workspace=apps/web`
- `randomInt` no existe en tipos de Node: asegurarse de que `@types/node` está instalado
- `contract.clientEmail` puede ser null al pasarlo a `OtpVerifyClient`: usar `!` o validar antes

- [ ] **Step 2: Build**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx next build 2>&1 | Select-Object -Last 30
```

- [ ] **Step 3: Deploy**

```powershell
cd C:\Users\priet\protools-hub
npx vercel deploy --prod --scope mitikus
```

- [ ] **Step 4: Commit de fixes si los hay**

```powershell
cd C:\Users\priet\protools-hub
git add -A
git commit -m "fix: resolve TypeScript errors in OTP verification flow"
```
