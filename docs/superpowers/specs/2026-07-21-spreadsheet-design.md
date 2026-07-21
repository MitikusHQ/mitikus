# Spreadsheet (Hojas de cálculo) — Design Spec

## Goal

Añadir hojas de cálculo a MITIKUS: subir .xlsx existentes, crearlas desde cero, editarlas con un editor completo (fórmulas, gráficos, múltiples pestañas), autoguardado, y acceso desde Arkos como contexto.

## Scope

- Modelo Prisma `Spreadsheet`
- Import .xlsx → FortuneSheet JSON (SheetJS)
- Editor FortuneSheet con dynamic import (ssr: false)
- Autoguardado debounced (2 s tras último cambio)
- Metadatos editables: título + categoría inline
- Eliminar hoja
- Crear desde cero (`/sheets/new`)
- Export .xlsx ("Descargar como .xlsx")
- Sidebar: nuevo ítem "Hojas de cálculo" → `/sheets`
- Página `/tools`: bloque "Herramientas de Office" arriba con cards Docs + Sheets
- Arkos: rawText de hojas en `docsContext` (extensión del contexto existente)

**Fuera de scope:** colaboración en tiempo real, compartir público, macros VBA, gráficos personalizados avanzados.

## Librería

**FortuneSheet** (`@fortune-sheet/react`) — MIT license, compatible Vercel, sin binarios nativos.  
**SheetJS** (`xlsx`) — ya instalado en el proyecto (usado en `import-engine`).

Import dinámico obligatorio por uso de `window`:
```tsx
const Workbook = dynamic(
  () => import('@fortune-sheet/react').then((m) => m.Workbook),
  { ssr: false, loading: () => <div className="…">Cargando editor…</div> }
)
```

## Modelo de datos

```prisma
model Spreadsheet {
  id          String    @id @default(cuid())
  workspaceId String
  title       String
  category    String?
  data        Json      // Array de sheets en formato FortuneSheet
  rawText     String    @default("")  // CSV aplanado para Arkos
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  uploadedBy  String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  uploader    User      @relation(fields: [uploadedBy], references: [id])
}
```

`data` almacena el array de objetos de hoja de FortuneSheet (celdas, fórmulas, estilos, config de columnas/filas). `rawText` se genera aplanando los valores de celda a CSV para usarlo como contexto de Arkos.

## Rutas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/sheets` | Server + `SheetList` Client | Listado + upload .xlsx + botón "+ Nueva hoja" |
| `/sheets/new` | Client Component | Editor vacío, crea al guardar |
| `/sheets/[sheetId]` | Server + `SheetEditorClient` Client | Editor siempre activo + metadatos + delete |

No hay modo "lectura" separado — una hoja de cálculo siempre se muestra editable.

## Import .xlsx

API route: `POST /api/sheets/upload` (multipart/form-data).

```typescript
// Conversión SheetJS → FortuneSheet JSON
import * as XLSX from 'xlsx'

export function xlsxToFortuneSheet(buffer: ArrayBuffer): { data: object[]; rawText: string } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    const cells: Record<string, object> = {}
    // convertir celdas XLSX → formato FortuneSheet
    Object.entries(ws).forEach(([addr, cell]) => {
      if (addr.startsWith('!')) return
      cells[addr] = { v: (cell as XLSX.CellObject).v, m: String((cell as XLSX.CellObject).v ?? ''), ct: { fa: 'General' } }
    })
    return { name, celldata: Object.entries(cells).map(([r, v]) => ({ r: 0, c: 0, v, ...parseAddr(r) })), config: {} }
  })
  const rawText = wb.SheetNames
    .map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name]))
    .join('\n\n')
  return { data: sheets, rawText }
}
```

La función `parseAddr` convierte `A1` → `{ r: 0, c: 0 }`:
```typescript
function parseAddr(addr: string): { r: number; c: number } {
  const col = addr.replace(/\d/g, '')
  const row = parseInt(addr.replace(/\D/g, ''), 10) - 1
  const c = col.split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1
  return { r: row, c }
}
```

