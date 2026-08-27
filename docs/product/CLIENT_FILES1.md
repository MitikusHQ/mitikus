# CLIENT_FILES1 — Expediente de cliente

Fecha: 2026-08-22

## Objetivo

Añadir archivos directamente en la ficha de un cliente sin crear un almacén paralelo.

MITIKUS mantiene `Mi Office` como repositorio general de archivos del workspace. La ficha del cliente muestra una vista filtrada de esos archivos cuando están vinculados al cliente.

## Cambios

- `WorkspaceFile.clientId String?` añadido al schema de Prisma.
- `Client.workspaceFiles` añadido como relación inversa.
- `FileType.OTHER` añadido para aceptar archivos generales.
- `POST /api/workspace/[workspaceId]/files/upload` acepta `clientId` opcional.
- La route valida que el cliente pertenece al workspace antes de guardar el vínculo.
- La ficha del cliente muestra una sección `Archivos`.
- Desde esa sección se pueden subir archivos vinculados al cliente.

## Comportamiento

Al subir un archivo desde la ficha de cliente:

1. El archivo se guarda como `WorkspaceFile`.
2. Sigue perteneciendo al workspace y a Mi Office.
3. Además queda vinculado al cliente con `clientId`.
4. La ficha del cliente lo muestra como parte de su expediente.

## Tipos aceptados

- PDF
- DOCX
- XLSX
- JPG/JPEG
- PNG
- WEBP
- GIF
- TXT
- Markdown
- JSON
- ZIP
- Otros tipos como `OTHER` si llegan con MIME no mapeado

## Fuera de alcance

- Vincular archivos ya existentes de Mi Office a un cliente.
- Desvincular archivos desde la ficha del cliente.
- Borrado desde la ficha del cliente.
- Galería visual avanzada para imágenes.
- Permisos especiales por archivo.

## Próximo paso recomendado

CLIENT_FILES2 — Vincular archivos existentes de Mi Office a cliente.

Eso completa el circuito: subir desde cliente y también asociar documentos ya existentes.
