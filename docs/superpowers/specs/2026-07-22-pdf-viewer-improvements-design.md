# Mejoras Visor PDF — Design Spec

## Goal

Añadir búsqueda de texto y panel de miniaturas con toggle al visor PDF de MITIKUS, sin nuevas dependencias (usando react-pdf y pdfjs-dist ya instalados).

## Scope

- Panel lateral izquierdo de miniaturas con toggle show/hide
- Búsqueda de texto con contador de resultados y navegación entre coincidencias
- Resaltado de coincidencias usando el TextLayer ya activo

**Fuera de scope:** persistencia del estado del sidebar (localStorage), búsqueda entre múltiples PDFs, exportar resultados de búsqueda.

## Layout

```
[⊞ toggle] [← Pág N/M →] [🔍 input  2/7 ↑↓] [− 100% +]
┌──────────┬─────────────────────────────────────────────┐
│  Sidebar │                                             │
│  (80px)  │            Canvas PDF (react-pdf)           │
│          │                                             │
│ [pág 1]  │     texto con resaltado de búsqueda        │
│ [pág 2]  │                                             │
│ [pág 3]  │                                             │
│   ...    │                                             │
└──────────┴─────────────────────────────────────────────┘
```

El sidebar es condicional — aparece/desaparece con el botón ⊞ en la toolbar.

## Componentes

### `PdfThumbnailSidebar.tsx` — Crear

**Responsabilidad:** Renderizar miniaturas de páginas con lazy loading.

**Props:**
```typescript
interface Props {
  pdfData:     { data: Uint8Array }
  numPages:    number
  currentPage: number
  onPageSelect: (page: number) => void
}
```

**Comportamiento:**
- Contenedor `overflow-y: auto`, ancho fijo 80px
- Cada miniatura es un `<Page pageNumber={n} scale={0.12} renderTextLayer={false} renderAnnotationLayer={false} />`
- Lazy loading via `IntersectionObserver`: solo se renderiza `<Page>` cuando la miniatura entra en el viewport; antes muestra un placeholder gris del mismo tamaño
- Página activa: borde `border-primary` (2px), número en color primario
- Click en miniatura → `onPageSelect(n)` → el visor principal salta a esa página

**Tamaño de placeholder:** A4 a scale 0.12 = aprox 71×100px. Se usa como dimensión fija del placeholder.

### `PdfSearchBar.tsx` — Crear

**Responsabilidad:** Input de búsqueda + contador + navegación entre coincidencias.

**Props:**
```typescript
interface Props {
  pdfDoc:       PDFDocumentProxy | null  // ref al documento pdfjs cargado
  onMatchPage:  (page: number) => void   // navegar a la página de la coincidencia
}
```

**Estado interno:**
- `query: string` — texto buscado
- `matches: Array<{ page: number; index: number }>` — todas las coincidencias encontradas
- `currentMatch: number` — índice de la coincidencia activa (0-based)

**Flujo de búsqueda:**
1. Usuario escribe en el input (debounce 300ms)
2. Se itera sobre todas las páginas del PDF (`pdfDoc.getPage(n).getTextContent()`)
3. Se extrae el texto de cada página y se cuenta las ocurrencias del query
4. `matches` se llena con `{ page, index }` por cada ocurrencia
5. Se navega automáticamente a la primera coincidencia (`onMatchPage(matches[0].page)`)
6. Botones ↑ ↓ navegan entre coincidencias, actualizando `currentMatch` y llamando `onMatchPage`

**Resaltado:** El `renderTextLayer={true}` ya activo en `<Page>` expone el texto como elementos DOM. Al navegar a una página, pdfjs-dist puede resaltar coincidencias via `PDFPageView.findController` o, más simple, usando la API `window.find()` del navegador como fallback. La implementación preferida es el resaltado nativo del browser con `window.find(query)` tras un `requestAnimationFrame` cuando la página está renderizada.

**UI:**
```
🔍 [  input  ] 2 / 7  ↑  ↓
```
- Si `query` vacío: ocultar contador y botones
- Si 0 resultados: mostrar "0 / 0" en rojo tenue
- Input `aria-label="Buscar en el PDF"`

### `PdfViewer.tsx` — Modificar

**Cambios respecto al estado actual:**

1. **Nuevo estado:** `const [showSidebar, setShowSidebar] = useState(false)`

2. **Nueva ref al documento pdfjs:**
   ```typescript
   const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
   ```
   En `onDocumentLoadSuccess`: `setPdfDoc(pdf._pdfInfo ? ... )` — se obtiene el proxy via el callback `onLoadSuccess` que en react-pdf v7 recibe `{ numPages, ...pdf }`. Usar `pdfDocRef` con `useRef` para evitar re-renders.

3. **Layout modificado:**
   ```tsx
   <div className="flex flex-col gap-4">
     {/* Toolbar — añadir toggle y SearchBar */}
     <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 w-full justify-between">
       <button onClick={() => setShowSidebar(s => !s)} ...>⊞</button>
       {/* navegación existente */}
       <PdfSearchBar pdfDoc={pdfDoc} onMatchPage={setPageNumber} />
       {/* zoom existente */}
     </div>

     {/* Zona principal — sidebar + canvas */}
     <div className="flex gap-3 overflow-auto w-full">
       {showSidebar && (
         <PdfThumbnailSidebar
           pdfData={pdfData}
           numPages={numPages ?? 0}
           currentPage={pageNumber}
           onPageSelect={setPageNumber}
         />
       )}
       <div className="flex-1 flex justify-center">
         <Document ...>
           <Page ... />
         </Document>
       </div>
     </div>
   </div>
   ```

4. **Obtener `PDFDocumentProxy`:** react-pdf expone el documento interno en el callback `onLoadSuccess`. En react-pdf v9 el callback recibe un objeto `PDFDocumentProxy` directamente. Almacenarlo en un ref para pasarlo a `PdfSearchBar`.

## Archivos

| Acción | Archivo |
|--------|---------|
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfThumbnailSidebar.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfSearchBar.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewer.tsx` |

## Sin nuevas dependencias

`react-pdf` y `pdfjs-dist` ya están instalados. La búsqueda usa `PDFDocumentProxy` (pdfjs nativo). El resaltado usa el TextLayer ya activo (`renderTextLayer={true}`). No se instala nada nuevo.