## Export .xlsx

Botón "Descargar .xlsx" en el header del editor. Client-side usando SheetJS:

```typescript
import * as XLSX from 'xlsx'

function exportToXlsx(data: object[], title: string) {
  const wb = XLSX.utils.book_new()
  data.forEach((sheet: any) => {
    const ws = XLSX.utils.aoa_to_sheet(
      sheet.celldata?.reduce(/* FortuneSheet → AOA */, []) ?? [[]]
    )
    XLSX.utils.book_append_sheet(wb, ws, sheet.name ?? 'Hoja1')
  })
  XLSX.writeFile(wb, `${title}.xlsx`)
}
```

## Autoguardado

Estado en `SheetEditorClient`:
```
lastSaved: Date | null
saveStatus: 'idle' | 'saving' | 'saved' | 'error'
```

- `onChange` de FortuneSheet dispara `scheduleSave()` (debounce 2000 ms).
- `scheduleSave` cancela el timer anterior y crea uno nuevo.
- Al disparar: llama `updateSpreadsheet` (server action), actualiza `saveStatus`.
- Header muestra: `• Autoguardado` / `Guardando…` / `Guardado ✓` / `Error al guardar`.
- `beforeunload` activo solo cuando `saveStatus === 'saving'` (cambio en vuelo).

## Metadatos editables

Componente `SheetHeader` (igual que `EditableDocHeader`):
- Título editable inline (input que parece h1)
- Select de categoría: `['Finanzas', 'Operaciones', 'RRHH', 'Ventas', 'Otro']`
- Botón "Guardar" aparece cuando hay cambios (`isDirty`)
- Server action `updateSpreadsheetMeta(sheetId, workspaceId, { title, category })`

## Eliminar

`DeleteSheetButton` — botón con confirmación `window.confirm`, llama `deleteSpreadsheet`, redirige a `/sheets`.

## Página /sheets (listado)

`SheetList` Client Component — misma estructura que `DocList`:
- Filtros por categoría
- Cada fila: título, número de hojas (pestañas), fecha, categoría badge
- Botón "+ Nueva hoja" (→ `/sheets/new`)
- `SheetUploadZone` — drag & drop .xlsx, llama `/api/sheets/upload`

## Página /sheets/new

Client Component:
- Input de título
- Workbook vacío (FortuneSheet con una hoja "Hoja1")
- Botón "Crear hoja" → llama `createSpreadsheet`, redirige a `/sheets/[id]`
- Botón "Cancelar" → vuelve a `/sheets`

## Página /sheets/[sheetId]

Server Component carga los datos → pasa a `SheetEditorClient` (Client Component):

```
page.tsx (Server) → SheetEditorClient (Client) → [SheetHeader + FortuneSheetEditor + DeleteSheetButton]
```

`SheetEditorClient`:
- Recibe `sheet: SpreadsheetDetail` (id, title, category, data, createdAt, uploaderName)
- Gestiona autoguardado con debounce
- Muestra `SheetHeader` para metadatos
- Muestra `FortuneSheetEditor` (Workbook de FortuneSheet)
- Muestra botón "Descargar .xlsx" y `DeleteSheetButton`

## Sidebar

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`, añadir tras el ítem "Docs":

```typescript
{
  label: 'Hojas de cálculo',
  href: `${base}/sheets`,
  icon: Icons.sheets,   // nuevo icono — tabla/grid
  description: 'Hojas de cálculo con fórmulas y datos',
},
```

Añadir `sheets` a `Icons` en el archivo de iconos existente (SVG de grid/tabla).

## Página /tools — bloque Office

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx`, añadir antes del bloque actual de herramientas:

