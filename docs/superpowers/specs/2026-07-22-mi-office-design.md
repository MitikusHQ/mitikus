# Mi Office — Design Spec

## Goal

Agrupar Documentos, Hojas de cálculo y PDFs bajo una entrada única "Mi Office" en el sidebar, eliminando los tres ítems sueltos. Acceso vía página hub en `/office`.

## Scope

- Un ítem "Mi Office" en el sidebar → `/workspace/[workspaceId]/office`
- Página hub `/office` con 3 cards (Docs, Sheets, PDFs)
- Eliminar Docs, Hojas de cálculo y PDFs de `mainItems` en `layout.tsx`
- Eliminar bloque "Herramientas de Office" de `tools/page.tsx` (redundante)
- Añadir icono `office` a `WorkspaceIcons.tsx`

**Fuera de scope:** cambiar las rutas `/docs`, `/sheets`, `/pdfs`; modificar el comportamiento de cada herramienta.

## Archivos

| Acción | Archivo |
|--------|---------|
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx` |

## Página hub `/office/page.tsx`

Server Component. Misma estructura visual que `/tools` — grid de cards.

```tsx
// Título: "Mi Office"
// Subtítulo: "Tus herramientas de documento"
// Grid 3 columnas en sm, 1 en móvil

// Card 1 — Documentos
href: /workspace/[workspaceId]/docs
icono: 📄
título: Documentos
subtítulo: Base de conocimiento del workspace

// Card 2 — Hojas de cálculo  
href: /workspace/[workspaceId]/sheets
icono: 📊
título: Hojas de cálculo
subtítulo: Datos, presupuestos y análisis

// Card 3 — PDFs
href: /workspace/[workspaceId]/pdfs
icono: 📑
título: PDFs
subtítulo: Visor, búsqueda y conversión a Doc
```

Cada card: `rounded-lg border p-5 hover:border-primary/50 hover:bg-muted/50 transition-colors`, icono grande (text-3xl), título (text-sm font-medium), subtítulo (text-xs text-muted-foreground), badge "BUILT-IN" (text-xs text-primary font-medium).

## Icono `office` en WorkspaceIcons.tsx

SVG de carpeta con documentos — diferente a `docs` (que es un solo documento):

```tsx
office: (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
),
```

## Cambios en `layout.tsx`

Eliminar de `mainItems`:
```typescript
// ELIMINAR estos 3 objetos:
{ label: 'Docs', href: `${base}/docs`, icon: Icons.docs, description: '...' },
{ label: 'Hojas de cálculo', href: `${base}/sheets`, icon: Icons.sheets, description: '...' },
{ label: 'PDFs', href: `${base}/pdfs`, icon: Icons.pdf, description: '...' },
```

Añadir en su lugar (después de `Clientes`):
```typescript
{
  label: 'Mi Office',
  href: `${base}/office`,
  icon: Icons.office,
  description: 'Documentos, hojas de cálculo y PDFs del workspace',
},
```

## Cambios en `tools/page.tsx`

Eliminar el bloque "Herramientas de Office" (líneas 113–147 actuales):
```tsx
{/* ELIMINAR este bloque completo: */}
{/* Herramientas de Office */}
<div className="space-y-3">
  <h2 ...>Herramientas de Office</h2>
  <div className="grid ...">
    {/* cards de Docs, Sheets, PDFs */}
  </div>
</div>
```

El resto de `tools/page.tsx` (herramientas instaladas, botones Generar/Añadir) permanece intacto.
