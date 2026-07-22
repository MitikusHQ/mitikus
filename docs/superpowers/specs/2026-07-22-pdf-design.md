# PDFs — Design Spec

## Goal

Añadir visor de PDFs a MITIKUS: subir archivos .pdf, visualizarlos en el navegador con navegación por páginas y zoom, descargar el original, convertir a documento editable (Tiptap) y exponer el texto extraído a Arkos como contexto.

## Scope

- Modelo Prisma `Pdf` (binario en DB)
- Upload .pdf → extracción de texto con `pdf-parse` + conteo de páginas
- Visor `react-pdf` con dynamic import (ssr: false)
- Título y categoría editables inline
- Descarga del PDF original
- "Abrir como Doc" → crea `Document` en Tiptap con el rawText y redirige a `/docs/[id]`
- Eliminar PDF con confirmación
- Sidebar: ítem "PDFs" tras "Hojas de cálculo"
- `/tools`: card "PDFs" en bloque "Herramientas de Office"
- Arkos: rawText de los últimos 3 PDFs en `docsContext`

**Fuera de scope:** anotaciones en el PDF, edición directa del binario, OCR de PDFs escaneados, búsqueda de texto dentro del visor, compartir PDF público.

## Librería

**react-pdf** (`react-pdf`) — basado en pdf.js, MIT license, compatible Vercel.
Import dinámico obligatorio (usa `window`):
```tsx
const Document = dynamic(() => import('react-pdf').then((m) => m.Document), { ssr: false })
const Page     = dynamic(() => import('react-pdf').then((m) => m.Page),     { ssr: false })
```

**pdf-parse** — extracción de texto server-side, sin binarios nativos.

## Modelo de datos

```prisma
model Pdf {
  id          String    @id @default(cuid())
  workspaceId String
  title       String
  category    String?
  data        Bytes
  rawText     String    @default("") @db.Text
  pageCount   Int       @default(0)
  fileSize    Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  uploadedBy  String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  uploader    User      @relation(fields: [uploadedBy], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@index([workspaceId, createdAt])
}
```

`data` almacena el binario del PDF. `rawText` contiene el texto extraído para Arkos y para la conversión a Doc. `pageCount` y `fileSize` se calculan al subir.

## Rutas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/pdfs` | Server + `PdfList` Client | Listado + upload .pdf + filtros categoría |
| `/pdfs/[pdfId]` | Server + `PdfViewerClient` Client | Visor siempre activo + acciones |

No hay ruta `/pdfs/new` — los PDFs se crean únicamente por upload.

## Upload

API route: `POST /api/pdfs/upload` (multipart/form-data).

```typescript
import pdfParse from 'pdf-parse'

// Recibe file (.pdf) + workspaceId
// Valida extensión .pdf
// Valida acceso al workspace via orgId
// Extrae texto: const { text, numpages } = await pdfParse(buffer)
// Guarda: { workspaceId, title, data: buffer, rawText: text, pageCount: numpages, fileSize: buffer.length, uploadedBy: user.id }
// Devuelve: { id, title, pageCount }
```

El título se deriva del nombre del archivo (sin extensión, guiones/barras por espacios).

## Visor (`PdfViewerClient`)

Estado:
```typescript
numPages: number | null
pageNumber: number          // página actual (1-indexed)
scale: number               // zoom, default 1.0
```

Layout:
```
┌─────────────────────────────────────────┐
│ [Título editable]  [Categoría ▼]  [Guardar?]  [↓ Descargar]  [Abrir como Doc]  │
├─────────────────────────────────────────┤
│  ← Pág 3 / 12 →                [+] [-]  │
├─────────────────────────────────────────┤
│                                         │
│           [PDF renderizado]             │
│                                         │
└─────────────────────────────────────────┘
│ [Eliminar PDF]                          │
```

- Navegación: botones anterior/siguiente + indicador "Pág X / N"
- Zoom: botones `+` y `−` (incremento 0.2, rango 0.5–2.0)
- El PDF se sirve como `Blob URL` generado en cliente desde los bytes del campo `data` (pasado como base64 desde el Server Component)

## Descarga

```typescript
function handleDownload() {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${title}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
```

