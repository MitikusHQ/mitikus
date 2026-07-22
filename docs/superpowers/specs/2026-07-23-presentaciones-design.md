# Presentaciones — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Módulo de presentaciones en MITIKUS: crear slides con editor visual, renderizar con reveal.js y compartir vía link público sin autenticación.

**Architecture:** Prisma + PostgreSQL para almacenar presentaciones y slides. Editor Client Component con guardado `onBlur` por campo. Página pública `/p/[token]` renderiza reveal.js con reveal instalado como dependencia npm (no CDN).

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, reveal.js (npm), Tailwind CSS

---

## Modelo de datos

```prisma
model Presentation {
  id          String   @id @default(cuid())
  workspaceId String
  title       String
  accentColor String   @default("#6366f1")
  shareToken  String   @unique @default(cuid())
  slides      Slide[]
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator     User         @relation("PresentationsCreated", fields: [createdBy], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@map("presentations")
}

model Slide {
  id             String  @id @default(cuid())
  presentationId String
  order          Int
  layout         String  @default("title-body")
  // layout values: "title-body" | "title-bullets" | "title-image" | "blank"
  title          String  @default("")
  content        String  @default("{}") // JSON: { type: "text"|"bullets"|"image", value: string|string[] }
  imageUrl       String?

  presentation   Presentation @relation(fields: [presentationId], references: [id], onDelete: Cascade)

  @@index([presentationId])
  @@map("slides")
}
```

### Campo `content` — formato JSON

```typescript
type SlideContent =
  | { type: 'text';    value: string }
  | { type: 'bullets'; value: string[] }
  | { type: 'image';   value: string }   // URL externa
  | { type: 'blank';   value: null }
```

El campo `layout` determina qué campos se renderizan:
- `title-body` → título + content type "text"
- `title-bullets` → título + content type "bullets" (array de strings)
- `title-image` → título + content type "image" (URL) + imageUrl redundante para preview rápido
- `blank` → solo título (slide de portada o separador)

---

## Plantillas predefinidas (hardcoded)

Las plantillas son arrays de slides en memoria — no se guardan en BD hasta que el usuario crea la presentación.

### Pitch (5 slides)
```
1. blank       — título: "Nombre del Proyecto", subtitle en content
2. title-body  — "El Problema"
3. title-body  — "La Solución"
4. title-bullets — "Mercado"
5. title-body  — "Equipo & CTA"
```

### Propuesta Comercial (4 slides)
```
1. blank         — título: "Propuesta Comercial"
2. title-body    — "Contexto"
3. title-bullets — "Propuesta de Valor"
4. title-body    — "Próximos Pasos"
```

### Informe (3 slides)
```
1. blank         — título: "Informe"
2. title-bullets — "Datos Clave"
3. title-body    — "Conclusiones"
```

---

## Server Actions (`presentations.ts`)

```typescript
// Listar presentaciones del workspace
getPresentations(workspaceId: string): Promise<PresentationData[]>
// PresentationData: id, title, accentColor, shareToken, slideCount, createdAt, creatorName

// Obtener presentación con slides (autenticado)
getPresentation(workspaceId: string, presentationId: string): Promise<PresentationDetail>
// PresentationDetail: todos los campos + slides[]

// Crear presentación (desde cero o plantilla)
createPresentation(workspaceId: string, title: string, accentColor: string, templateSlides?: SlideInput[]): Promise<{ id: string }>

// Actualizar título o color de acento
updatePresentation(presentationId: string, data: { title?: string; accentColor?: string }): Promise<void>

// Actualizar un slide
updateSlide(slideId: string, data: Partial<SlideInput>): Promise<void>
// SlideInput: { layout?, title?, content?, imageUrl? }

// Añadir slide al final
addSlide(presentationId: string): Promise<{ id: string; order: number }>

// Eliminar slide
deleteSlide(slideId: string): Promise<void>

// Reordenar slides
reorderSlides(presentationId: string, orderedIds: string[]): Promise<void>

// Eliminar presentación
deletePresentation(presentationId: string): Promise<void>

// Obtener por token (sin auth — página pública)
getPresentationByToken(shareToken: string): Promise<PresentationPublic>
// PresentationPublic: id, title, accentColor, slides[] (sin workspaceId ni datos de usuario)
```

---

## Páginas

### `/presentations` — Listado

Server Component. Carga `getPresentations(workspaceId)`.

Layout:
```
[header]
  "Presentaciones"    n presentaciones
                      [+ Nueva presentación]

[grid de cards]
  card: título | n slides | fecha | [▶] [···]
```

Botón "+ Nueva presentación" abre `NewPresentationModal`.

### `/presentations/[id]` — Editor

Client Component (`PresentationEditorClient`). Layout de tres zonas:

```
[header: título editable | color picker | ▶ Presentar | Compartir | Guardado ✓]
[sidebar w-48 | editor flex-1 | preview flex-1]
```