```tsx
{/* Herramientas de Office */}
<div className="space-y-3">
  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
    Herramientas de Office
  </h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    <Link href={`/workspace/${workspaceId}/docs`} className="…card…">
      <span className="text-2xl">📄</span>
      <p className="text-sm font-medium">Documentos</p>
      <p className="text-xs text-muted-foreground">Base de conocimiento</p>
    </Link>
    <Link href={`/workspace/${workspaceId}/sheets`} className="…card…">
      <span className="text-2xl">📊</span>
      <p className="text-sm font-medium">Hojas de cálculo</p>
      <p className="text-xs text-muted-foreground">Datos y presupuestos</p>
    </Link>
  </div>
</div>
```

## Arkos — integración

En `apps/web/src/lib/business-memory/business-context.ts`, extender la query existente para incluir hojas de cálculo:

```typescript
// Junto a la query de documentos existente:
db.spreadsheet.findMany({
  where:   { workspaceId },
  orderBy: { updatedAt: 'desc' },
  take:    3,
  select:  { title: true, rawText: true },
}),
```

El rawText de las hojas (formato CSV aplanado) se concatena al `docsContext` existente con una cabecera diferenciadora:

```typescript
const sheetsSnippet = sheets.length === 0 ? '' : '\n\n=== HOJAS DE CÁLCULO ===\n' +
  sheets.map((s) => `--- ${s.title} ---\n${s.rawText.split('\n').slice(0, 100).join('\n')}`).join('\n\n')

const docsContext = (docs.length === 0 && sheets.length === 0) ? null :
  docs.map(/* existente */).join('\n\n') + sheetsSnippet
```

No se modifica `memory-types.ts` — `docsContext` sigue siendo `string | null`.

## Server actions (nuevo archivo)

`apps/web/src/app/actions/spreadsheets.ts`:

```typescript
export interface SpreadsheetData {
  id: string; title: string; category: string | null
  sheetCount: number; createdAt: string; uploaderName: string | null
}
export interface SpreadsheetDetail extends SpreadsheetData {
  data: object[]  // FortuneSheet sheet array
}

export async function getSpreadsheets(workspaceId): Promise<SpreadsheetData[]>
export async function getSpreadsheet(sheetId, workspaceId): Promise<SpreadsheetDetail | null>
export async function createSpreadsheet(workspaceId, data: { title, data, rawText }): Promise<string>
export async function updateSpreadsheetContent(sheetId, workspaceId, data: { data, rawText }): Promise<void>
export async function updateSpreadsheetMeta(sheetId, workspaceId, data: { title, category }): Promise<void>
export async function deleteSpreadsheet(sheetId, workspaceId): Promise<void>
```

## Componentes

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `apps/web/src/app/actions/spreadsheets.ts` | Crear | Todas las server actions de hojas |
| `apps/web/prisma/schema.prisma` | Modificar | Añadir modelo `Spreadsheet` |
| `apps/web/src/app/api/sheets/upload/route.ts` | Crear | POST multipart → convierte .xlsx → JSON, guarda en DB |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/page.tsx` | Crear | Server Component: listado |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetList.tsx` | Crear | Client Component: lista + filtros |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetUploadZone.tsx` | Crear | Client Component: drag & drop .xlsx |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/FortuneSheetEditor.tsx` | Crear | Client Component: Workbook con dynamic import |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/new/page.tsx` | Crear | Client Component: nueva hoja |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/page.tsx` | Crear | Server Component: carga datos |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetEditorClient.tsx` | Crear | Client Component: editor + autoguardado |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetHeader.tsx` | Crear | Client Component: metadatos editables |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/DeleteSheetButton.tsx` | Crear | Client Component: eliminar con confirmación |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` | Modificar | Añadir ítem "Hojas de cálculo" al sidebar |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx` | Modificar | Añadir bloque "Herramientas de Office" |
| `apps/web/src/lib/business-memory/business-context.ts` | Modificar | Añadir hojas al docsContext de Arkos |
| `apps/web/src/lib/icons.tsx` (o equivalente) | Modificar | Añadir icono `sheets` |
