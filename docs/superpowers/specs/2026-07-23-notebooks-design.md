# Notebooks — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Módulo de síntesis y chat con documentos en MITIKUS, similar a NotebookLM: el usuario crea notebooks, añade fuentes (docs/PDFs del workspace, texto pegado, URLs) y puede leer un resumen automático o hacer preguntas en chat con streaming.

**Architecture:** Prisma + PostgreSQL para notebooks, fuentes y mensajes. El texto de cada fuente se extrae y guarda en BD al añadirla. El chat envía el contexto completo (todas las fuentes concatenadas) a Claude claude-sonnet-5 en cada petición. Streaming via ReadableStream + SSE en route handler. Síntesis global guardada en caché en el modelo Notebook.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, Anthropic SDK, cheerio (extracción URLs), pdf-parse (ya instalado), Tailwind CSS

---

## Modelo de datos

```prisma
model Notebook {
  id              String    @id @default(cuid())
  workspaceId     String
  title           String
  synthesisCache  String?   // resumen global generado por IA, JSON: { summary, keyPoints[] }
  synthesisDirty  Boolean   @default(true) // true = regenerar síntesis en próxima visita
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  workspace  Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator    User              @relation("NotebooksCreated", fields: [createdBy], references: [id], onDelete: Restrict)
  sources    NotebookSource[]
  messages   NotebookMessage[]

  @@index([workspaceId])
  @@map("notebooks")
}

model NotebookSource {
  id         String   @id @default(cuid())
  notebookId String
  type       String   // 'doc' | 'pdf' | 'text' | 'url'
  title      String
  content    String   @db.Text  // texto extraído, guardado en BD
  charCount  Int      // longitud de content
  docId      String?  // FK lógica a Document (sin relación Prisma)
  pdfId      String?  // FK lógica a Pdf (sin relación Prisma)
  url        String?
  createdAt  DateTime @default(now())

  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)

  @@index([notebookId])
  @@map("notebook_sources")
}

model NotebookMessage {
  id              String   @id @default(cuid())
  notebookId      String
  role            String   // 'user' | 'assistant'
  content         String   @db.Text
  sourcesSnapshot String   @default("[]") // JSON: array de IDs de fuentes activas en ese momento
  createdAt       DateTime @default(now())

  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)

  @@index([notebookId])
  @@map("notebook_messages")
}
```

**Relaciones a añadir en modelos existentes:**

```prisma
// En model User:
notebooksCreated  Notebook[]  @relation("NotebooksCreated")

// En model Workspace:
notebooks  Notebook[]
```

---

## Límite de contexto

- Límite: **400.000 caracteres** totales entre todas las fuentes de un notebook (~100k tokens)
- Al añadir una fuente: si `suma(charCount) + nuevaFuente.charCount > 400_000` → bloquear y mostrar: *"Has alcanzado el límite de contexto. Elimina alguna fuente para añadir una nueva."*
- El panel de fuentes muestra el total actual: `"Contexto: 124.320 / 400.000 caracteres"`

---

## Extracción de texto por tipo de fuente

| Tipo   | Origen                          | Extracción                                           |
|--------|---------------------------------|------------------------------------------------------|
| `doc`  | Document.content (HTML Tiptap)  | Strip tags HTML → texto plano                        |
| `pdf`  | Pdf.pdfData (Buffer en BD)      | `pdf-parse(buffer).text`                             |
| `text` | Input directo del usuario       | Directo                                              |
| `url`  | URL externa                     | `fetch(url)` + `cheerio` → extraer texto del `body`  |

El título se infiere: para `doc`/`pdf` se usa el título del documento; para `text` los primeros 60 caracteres; para `url` el `<title>` de la página.

---

## Server Actions (`notebooks.ts`)

```typescript
// Listar notebooks del workspace
getNotebooks(workspaceId: string): Promise<NotebookData[]>
// NotebookData: id, title, sourceCount, createdAt

// Obtener notebook con fuentes y mensajes
getNotebook(workspaceId: string, notebookId: string): Promise<NotebookDetail>
// NotebookDetail: id, title, synthesisCache, synthesisDirty, sources[], messages[]

// Crear notebook
createNotebook(workspaceId: string, title: string): Promise<{ id: string }>

// Actualizar título
updateNotebook(notebookId: string, title: string): Promise<void>

// Añadir fuente — extrae texto, calcula charCount, marca synthesisDirty=true
addSource(notebookId: string, input: AddSourceInput): Promise<NotebookSourceData>
// AddSourceInput: { type, docId?, pdfId?, text?, url? }

// Eliminar fuente — marca synthesisDirty=true
deleteSource(sourceId: string): Promise<void>

// Eliminar notebook
deleteNotebook(notebookId: string): Promise<void>

// Guardar mensajes (llamado tras respuesta de IA)
saveMessage(notebookId: string, role: 'user'|'assistant', content: string, sourcesSnapshot: string[]): Promise<void>

// Guardar síntesis en caché
saveSynthesis(notebookId: string, synthesisCache: string): Promise<void>
```

---

## API Routes

### `POST /api/notebooks/[notebookId]/chat`