`pdfBytes` es un `Uint8Array` deserializado del campo `data` (pasado como array de números desde el Server Component).

## "Abrir como Doc"

Server action `convertPdfToDoc(pdfId, workspaceId)`:

```typescript
export async function convertPdfToDoc(pdfId: string, workspaceId: string): Promise<string> {
  const user = await getAuthUser()
  const pdf = await db.pdf.findFirst({ where: { id: pdfId, workspaceId }, select: { title: true, rawText: true } })
  if (!pdf) throw new Error('PDF not found')
  const content = `<p>${pdf.rawText.replace(/\n/g, '</p><p>')}</p>`
  const wordCount = pdf.rawText.trim().split(/\s+/).filter(Boolean).length
  const doc = await db.document.create({
    data: { workspaceId, title: pdf.title, content, rawText: pdf.rawText, wordCount, uploadedBy: user.id }
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  return doc.id
}
```

El Client Component llama a esta action con `useTransition`, luego `router.push(/workspace/${workspaceId}/docs/${id})`.

**Nota:** La calidad de conversión depende del PDF. PDFs escaneados (sin texto seleccionable) producirán un documento vacío. Esta limitación se muestra con un aviso en el botón: "El resultado depende del contenido del PDF".

## Metadatos editables

Componente `PdfHeader` (mismo patrón que `SheetHeader`):
- Título editable inline
- Select de categoría: `['Contratos', 'Informes', 'Propuestas', 'Facturas', 'Otro']`
- Botón "Guardar" aparece cuando hay cambios (`isDirty`)
- Server action `updatePdfMeta(pdfId, workspaceId, { title, category })`

## Eliminar

`DeletePdfButton` — `window.confirm` + `deletePdf` server action + `router.push(/pdfs)`.

## Server actions (`pdfs.ts`)

```typescript
export interface PdfData {
  id: string; title: string; category: string | null
  pageCount: number; fileSize: number; createdAt: string; uploaderName: string | null
}
export interface PdfDetail extends PdfData {
  dataArray: number[]  // Uint8Array serializado como array para cruzar server/client boundary
}

export async function getPdfs(workspaceId): Promise<PdfData[]>
export async function getPdf(pdfId, workspaceId): Promise<PdfDetail | null>
export async function updatePdfMeta(pdfId, workspaceId, { title, category }): Promise<void>
export async function deletePdf(pdfId, workspaceId): Promise<void>
export async function convertPdfToDoc(pdfId, workspaceId): Promise<string>  // devuelve docId
```

`getPdf` pasa los bytes como `Array.from(Buffer.from(pdf.data))` para que sean serializables JSON.

## Sidebar

En `layout.tsx`, añadir tras "Hojas de cálculo":

```typescript
{
  label: 'PDFs',
  href:  `${base}/pdfs`,
  icon:  Icons.pdf,
  description: 'Documentos PDF del workspace',
},
```

Icono `pdf`: SVG de documento con esquina doblada y letras "PDF".

## Página /tools — bloque Office

Añadir card "PDFs" al bloque "Herramientas de Office" existente en `tools/page.tsx`.

## Arkos — integración

En `business-context.ts`, añadir query de PDFs al `Promise.all` y concatenar al `docsContext`:

```typescript
db.pdf.findMany({
  where:   { workspaceId },
  orderBy: { updatedAt: 'desc' },
  take:    3,
  select:  { title: true, rawText: true },
}),
```

```typescript
const pdfsSnippet = pdfs.length === 0 ? '' :
  '\n\n=== PDFs ===\n' +
  pdfs.map((p) => `--- ${p.title} ---\n${p.rawText.split('\n').slice(0, 100).join('\n')}`).join('\n\n')
```

`docsContext` pasa a incluir docs + sheets + pdfs.

## Archivos

| Acción | Archivo |
|--------|---------|
| Modify | `apps/web/prisma/schema.prisma` |
| Create | `apps/web/src/app/actions/pdfs.ts` |
| Create | `apps/web/src/app/api/pdfs/upload/route.ts` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/page.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/_components/PdfList.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/_components/PdfUploadZone.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/page.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewerClient.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfHeader.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/DeletePdfButton.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewer.tsx` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx` |
| Modify | `apps/web/src/lib/business-memory/business-context.ts` |
