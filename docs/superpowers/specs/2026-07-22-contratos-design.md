# Contratos — Design Spec

## Goal

Módulo de firma de contratos en MITIKUS: subir un PDF, firmarlo internamente con trazo manuscrito y checkbox de aceptación, enviarlo al cliente por email con link público, y recibir la firma del cliente. Al completarse ambas firmas se genera un PDF final con las firmas incrustadas y se envía por email a ambas partes.

## Scope

- Subida de PDF de contrato
- Firma interna (canvas + checkbox)
- Envío al cliente via email con link público `/contracts/sign/[token]`
- Firma del cliente (canvas + checkbox) en página pública sin login
- Generación de PDF final con firmas incrustadas via `pdf-lib`
- Email de confirmación a ambas partes con PDF adjunto
- Listado de contratos con estados BORRADOR / ENVIADO / FIRMADO

**Fuera de scope:** firma con certificado digital, recordatorios automáticos, múltiples firmantes por parte, historial de versiones del contrato.

## Estados

```
DRAFT → SENT → SIGNED
```

- `DRAFT`: subido, pendiente de firma interna
- `SENT`: interno firmó + email enviado al cliente
- `SIGNED`: cliente firmó → PDF final generado → emails enviados

## Modelo de datos

```prisma
enum ContractStatus {
  DRAFT
  SENT
  SIGNED
}

model Contract {
  id                String         @id @default(cuid())
  workspaceId       String
  title             String
  pdfData           Bytes          // PDF original
  status            ContractStatus @default(DRAFT)
  clientName        String         @default("")
  clientEmail       String         @default("")
  shareToken        String         @unique @default(cuid())

  // Firma interna
  internalSignature Bytes?         // PNG del canvas
  internalAccepted  Boolean        @default(false)
  internalSignedAt  DateTime?

  // Firma cliente
  clientSignature   Bytes?         // PNG del canvas
  clientAccepted    Boolean        @default(false)
  clientSignedAt    DateTime?
  clientIp          String?        // IP para registro

  // PDF final
  signedPdfData     Bytes?         // PDF con firmas incrustadas

  createdBy         String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  workspace         Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator           User           @relation(fields: [createdBy], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@index([workspaceId, status])
  @@index([shareToken])
  @@map("contracts")
}
```

## Archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/web/prisma/schema.prisma` |
| Crear | `apps/web/src/lib/contracts.ts` — server actions |
| Crear | `apps/web/src/app/api/contracts/upload/route.ts` |
| Crear | `apps/web/src/app/api/contracts/[contractId]/sign-pdf/route.ts` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractList.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/_components/ContractUploadZone.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/ContractViewerClient.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/SignatureCanvas.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/contracts/[contractId]/_components/SendToClientModal.tsx` |
| Crear | `apps/web/src/app/contracts/sign/[token]/page.tsx` — fuera del dashboard layout |
| Crear | `apps/web/src/app/contracts/sign/[token]/_components/PublicSignClient.tsx` |

## Páginas

### `/contracts` — Listado

Server Component. Muestra todos los contratos del workspace con badge de estado:
- `DRAFT` → chip gris "BORRADOR"
- `SENT` → chip amarillo "ENVIADO"
- `SIGNED` → chip verde "FIRMADO"

Botón "+ Nuevo contrato" → abre `ContractUploadZone` (modal o zona inline, como en /pdfs).

### `/contracts/[contractId]` — Visor interno

Client Component (`ContractViewerClient`). Layout de dos columnas:
- **Izquierda (flex-1):** visor PDF con react-pdf (reutiliza el patrón de /pdfs)
- **Derecha (w-64):** panel con dos secciones:
  - **Tu firma:** `SignatureCanvas` + checkbox "Acepto los términos" + botón "Guardar firma". Si ya firmó: muestra imagen de la firma y timestamp.
  - **Firma cliente:** si `DRAFT` → gris "Pendiente de envío"; si `SENT` → "Enviado a [email], pendiente de firma"; si `SIGNED` → imagen firma + timestamp.

Header con:
- Título del contrato + badge de estado
- Botón "Enviar al cliente →" (activo solo si interno ha firmado y estado es DRAFT → abre `SendToClientModal`)
- Botón "↓ PDF firmado" (visible solo si estado es SIGNED)

### `/contracts/sign/[token]` — Firma pública

Fuera del dashboard layout — página standalone sin autenticación. Layout:
- Header simple: logo MITIKUS + "Te invita a firmar"
- Título del contrato
- Visor PDF (react-pdf, misma librería)
- Panel de firma: `SignatureCanvas` + checkbox "He leído y acepto este documento" + botón "Firmar contrato"
- Pie: "Al firmar quedará registrado tu nombre, IP y timestamp"

Si el token no existe o el contrato ya está SIGNED: muestra mensaje apropiado ("Contrato no encontrado" / "Este contrato ya ha sido firmado").

## Componentes

### `SignatureCanvas.tsx`

Props:
```typescript
interface Props {
  onSave: (signatureDataUrl: string) => void
  disabled?: boolean
  existingSignature?: string // data URL para mostrar firma guardada
}
```

- Canvas con `react-signature-canvas`
- Botón "Borrar" (limpia el canvas)
- Botón "Guardar firma" (llama `onSave` con `canvas.toDataURL('image/png')`)
- Si `disabled` o `existingSignature`: muestra imagen, sin canvas interactivo

### `ContractViewerClient.tsx`

Props:
```typescript
interface Props {
  contract: ContractWithStatus
  userId: string
}
```

Estado interno:
- `pdfData: Uint8Array` — cargado desde `contract.pdfData`
- `isSavingSignature: boolean`
- `isSending: boolean`
- `showSendModal: boolean`

Handlers:
- `handleSaveInternalSignature(dataUrl, accepted)` → server action `signInternalContract`
- `handleSend(clientName, clientEmail)` → server action `sendContractToClient`

### `SendToClientModal.tsx`

Modal simple con dos campos: nombre del cliente y email. Botón "Enviar" llama al handler del padre.

## Server Actions (`contracts.ts`)

```typescript
// Listar contratos del workspace
getContracts(workspaceId: string): Promise<Contract[]>