**Sidebar:** lista de slides en miniatura (orden + título truncado). Click selecciona el slide activo. Botón "+ Slide" al final. Botón de eliminar slide (×) en hover.

**Editor (panel central):** para el slide seleccionado:
- Selector de layout (4 opciones con iconos)
- Campo "Título" — `<input>` con `onBlur` → `updateSlide`
- Campo de contenido según layout:
  - `title-body` → `<textarea>` libre
  - `title-bullets` → lista de inputs, Enter añade bullet, Backspace en vacío elimina
  - `title-image` → input de URL externa + preview de imagen
  - `blank` → sin campo de contenido
- Indicador "Guardado ✓" / "Guardando..." (aparece tras cada onBlur)

**Preview (panel derecho):** miniatura del slide renderizado con los estilos de reveal.js pero en modo estático (no interactivo). Se actualiza en tiempo real al editar.

### `/p/[token]` — Presentación pública

Fuera del dashboard layout. Sin autenticación. Renderiza reveal.js con los slides de la presentación.

```html
<!-- Página completa reveal.js -->
<html>
<head>
  <link rel="stylesheet" href="/reveal/reveal.css">
  <style>:root { --accent: #6366f1; }</style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section><!-- slide 1 --></section>
      <section><!-- slide 2 --></section>
    </div>
  </div>
  <script src="/reveal/reveal.js"></script>
  <script>Reveal.initialize({ hash: true })</script>
</body>
</html>
```

Los archivos de reveal.js se sirven desde `public/reveal/` (copiados del paquete npm en build o manualmente).

Si el token no existe: página 404 simple.

---

## Componentes

### `NewPresentationModal.tsx`

Modal con:
- Input de título
- Color picker (6 colores predefinidos + input hex)
- 3 cards de plantilla + opción "En blanco"
- Botón "Crear presentación" → `createPresentation` → redirect al editor

### `PresentationEditorClient.tsx`

Client Component principal del editor. Props: `{ presentation: PresentationDetail, workspaceId: string }`.

Estado interno:
- `activeSlideId: string`
- `saveStatus: 'saved' | 'saving' | 'idle'`

Handlers:
- `handleSlideFieldBlur(slideId, field, value)` → `updateSlide` → `setSaveStatus`
- `handleAddSlide()` → `addSlide` → selecciona el nuevo slide
- `handleDeleteSlide(slideId)` → `deleteSlide` → selecciona el slide anterior
- `handleColorChange(color)` → `updatePresentation`
- `handleShare()` → copia `https://www.mitikus.com/p/[shareToken]` al portapapeles

### `SlideEditor.tsx`

Editor de un slide individual. Props: `{ slide: Slide, accentColor: string, onBlur: (field, value) => void, saveStatus }`.

Renderiza los campos según `slide.layout`. Gestiona el estado local de los bullets (array de strings con inputs individuales).

### `BulletListEditor.tsx`

Editor de bullets. Props: `{ bullets: string[], onChange: (bullets: string[]) => void, onBlur: () => void }`.

Comportamiento:
- Array de `<input>` con `value={bullet}`
- `onKeyDown` en Enter: añade nuevo bullet vacío después y enfoca
- `onKeyDown` en Backspace con input vacío: elimina bullet y enfoca el anterior
- `onChange` de cada input actualiza el array local
- `onBlur` del último input que pierde foco dispara el guardado

### `SlidePreview.tsx`

Miniatura del slide con los estilos aplicados. Sin interactividad. Reutilizado tanto en el panel preview del editor como en las miniaturas del sidebar.

### `PresentationCard.tsx`

Card del listado con título, número de slides, fecha y acciones (abrir editor, copiar link, eliminar).

---

## Reveal.js — setup

```bash
npm install reveal.js --workspace=apps/web
```

Copiar los assets estáticos a `apps/web/public/reveal/`:
```
public/reveal/reveal.css
public/reveal/reveal.js
public/reveal/theme/   (solo white.css y black.css)
```

La página `/p/[token]` es un Server Component que devuelve un documento HTML completo (no usa el layout de Next.js) con `export const dynamic = 'force-dynamic'`.

---

## Integración Mi Office

- Card "Presentaciones" en `office/page.tsx` → enlaza a `/workspace/[id]/presentations`
- Entrada `/presentations` en `SECTION_LABELS` de `WorkspaceTopbar.tsx`
- Sin ítem en el sidebar principal

---

## Archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/web/prisma/schema.prisma` |
| Crear | `apps/web/src/app/actions/presentations.ts` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/PresentationCard.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/NewPresentationModal.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/PresentationList.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/PresentationEditorClient.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/SlideEditor.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/BulletListEditor.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/SlidePreview.tsx` |
| Crear | `apps/web/src/app/p/[token]/page.tsx` — fuera del dashboard layout |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx` |

---

## Fuera de scope

Export a PowerPoint/PDF, comentarios, colaboración en tiempo real, transiciones personalizadas por slide, drag & drop para reordenar, subida de imágenes (solo URLs externas en MVP).
