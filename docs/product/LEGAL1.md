# LEGAL1 — Verifactu Readiness & Facturación Segura

**Fecha:** 2026-08-26  
**Autor:** Implementación MITIKUS (LEGAL1 sprint)  
**Estado:** Preparación técnica completada — NO es cumplimiento Verifactu completo

---

## 1. Resumen ejecutivo

MITIKUS genera facturas electrónicas para autónomos y pymes en España. El RD 1007/2023 (Reglamento Verifactu) impone obligaciones técnicas a los **productores y comercializadores de software de facturación**. Este documento describe el estado actual, lo implementado en el sprint LEGAL1, y lo que falta para cumplimiento completo.

**Aclaración crítica de fechas (actualizada 2026-08-26):**
- La memoria interna anterior indicaba "enero 2026" como deadline. Esto es incorrecto.
- El RD 1007/2023 apunta a:
  - **1 enero 2027** para contribuyentes del Impuesto sobre Sociedades
  - **1 julio 2027** para el resto de obligados tributarios
- MITIKUS, como productor de software de facturación, debe cumplir **antes de que sus clientes estén obligados**.
- Verificar siempre en BOE/AEAT las fechas definitivas — pueden sufrir retrasos (como ocurrió en 2025).

---

## 2. Estado anterior al sprint LEGAL1

| Elemento | Estado previo |
|---|---|
| Campos Verifactu en schema (huella, qrUrl, serie, tipoFactura…) | ✅ Implementados |
| `calcularHuella()` SHA-256 con orden de campos AEAT | ✅ Implementado |
| `generarURLVerificacion()` URL AEAT con huella truncada | ✅ Implementado |
| `formatFechaAEAT()` / `formatTimestampAEAT()` con zona horaria España | ✅ Implementado |
| `emitirFactura()` — encadenamiento hash + persistencia antes del PDF | ✅ Implementado |
| Guard doble emisión (`if (factura.huella) throw`) | ✅ Implementado |
| **Guard edición de facturas emitidas** | ❌ Ausente |
| **Guard eliminación de facturas emitidas** | ❌ Ausente |
| **UI que avisa de inmutabilidad** | ❌ Ausente |
| **QR en PDF** | ❌ Ausente |
| **Sección de trazabilidad en PDF** | ❌ Ausente |

---

## 3. Implementado en el sprint LEGAL1

### 3.1 Inmutabilidad de facturas emitidas (server-side)

**Archivo:** `apps/web/src/app/actions/invoices.ts`

- `updateInvoice()`: si el estado de la factura es `enviada`, `pagada`, `vencida` o `cancelada`, solo se permiten cambios de estado (ej: `enviada → pagada`). Cualquier cambio de contenido fiscal (items, importes, fechas, cliente) lanza error 400 con mensaje claro.
- `deleteInvoice()`: bloquea el borrado de facturas en estado inmutable. Las facturas emitidas forman parte del registro fiscal y no pueden eliminarse.

**Por qué es importante:** Sin estos guards, un usuario podría editar los importes de una factura ya emitida y enviada al cliente, invalidando la cadena de hashes y generando discordancia entre el PDF entregado y el registro interno.

### 3.2 UI — Modo solo lectura para facturas emitidas

**Archivos:** `InvoiceModal.tsx`, `InvoicesClient.tsx`

- `InvoiceModal`: muestra banner de aviso `⚠️ Esta factura ya fue emitida...` si el estado es inmutable. Oculta el botón "Guardar cambios".
- `InvoicesClient`: el botón "Editar" pasa a llamarse "Ver detalle" para facturas emitidas. El botón "Eliminar" se oculta.

### 3.3 QR y trazabilidad en PDF

**Archivo:** `apps/web/src/app/api/workspace/[workspaceId]/invoices/[invoiceId]/pdf/route.ts`

- Se instala `qrcode` (npm) para generar el QR como SVG inline.
- Si la factura tiene `huella` y `qrUrl` calculadas (facturas emitidas), el PDF incluye:
  - **QR visual** con la URL de verificación AEAT
  - **Huella SHA-256 completa**
  - **Huella anterior** (o "Primera factura de la serie")
  - **Fecha y hora de generación** (zona horaria Europa/Madrid)
  - **Aviso de pendiente de remisión AEAT** (texto honesto, no afirma verificación AEAT)
  - Si `enviadaAEAT = true`, muestra "✓ Enviada a AEAT"

**Importante:** El PDF NO afirma "verificable en AEAT" salvo que `enviadaAEAT` sea `true`. El mensaje es "Pendiente de remisión a AEAT — fase preparatoria Verifactu".

---

## 4. Garantías que existen ahora

- ✅ Una factura emitida no puede modificarse (contenido fiscal)
- ✅ Una factura emitida no puede eliminarse
- ✅ La cadena de hashes SHA-256 es estable y auditables internamente
- ✅ El QR apunta a la URL de verificación AEAT correcta (según spec RD 1007/2023)
- ✅ El PDF deja constancia visible de la trazabilidad sin afirmar más de lo que hay
- ✅ El algoritmo de hash respeta el orden de campos mandatorio (spec AEAT)
- ✅ La zona horaria España (CET/CEST) se aplica correctamente en `FechaHoraHusoGenRegistro`