// Obtener contrato por ID (autenticado)
getContract(workspaceId: string, contractId: string): Promise<Contract>

// Guardar firma interna
signInternalContract(contractId: string, signatureDataUrl: string, accepted: boolean): Promise<void>
// → Convierte data URL a Buffer, guarda internalSignature + internalAccepted + internalSignedAt

// Enviar al cliente (DRAFT → SENT)
sendContractToClient(contractId: string, clientName: string, clientEmail: string): Promise<void>
// → Actualiza clientName/clientEmail/status=SENT
// → Envía email via Resend con link https://www.mitikus.com/contracts/sign/[shareToken]

// Firma pública del cliente (sin auth — usa solo shareToken)
signClientContract(shareToken: string, signatureDataUrl: string, accepted: boolean, clientIp: string): Promise<void>
// → Guarda clientSignature + clientAccepted + clientSignedAt + clientIp
// → Llama a generateSignedPdf(contractId) → guarda signedPdfData
// → Envía email a ambas partes con PDF adjunto
// → Actualiza status = SIGNED

// Obtener contrato por token (página pública)
getContractByToken(shareToken: string): Promise<ContractPublic>
// ContractPublic: solo campos necesarios para firma (sin pdfData completo — se sirve via API)
```

## API Routes

### `POST /api/contracts/upload`

Recibe `multipart/form-data` con `file` (PDF) y `title` (string). Guarda en BD con `status: DRAFT`. Redirige a `/contracts/[id]`.

Validación: solo acepta `application/pdf`. Tamaño máximo: 10MB.

### `GET /api/contracts/[contractId]/sign-pdf`

Genera el PDF firmado con `pdf-lib`:
1. Carga `contract.pdfData`
2. Carga `contract.internalSignature` y `contract.clientSignature` como PNG
3. Añade una página final al PDF con:
   - Título "Registro de firmas"
   - Firma interna: imagen + nombre del creador + timestamp
   - Firma cliente: imagen + `clientName` + timestamp + IP
4. Devuelve el PDF como `application/pdf`

Este route también se usa para el botón "↓ PDF firmado" en el visor interno.

## Email

### Email al cliente (al enviar)

```
Asunto: [Nombre workspace] te envía un contrato para firmar
Cuerpo: "[clientName], tienes un contrato pendiente de firma: [título]. 
         Pulsa el botón para leer y firmar."
CTA: https://www.mitikus.com/contracts/sign/[shareToken]
```

### Email de confirmación (al firmar ambos)

```
Asunto: Contrato firmado — [título]
Cuerpo: "El contrato [título] ha sido firmado por ambas partes."
Adjunto: PDF con firmas incrustadas
Destinatarios: creador del contrato + clientEmail
```

## Dependencias nuevas

```bash
npm install pdf-lib react-signature-canvas
npm install --save-dev @types/react-signature-canvas
```

`pdf-lib` se usa exclusivamente en server-side (API route). `react-signature-canvas` solo en Client Components.

## Integración en Mi Office

Contratos NO aparece como ítem propio en el sidebar — vive exclusivamente dentro de Mi Office para mantener el sidebar limpio.

- Añadir icono `contracts` a `WorkspaceIcons.tsx` (usado en la card de Mi Office)
- Añadir card "Contratos" a `/office/page.tsx` (4ª card junto a Docs, Sheets, PDFs)
- Añadir entrada `/contracts` a `SECTION_LABELS` en `WorkspaceTopbar.tsx` para el breadcrumb
