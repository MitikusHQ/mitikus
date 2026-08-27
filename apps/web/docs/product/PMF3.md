# PMF3 + PMF4 — Funnel Dashboard Interno (Cohort Real)

**Fecha:** 2026-08-26  
**Estado:** Implementado ✅ (PMF4 — cohort por orgId integrado)

## Qué mide

Vista interna solo para superadmins que muestra el embudo de activación de MITIKUS usando los eventos `pmf.*` almacenados en `AuditLog`.

## Ruta

```
/admin/pmf-funnel
```

Protegida mediante `requireUser()` + check de `SUPERADMIN_EMAILS` (env var). Si el usuario no está en la lista, devuelve 404.

## Filtros disponibles

- Últimos 7 días (`?period=7d`)
- Últimos 30 días (`?period=30d`)
- Todo (`?period=all`, por defecto)

## Eventos usados

| Evento | Label |
|--------|-------|
| `pmf.workspace.created` | Workspace creado |
| `pmf.fiscal.completed` | Fiscal configurado |
| `pmf.client.created` | Cliente creado |
| `pmf.invoice.created` | Factura creada |
| `pmf.invoice.emitted` | Factura emitida |
| `pmf.invoice.sent` | Factura enviada |
| `pmf.invoice.pdf.downloaded` | PDF descargado |

## Pasos de conversión mostrados

- Workspace → Fiscal
- Fiscal → Cliente
- Cliente → Factura
- Factura → Emitida
- Emitida → Enviada
- Emitida → PDF

## Limitaciones del enfoque con AuditLog

1. **No hay cohort real:** los conteos son independientes por evento, no rastrean el mismo usuario a través del funnel. Un usuario puede tener 3 facturas y 1 workspace — el denominador y numerador son distintas personas.
2. **Sin retención temporal:** no se puede saber si un usuario tardó 1 día o 1 mes entre pasos.
3. **Sin segmentación avanzada:** solo se puede filtrar por periodo. No hay breakdown por plan, país o sector (el sector sí está en metadata de `pmf.workspace.created` pero no se agrupa aquí).
4. **Tabla reciente limitada a 50 filas:** para análisis mayor, consultar PostgreSQL directamente.

## Consulta SQL para análisis avanzado

```sql
-- Conteo por evento y día
SELECT action, DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS n
FROM "AuditLog"
WHERE action LIKE 'pmf.%'
GROUP BY action, day
ORDER BY day DESC, action;

-- Sector más común en workspaces creados
SELECT metadata->>'sector' AS sector, COUNT(*) AS n
FROM "AuditLog"
WHERE action = 'pmf.workspace.created'
  AND metadata->>'sector' IS NOT NULL
GROUP BY sector
ORDER BY n DESC;
```

## Próximos pasos recomendados (PMF4)

- Añadir cohort real: rastrear `actorUserId` o `orgId` a través de los pasos.
- Desglose por `sector` en la UI.
- Alertas si el funnel cae por debajo de un umbral (webhook → Slack o email).
