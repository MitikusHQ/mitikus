# Document Library — Design Spec

## Goal

Añadir un gestor documental a MITIKUS que permita subir documentos `.docx`, visualizarlos en la app y que Arkos los use como base de conocimiento contextual.

## Architecture

- **Almacenamiento:** conversión de `.docx` a HTML (visor) y texto plano (Arkos) mediante `mammoth` (npm). Sin almacenamiento de ficheros externo — todo en PostgreSQL.
- **Ámbito:** nivel workspace (cada workspace tiene su propia biblioteca de documentos).
- **Subida:** manual por el usuario vía drag & drop o selector de archivo.
- **Arkos:** los documentos del workspace se inyectan como bloque de conocimiento en el contexto del asistente.

## Data Model

```prisma
model Document {
  id          String    @id @default(cuid())
  workspaceId String
  title       String
  content     String    @db.Text   // HTML renderizable para el visor
  rawText     String    @db.Text   // texto plano para Arkos
  category    String?
  wordCount   Int       @default(0)
  uploadedBy  String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  uploader    User      @relation(fields: [uploadedBy], references: [id])

  @@index([workspaceId])
}
```

Añadir relaciones inversas en `User` (`documentsUploaded`) y `Workspace` (`documents`).

## Upload Flow

1. Frontend envía `multipart/form-data` con el archivo `.docx` y `workspaceId` al endpoint `POST /api/documents/upload`.
2. Endpoint verifica auth con `requireUser()` y que el usuario tiene `view_workspace` sobre el workspace.
3. Lee el buffer del archivo.
4. `mammoth.convertToHtml({ buffer })` → HTML limpio.
5. `mammoth.extractRawText({ buffer })` → texto plano.
6. Cuenta palabras: `rawText.split(/\s+/).filter(Boolean).length`.
7. Título: nombre del archivo sin extensión, con guiones/guiones bajos reemplazados por espacios.
8. Inserta `Document` en BD.
9. Responde `{ id, title, wordCount }`.

## Pages

### `/workspace/[workspaceId]/docs` — Listado

Server Component. Carga todos los documentos del workspace ordenados por `createdAt DESC`.

- Cabecera con título "Documentación" y botón "Subir documento".
- Filtros de categoría (pills): Todos + categorías únicas presentes.
- Lista de documentos: icono 📄, título, categoría badge, palabras, fecha.
- Zona drag & drop al pie (`<UploadZone>` Client Component).
- Click en un documento navega a `/docs/[docId]`.

### `/workspace/[workspaceId]/docs/[docId]` — Visor

Server Component. Carga el documento por id.

- Cabecera: título, categoría, palabras, fecha de subida, botón "Eliminar" (solo para el uploader o ADMIN).
- Badge "Arkos usa este doc ✓".
- Cuerpo: `<div dangerouslySetInnerHTML={{ __html: doc.content }} />` con estilos de prosa (prose Tailwind o CSS custom).
- Botón "← Volver a Documentación".

## Components

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `src/lib/docx-convert.ts` | Utilidad | Wraps mammoth: `convertDocx(buffer) → { html, rawText, wordCount }` |
| `src/app/api/documents/upload/route.ts` | API Route | Recibe multipart, llama convertDocx, guarda en BD |
| `src/app/actions/documents.ts` | Server Actions | `getDocuments`, `getDocument`, `deleteDocument` |
| `src/app/(dashboard)/workspace/[workspaceId]/docs/page.tsx` | Server Component | Página listado |
| `src/app/(dashboard)/workspace/[workspaceId]/docs/_components/UploadZone.tsx` | Client Component | Drag & drop + file input, llama al endpoint vía fetch |
| `src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx` | Client Component | Lista + filtros de categoría (estado local) |
| `src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` | Server Component | Visor del documento |
| `WorkspaceIcons.tsx` | Modificar | Añadir icono `docs` |
| `layout.tsx` | Modificar | Añadir nav item "Docs" entre Clientes y Historial |
| `WorkspaceTopbar.tsx` | Modificar | Añadir `{ segment: '/docs', label: 'Docs' }` |

## Arkos Integration

En `src/lib/business-copilot.ts` (o donde se construye el contexto del copilot), añadir una función `getWorkspaceDocsContext(workspaceId)` que:

1. Obtiene los documentos del workspace ordenados por `createdAt DESC`, limitado a 3.
2. Por cada documento, toma los primeros 2.000 palabras del `rawText`.
3. Devuelve un bloque de texto con formato:

```
[Base de conocimiento]
--- {title} ---
{rawText truncado}
```

Este bloque se añade al system prompt de Arkos justo después del contexto de empresa.

**Límites:** máx 3 documentos × 2.000 palabras ≈ 6.000 palabras de contexto documental (~8.000 tokens).

## Navigation

- Nuevo ítem en sidebar: **Docs** con icono de documento, entre "Clientes" y "Historial".
- Breadcrumb: `WorkspaceName › Docs` y `WorkspaceName › Docs › {título}`.

## Out of Scope (sprint posterior)

- Edición de documentos desde la app.
- Sincronización con OneDrive.
- Búsqueda full-text dentro de documentos.
- Control granular de qué documentos usa Arkos (toggle por doc).
- Versionado de documentos.
