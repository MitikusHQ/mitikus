# Módulo de Archivos con Carpetas — Design Spec

**Goal:** Añadir un módulo de gestión de archivos con carpetas anidadas en Mi Office de MITIKUS, que permita organizar, subir y descargar archivos de cualquier tipo soportado (PDF, DOCX, XLSX, imágenes).

**Architecture:** Modelo `Folder` auto-referenciado para anidado + modelo `WorkspaceFile` apuntando a Vercel Blob. UI de dos columnas: árbol de carpetas izquierda, contenido derecha. Acceso desde `/workspace/[workspaceId]/office/files`.

**Tech Stack:** Next.js 15 App Router, Prisma, PostgreSQL, Vercel Blob, TypeScript, Tailwind

---

## Modelo de datos

```prisma
model Folder {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  parentId    String?  // null = raíz

  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parent      Folder?    @relation("FolderTree", fields: [parentId], references: [id])
  children    Folder[]   @relation("FolderTree")
  files       WorkspaceFile[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@index([parentId])
  @@map("folders")
}

model WorkspaceFile {
  id          String   @id @default(cuid())
  workspaceId String
  folderId    String?  // null = raíz
  name        String
  type        FileType
  url         String   // Vercel Blob URL
  size        Int      // bytes
  mimeType    String

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  folder      Folder?   @relation(fields: [folderId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@index([folderId])
  @@map("workspace_files")
}

enum FileType {
  DOC
  SHEET
  PDF
  IMAGE
}
```

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/[workspaceId]/office/files` | Página principal del módulo |
| `/api/workspace/[workspaceId]/folders` | GET lista, POST crear |
| `/api/workspace/[workspaceId]/folders/[folderId]` | PATCH renombrar, DELETE eliminar |
| `/api/workspace/[workspaceId]/files` | GET lista por carpeta, POST subir |
| `/api/workspace/[workspaceId]/files/[fileId]` | DELETE eliminar, PATCH mover |

---

## UI

### Layout dos columnas

```
┌─────────────────┬──────────────────────────────────┐
│ 📁 Raíz         │  [+ Nueva carpeta] [+ Subir]      │
│   📁 Clientes   │                                   │
│     📁 García   │  📄 contrato.pdf         [↓] [🗑] │
│     📁 Martínez │  🖼 foto-001.jpg         [↓] [🗑] │
│   📁 Proyectos  │  📊 presupuesto.xlsx     [↓] [🗑] │
└─────────────────┴──────────────────────────────────┘
```

- **Árbol izquierdo:** carpetas colapsables, click para navegar
- **Panel derecho:** archivos de la carpeta activa + breadcrumb
- **Subida:** drag & drop + botón, detecta tipo por mimeType
- **Descarga:** formato original desde Vercel Blob

### Tipos soportados en subida

| Extensiones | FileType |
|-------------|----------|
| .pdf | PDF |
| .docx | DOC |
| .xlsx | SHEET |
| .jpg, .jpeg, .png, .webp | IMAGE |

---

## Operaciones

### Carpetas
- **Crear:** botón "+ Nueva carpeta" en el panel activo (crea dentro de la carpeta actual o en raíz)
- **Renombrar:** doble click o menú contextual
- **Eliminar:** con confirmación; si tiene contenido, advertencia explícita

### Archivos
- **Subir:** drag & drop o botón, múltiples archivos a la vez
- **Descargar:** botón descarga individual, abre/descarga el Blob URL
- **Mover:** seleccionar archivo → "Mover a..." → selector de carpeta destino
- **Eliminar:** con confirmación, borra de Blob y de DB

---

## Fuera de scope (sprint futuro)
- Previsualización inline de imágenes
- Compartir archivo con cliente
- Búsqueda dentro del módulo
- Descargar carpeta entera como ZIP
- Integración en ficha de cliente (sprint siguiente)
