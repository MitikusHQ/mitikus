# MAIL2 — Correo y envíos de MITIKUS

Fecha inicial: 2026-08-24 · Última actualización: 2026-08-26

## Estado

Implementado (v2: proveedor por workspace).

## Proveedores disponibles por workspace

| Modo | Valor BD | Estado |
|------|----------|--------|
| MITIKUS (gestionado) | `mitikus` | ✅ Activo |
| SMTP propio | `custom_smtp` | ✅ Activo |
| Gmail | `gmail` | 🔜 Próximamente |
| Outlook / Microsoft 365 | `outlook` | 🔜 Próximamente |

Gmail y Outlook requerirán OAuth seguro antes de activarse. No se implementarán con credenciales de usuario directo.

## Decisión

Cada workspace elige independientemente cómo salen sus correos. La selección se guarda en `CompanyProfile.emailSendMode`. La entrega en `delivery.ts` inspecciona ese campo y enruta hacia el cliente correspondiente.

## Qué se implementó

### Cliente SMTP

Archivo: `apps/web/src/lib/mail/smtp-client.ts`

Usa módulos nativos de Node (`net` y `tls`) y no añade dependencias npm.

Variables de entorno:

- `MITIKUS_SMTP_HOST`
- `MITIKUS_SMTP_PORT` — por defecto `587`
- `MITIKUS_SMTP_SECURE` — `true` para TLS directo, vacío/false para STARTTLS
- `MITIKUS_SMTP_USER` — opcional si el servidor lo requiere
- `MITIKUS_SMTP_PASS` — opcional si el servidor lo requiere
- `MITIKUS_SMTP_FROM_EMAIL` — email técnico autorizado para enviar

El campo `Reply-To` usa el email configurado por el usuario en Ajustes.

### Delivery

Archivo: `apps/web/src/lib/mail/delivery.ts`

Procesa `MailMessage` con estados:

- `queued`
- `sending`
- `sent`
- `failed`

Al enviar correctamente:

- `MailMessage.status = sent`
- `MailMessage.sentAt = now`
- factura vinculada pasa a `enviada` salvo que ya esté `pagada` o `cancelada`

Si falla:

- `MailMessage.status = failed`
- `MailMessage.lastError = mensaje legible`
- la factura no se marca como enviada

### Facturas

`sendInvoiceToClient` ahora crea el mensaje y llama al motor de envío. Si SMTP no
está configurado, la factura queda preparada pero el usuario recibe un error claro.

### Procesador manual

Script:

```bash
npm run mail:process
```

Opcional:

```bash
npm run mail:process -- --limit=20
```

Procesa los mensajes `queued` por orden de creación.

## Cifrado de contraseñas

Las contraseñas SMTP/IMAP **nunca se almacenan en texto plano**. Se cifran con AES-256-GCM
antes de persitirse en `CompanyProfile.smtpPasswordEncrypted` / `imapPasswordEncrypted`.

Módulo: `apps/web/src/lib/crypto.ts`

Variable de entorno requerida: `MITIKUS_ENCRYPTION_KEY` — 32 bytes en hex (64 caracteres).
Generar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Las contraseñas nunca se devuelven al cliente. El campo en el formulario arranca vacío;
dejarlo vacío en una edición posterior **no sobreescribe** la contraseña guardada.

## Firma por defecto en Compose

La firma configurada en Ajustes del workspace se pre-rellena en el textarea del formulario
de redacción. Se añade con `\n\n` de separación antes del cuerpo del mensaje.

## Enrutamiento por workspace

`delivery.ts` comprueba `CompanyProfile.emailSendMode`:

- `custom_smtp` + credenciales SMTP presentes → `sendSmtpMailWithConfig` con las credenciales
  descifradas del workspace.
- Resto → `sendSmtpMail` con las variables de entorno globales de MITIKUS.

## Campos de schema añadidos (aditivos, no rompen datos existentes)

En `CompanyProfile`:
```
emailSendMode         String   @default("mitikus")
smtpHost              String?
smtpPort              Int?
smtpSecure            Boolean  @default(false)
smtpUser              String?
smtpPasswordEncrypted String?
imapHost              String?
imapPort              Int?
imapSecure            Boolean  @default(false)
imapUser              String?
imapPasswordEncrypted String?
gmailConnectedAt      DateTime?
outlookConnectedAt    DateTime?
```

## Fuera de alcance

- DKIM/SPF/DMARC por dominio de cada cliente.
- OAuth para Gmail/Outlook (Próximamente — no implementar sin OAuth completo).
- Panel de cola de correo.
- Reintentos automáticos programados.

## Brecha residual

El motor de envío ya existe, pero la factura adjunta requiere separar la generación
del documento en una utilidad reutilizable por la ruta de descarga y por el worker.

Siguiente paso recomendado: MAIL3 — Invoice PDF Attachment for Mail Queue.