Recibe `{ message: string }`. Construye el prompt con todas las fuentes y el historial, llama a Claude claude-sonnet-5 con streaming, devuelve `ReadableStream` (text/event-stream).

```
System prompt:
  "Eres un asistente que analiza los siguientes documentos del usuario.
   Responde siempre basándote en el contenido de las fuentes.
   Si la respuesta no está en las fuentes, indícalo explícitamente.

   FUENTES:
   ---
   [TÍTULO DE FUENTE 1]
   [contenido completo]
   ---
   [TÍTULO DE FUENTE 2]
   [contenido completo]
   ---"

Messages: historial NotebookMessage[] + mensaje nuevo del usuario
```

### `POST /api/notebooks/[notebookId]/synthesize`

Sin body. Extrae todas las fuentes del notebook, llama a Claude claude-sonnet-5 (no streaming), genera:

```json
{
  "summary": "Resumen global de 3-5 párrafos...",
  "keyPoints": ["Punto 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"]
}
```

Guarda el resultado en `Notebook.synthesisCache` y marca `synthesisDirty=false`. Devuelve el JSON.

---

## Páginas

### `/notebooks` — Listado

Server Component. Carga `getNotebooks(workspaceId)`.

```
[header]
  "Notebooks"     n notebooks
                  [+ Nuevo notebook]

[grid de cards]
  card: título | n fuentes | fecha | [×]
```

### `/notebooks/[notebookId]` — Interfaz principal

Client Component (`NotebookClient`). Layout dos columnas:

```
[panel izquierdo w-72 border-r]     [panel derecho flex-1]
  [título editable onBlur]
                                      [SÍNTESIS — colapsable, abierto por defecto]
  Fuentes                               Resumen global (3-5 párrafos)
  ──────────────────                    Puntos clave:
  📄 Doc X          [×]                 • Punto 1
     12.400 chars                       • Punto 2
  📑 PDF Y          [×]                 • ...
     8.200 chars                        [Regenerar síntesis]
  🔗 mitikus.com    [×]
     3.100 chars                      ──────────────────────────────
  📝 Texto pegado   [×]
     900 chars                        [CHAT]
                                        [mensaje usuario]
  Contexto: 24.600 / 400.000           [respuesta IA en streaming]
                                        [mensaje usuario]
  [+ Añadir fuente]                     [respuesta IA]
                                        ...
                                        [textarea + botón Enviar]
```

**Comportamiento síntesis:**
- Si `synthesisDirty=true` al cargar: llamar automáticamente a `/synthesize` y mostrar spinner mientras carga
- Si `synthesisDirty=false`: mostrar `synthesisCache` directamente
- Botón "Regenerar síntesis": fuerza llamada a `/synthesize`

**Comportamiento chat:**
- `onSubmit`: guardar mensaje usuario en BD (`saveMessage`), llamar a `/chat` con fetch+ReadableStream, mostrar respuesta en streaming en pantalla, al completar guardar mensaje assistant en BD

---

## Modal "Añadir fuente"

4 tabs o secciones:

**Desde el workspace:**
- Selector de Docs (lista de `Document` del workspace con checkbox)
- Selector de PDFs (lista de `Pdf` del workspace con checkbox)

**Texto libre:**
- `<textarea>` con placeholder "Pega el texto aquí..."
- Campo "Título" opcional

**URL:**
- Input de URL
- Botón "Cargar" → el servidor extrae el texto y muestra preview del título inferido

Al confirmar, se llama a `addSource` por cada fuente seleccionada.

---

## Componentes

| Componente              | Descripción                                                          |
|-------------------------|----------------------------------------------------------------------|
| `NotebookCard.tsx`      | Card del listado con título, nº fuentes, fecha, botón eliminar       |
| `NotebookList.tsx`      | Grid + botón nuevo notebook + modal crear                            |
| `NotebookClient.tsx`    | Client Component principal: estado, layout dos columnas              |
| `SourcePanel.tsx`       | Panel izquierdo: lista de fuentes, total chars, botón añadir         |
| `AddSourceModal.tsx`    | Modal con 4 modos de añadir fuentes                                  |
| `SynthesisPanel.tsx`    | Resumen + puntos clave + botón regenerar (colapsable)                |
| `ChatPanel.tsx`         | Historial de mensajes + input + streaming                            |
| `ChatMessage.tsx`       | Burbuja individual de mensaje (user/assistant)                       |

---

## Integración Mi Office

- Card "Notebooks" en `office/page.tsx` → enlaza a `/workspace/[id]/notebooks`
- Entrada `/notebooks` en `SECTION_LABELS` de `WorkspaceTopbar.tsx`
- Sin ítem en el sidebar principal

---

## Fuera de scope

- Compartir notebooks públicamente
- Colaboración en tiempo real entre usuarios
- Exportar el chat o la síntesis
- Audio overview (podcast-style como NotebookLM)
- Búsqueda semántica / embeddings
- Límite por mensaje (se asume que el historial creciente no sobrepasa la ventana; en MVP se trunca el historial a los últimos 20 mensajes si es necesario)
