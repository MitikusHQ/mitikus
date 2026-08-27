# MAIL1 — Cola propia de correo MITIKUS

Fecha: 2026-08-24

## Estado

Completado.

## Decisión

MITIKUS no debe pedir al usuario final que configure Resend ni otra plataforma
técnica para enviar facturas.

El usuario configura una identidad sencilla:

- Nombre visible del remitente.
- Email de respuesta.
- Firma o cierre por defecto.

MITIKUS conserva internamente la responsabilidad del motor de envío.

## Qué se implementó

### Modelo

Se añade `MailMessage` como cola propia de correo:

- `toEmail`
- `fromName`
- `replyTo`
- `subject`
- `body`
- `status`
- `provider`
- vínculo opcional con `Invoice`

La cola vive en MITIKUS PostgreSQL. No pertenece al Core.

### Ajustes

La sección de correo pasa a ser `Identidad de envío`.

Se elimina de la experiencia principal la elección Gmail/Outlook/Resend. Esos
conectores pueden existir en el futuro, pero no son el MVP.

### Facturas

El botón de envío prepara un registro en `MailMessage`.

No se marca la factura como `enviada` automáticamente porque todavía no hay
confirmación real de entrega.

## Fuera de alcance

- Worker real de envío.
- Conexión Gmail/Outlook.
- DKIM/SPF/DMARC por dominio del cliente.
- Envío certificado.
- Reintentos automáticos.

## Siguiente paso recomendado

MAIL2 — Mail Delivery Worker

Procesar `MailMessage.status = queued`, enviar el correo real con PDF adjunto y
actualizar:

- `status = sent` y `sentAt`
- o `status = failed` y `lastError`

Solo entonces una factura puede marcarse como enviada automáticamente.
