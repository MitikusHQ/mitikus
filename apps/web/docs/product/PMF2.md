# PMF2 — Analytics de Conversión Mínimos

**Fecha:** 2026-08-26  
**Estado:** Implementado ✅

## Objetivo

Medir el embudo de activación de MITIKUS sin instalar ninguna plataforma externa. Los eventos se registran en `AuditLog` (Prisma, PostgreSQL), que ya existe y es fire-and-forget.

## Embudo de activación

```
workspace creado → fiscal configurado → cliente creado → factura creada → PDF descargado / enviada
```

## Eventos implementados

| Evento | `action` en AuditLog | Dónde se dispara |
|--------|----------------------|------------------|
| Workspace creado | `pmf.workspace.created` | `createWorkspaceWithProfile` |
| Fiscal completado | `pmf.fiscal.completed` | `updateBillingProfile` (cuando fiscalName + nif presentes) |
| Cliente creado | `pmf.client.created` | `createClient` |
| Factura creada | `pmf.invoice.created` | `createInvoice` |
| Factura emitida | `pmf.invoice.emitted` | `emitirFactura` |
| Factura enviada | `pmf.invoice.sent` | `sendInvoiceToClient` |
| PDF descargado | `pmf.invoice.pdf.downloaded` | `GET /api/workspace/[id]/invoices/[id]/pdf` |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/audit.ts` | Extendido `AuditAction` y `AuditEntityType` con tipos PMF |
| `src/lib/pmf-analytics.ts` | **NUEVO** — 7 funciones fire-and-forget |
| `src/app/actions/workspace.ts` | `trackWorkspaceCreated` |
| `src/app/actions/fiscal.ts` | `trackFiscalCompleted` |
| `src/app/actions/client.ts` | `trackClientCreated` |
| `src/app/actions/invoices.ts` | `trackInvoiceCreated`, `trackInvoiceEmitted`, `trackInvoiceSent` |
| `src/app/api/workspace/[workspaceId]/invoices/[invoiceId]/pdf/route.ts` | `trackInvoicePdfDownloaded` |
| `src/app/(dashboard)/workspace/[workspaceId]/audit/_components/AuditEntityBadge.tsx` | Labels para `workspace`, `client`, `invoice` |

## Consulta SQL para analizar el funnel

```sql
SELECT action, COUNT(*) AS total, DATE_TRUNC('day', "createdAt") AS day
FROM "AuditLog"
WHERE action LIKE 'pmf.%'
GROUP BY action, day
ORDER BY day DESC, action;
```

## Restricciones de privacidad

- No se almacena NIF, IBAN, email de cliente, ni direcciones fiscales en metadata.
- Metadata limitada a: IDs, tipo de entidad, importe total (ya público en la factura), moneda, sector.
- Ningún evento bloquea la operación principal si falla.

## Próximos pasos (PMF3)

- Comparar cohorts de usuarios que completan el funnel vs. los que abandonan tras crear workspace.
- Añadir segmentación por `sector` (ya está en `pmf.workspace.created`).
