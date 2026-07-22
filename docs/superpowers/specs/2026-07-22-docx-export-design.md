# Exportación .docx — Design Spec

## Goal

Añadir un botón "↓ .docx" en el visor de documentos de MITIKUS que genere y descargue un archivo Word (.docx) de calidad profesional directamente desde el navegador, sin servidor.

## Scope

- Botón "↓ .docx" en `EditableDocHeader` junto a "↓ PDF" (ambos reubicados al header)
- Generación cliente con el paquete `docx` (ya instalado, v9.7.1), import dinámico
- Parser HTML → docx que soporta: párrafos, h1–h3, negrita, cursiva, enlaces, listas ul/ol, blockquote, code inline
- Metadatos Word reales (título, autor, fecha en `core.properties`)
- Página A4 con márgenes estándar (2.54 cm)
- Descarga directa vía `Packer.toBlob()` + Blob URL

**Fuera de scope:** tablas Tiptap, imágenes embebidas, comentarios Word, estilos personalizados por workspace.

## Reubicación de botones de exportación

Los botones "↓ PDF" y "↓ .docx" se mueven a `EditableDocHeader`, agrupados junto al badge "Arkos usa este doc ✓". Se eliminan del `DocViewerClient` (donde "↓ PDF" estaba mezclado con "Editar contenido").

`EditableDocHeader` recibirá dos props nuevas:
```typescript
onExportPdf:  () => void
onExportDocx: () => void
isExportingPdf:  boolean
isExportingDocx: boolean
```

`DocViewerClient` sigue siendo el dueño de la lógica de exportación (tiene acceso al `rawText` y al `html` actualizados en tiempo real). Pasa los handlers y estados a `EditableDocHeader` mediante props.

Layout del header resultante:
```
[Título editable]  [Categoría ▼]  [Guardar?]  |  Arkos ✓  ↓ PDF  ↓ .docx
```

## Parser HTML → docx

Entrada: `doc.content` (HTML de Tiptap, string).

El parser usa `DOMParser` (disponible en cliente) para recorrer los nodos hijo del `<body>` y construir un array de elementos `docx`:

| Elemento HTML | Elemento docx |
|--------------|---------------|
| `<p>` | `Paragraph` con `TextRun`s inline |
| `<h1>` | `Paragraph` con `HeadingLevel.HEADING_1` |
| `<h2>` | `Paragraph` con `HeadingLevel.HEADING_2` |
| `<h3>` | `Paragraph` con `HeadingLevel.HEADING_3` |
| `<ul>` | `Paragraph`s con `bullet: { level: 0 }` |
| `<ol>` | `Paragraph`s con numeración `decimal` level 0 |
| `<blockquote>` | `Paragraph` con indent izquierdo (720 twips) y borde izquierdo gris |
| `<strong>` / `<b>` | `TextRun` con `bold: true` |
| `<em>` / `<i>` | `TextRun` con `italics: true` |
| `<code>` inline | `TextRun` con `font: { name: 'Courier New' }`, fondo gris claro |
| `<a href>` | `ExternalHyperlink` con `TextRun` subrayado azul |
| `<br>` | `TextRun` con `break: 1` |

Inlines (`<strong>`, `<em>`, `<a>`, `<code>`) se procesan recursivamente dentro de cada bloque.

## Metadatos Word

```typescript
const doc = new Document({
  creator:     uploaderName ?? 'MITIKUS',
  title:       docTitle,
  description: `Exportado desde MITIKUS el ${new Date().toLocaleDateString('es-ES')}`,
  // ...
})
```

La primera sección incluye un `Paragraph` con el título en `HeadingLevel.TITLE` y un `Paragraph` de metadatos (fecha, palabras) en gris antes del cuerpo del documento.

## Configuración de página

```typescript
sections: [{
  properties: {
    page: {
      size: { width: 11906, height: 16838 },  // A4 en twips
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },  // 2.54 cm
    },
  },
  children: [titleParagraph, metaParagraph, ...bodyElements],
}]
```

## Flujo de descarga

```typescript
async function handleExportDocx() {
  const { Document, Packer, ... } = await import('docx')
  const elements = parseHtmlToDocx(doc.content)
  const wordDoc  = buildWordDocument({ title: doc.title, uploaderName: doc.uploaderName, elements })
  const blob     = await Packer.toBlob(wordDoc)
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = `${doc.title}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
```

## Archivos

| Acción | Archivo |
|--------|---------|
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx` |
| Create | `apps/web/src/lib/docx-export.ts` — parser HTML→docx + builder |
