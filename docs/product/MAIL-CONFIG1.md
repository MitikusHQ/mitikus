# MAIL-CONFIG1 — Workspace Email Accounts

Fecha: 2026-08-27

## Objetivo

Permitir que cada workspace configure cómo salen sus correos desde MITIKUS sin depender de variables técnicas globales.

## Cambios

- La pantalla `Ajustes -> Correo y envíos` ofrece cuatro modos:
  - MITIKUS: envío gestionado por la infraestructura de MITIKUS.
  - SMTP propio: hosting, webmail o correo corporativo.
  - Gmail: preset con `smtp.gmail.com`, puerto 465 y TLS directo.
  - Outlook / Microsoft 365: preset con `smtp.office365.com`, puerto 587 y STARTTLS.
- Los modos Gmail y Outlook ya no son solo "próximamente"; funcionan como plantillas de configuración.
- Se añade "Probar conexión" para validar SMTP antes de guardar o enviar.
- Si la contraseña no se escribe de nuevo, la prueba reutiliza la contraseña cifrada ya guardada.
- Si SMTP e IMAP usan el mismo usuario, la contraseña SMTP también sirve para IMAP cuando el usuario no introduce una contraseña IMAP separada.
- "Probar conexión" valida SMTP y, si hay IMAP configurado, también valida acceso a `INBOX`.
- El envío real usa SMTP del workspace para `custom_smtp`, `gmail` y `outlook`.
- "Actualizar recibidos" usa IMAP del workspace cuando está configurado.
- La copia en carpeta "Enviados" usa IMAP del workspace cuando está configurado.

## Seguridad

- Las contraseñas se guardan cifradas con `MITIKUS_ENCRYPTION_KEY`.
- La UI nunca muestra contraseñas guardadas.
- La prueba de conexión valida credenciales contra SMTP e IMAP, pero no envía ningún correo.

## Límites actuales

- El envío, la importación de recibidos y la copia en "Enviados" quedan preparados por workspace.
- Si un workspace no tiene IMAP propio configurado, MITIKUS mantiene el fallback global existente.
- Gmail puede requerir contraseña de aplicación.
- Outlook/Microsoft 365 puede requerir SMTP AUTH activo.

## Verificación esperada

1. En Ajustes, seleccionar Gmail, Outlook o SMTP propio.
2. Rellenar usuario y contraseña.
3. Pulsar "Probar conexión".
4. Guardar correo.
5. Enviar una factura o correo desde MITIKUS.
6. Comprobar que aparece una copia en "Enviados" del buzón real.
7. Pulsar "Actualizar recibidos" y comprobar que importa los correos nuevos.