---

## 5. Qué falta para cumplimiento Verifactu completo

| Requisito | Estado | Notas |
|---|---|---|
| Hash SHA-256 encadenado | ✅ Implementado | |
| QR con URL AEAT en PDF | ✅ Implementado | |
| Campos mínimos AEAT en el hash | ✅ Implementados | NIF emisor, numSerie, fecha, tipo, cuotaIVA, total |
| Sistema de huella encadenada (`huellaAnterior`) | ✅ Implementado | |
| Inmutabilidad de registros emitidos | ✅ Implementado (LEGAL1) | |
| **Remisión en tiempo real a AEAT** | ❌ No implementado | Requiere certificado digital del emisor + webservice AEAT |
| **Facturas rectificativas (tipos R1-R5)** | ❌ No implementado | Solo hay `tipoFactura` en schema, sin flujo completo |
| **Alta en SIF (Sistema de Información de Facturación)** | ❌ No implementado | Gestión de certificados digitales por cliente |
| **Registro `respuestaAEAT`** | ❌ Pendiente de uso | El campo existe en schema pero no se usa |
| **Numeración correlativa garantizada** | ⚠️ Parcial | `getNextInvoiceNumber()` puede tener race conditions bajo concurrencia |
| **Validación de NIF emisor** | ⚠️ Parcial | El NIF se pasa en runtime pero no se valida formato (ES+8dígitos+letra) |
| **Especificación técnica AEAT definitiva** | ⚠️ Pendiente | AEAT puede publicar modificaciones antes de enero 2027 |

---

## 6. Lo que NO debe afirmarse comercialmente todavía

- ❌ "MITIKUS cumple Verifactu" — falso, falta remisión AEAT y certificados
- ❌ "Tus facturas son verificables en AEAT" — solo lo será cuando se implemente la remisión real
- ❌ "Software homologado Verifactu" — no existe proceso de homologación; sí de auto-declaración, pero requiere pasos adicionales
- ✅ SÍ se puede decir: "MITIKUS prepara la base técnica para Verifactu — hashes encadenados, QR y registro de trazabilidad incluidos"
- ✅ SÍ se puede decir: "En proceso de adaptación a RD 1007/2023"

---

## 7. Checklist de validación con asesor fiscal/legal

Antes de activar la emisión de facturas para clientes reales, revisar con un asesor:

- [ ] ¿El formato del número de factura (`YYYY-NNN`) cumple los requisitos AEAT para el tipo de cliente (autónomo/empresa)?
- [ ] ¿El campo `legalNote` cubre los casos de exención IVA (art. 20 LIVA) y operaciones con inversión del sujeto pasivo?
- [ ] ¿Los tipos de factura F1/F2/R1-R5 están correctamente documentados para los usuarios?
- [ ] ¿El modelo de conservación de facturas (base de datos Railway) cumple los 4 años de conservación obligatoria?
- [ ] ¿Se contemplan facturas simplificadas (ticket) para los clientes que las necesiten?
- [ ] ¿El flujo de cancelación genera factura rectificativa o solo marca como cancelada?
- [ ] ¿La zona horaria del servidor de producción (Vercel) está configurada para Europa/Madrid o UTC?

---

## 8. Próximos tickets recomendados

### LEGAL2 — Factura rectificativa (R1-R5)
Implementar el flujo completo de facturas rectificativas: crear nueva factura con `tipoFactura: 'R1'`, referencia a la factura original, motivo de rectificación, y encadenamiento en la cadena de hashes. Bloquear emisión de rectificativas sobre borradores.

### LEGAL3 — Validación de NIF emisor
Validar formato NIF/CIF español en `emitirFactura()` antes de calcular el hash. Un hash con NIF inválido no tiene valor ante AEAT.

### LEGAL4 — Remisión a AEAT (fase final)
Implementar el webservice de remisión a AEAT. Requiere: (a) certificado digital del emisor, (b) parsing de la respuesta AEAT, (c) persistencia en `respuestaAEAT`, (d) actualización de `enviadaAEAT`. No abordar hasta que AEAT publique la especificación técnica definitiva y el entorno de pruebas (previsiblemente mid-2026).

### ARCH1 — Numeración correlativa con lock de base de datos
`getNextInvoiceNumber()` usa `count()` + `padStart`, lo que puede generar duplicados bajo concurrencia. Implementar con `SELECT FOR UPDATE` o un sequence de Prisma para garantizar unicidad.

---

## 9. No tocar sin revisión legal

- El algoritmo `calcularHuella()` no debe modificarse sin contrastar con la spec AEAT vigente. Cualquier cambio en el orden de campos invalida toda la cadena histórica.
- El campo `huellaAnterior` debe apuntar siempre a la última factura emitida del mismo workspace (mismo NIF emisor). Si cambia la lógica de búsqueda, revisar la validez del encadenamiento.
