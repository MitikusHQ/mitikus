# PMF8-P3 — Mensaje de error accionable al enviar factura

**Fecha:** 2026-08-27  
**Estado:** Implementado ✅

## Problema

Cuando `sendInvoiceToClient` fallaba (SMTP no configurado o error de entrega), el modal mostraba el mensaje de error técnico sin orientar al usuario sobre qué hacer a continuación. El usuario quedaba bloqueado al final del flujo de activación sin saber cómo resolverlo.

## Fix

**Archivo:** `src/app/(dashboard)/workspace/[workspaceId]/invoices/_components/InvoicesClient.tsx`

### Cambio 1 — Error de Server Action (`emailError`)
El bloque `emailError` pasa de un `<p>` plano a un `<div>` con dos líneas:
1. El mensaje de error original (sin cambios, sigue siendo visible para diagnóstico).
2. Una línea nueva: "Revisa la configuración de correo en **Ajustes → Correo y envíos**." con enlace directo a `/workspace/[workspaceId]/settings` (abre en nueva pestaña).

### Cambio 2 — Error del bloque `catch` (errores inesperados/red)
Mensaje anterior: "No se ha podido preparar el email. Revisa la configuración y vuelve a intentarlo."  
Mensaje nuevo: "No se pudo enviar la factura. Comprueba que tienes correo configurado en Ajustes → Correo y envíos."

El texto del `catch` también muestra el mismo bloque con enlace, ya que usa el mismo estado `emailError`.

## Lo que NO cambia
- La lógica de `sendInvoiceToClient` — sin cambios en la Server Action.
- El estado de la factura — si el envío falla, la factura no cambia de estado.
- El flujo cuando el envío tiene éxito — sin cambios.
- Schema, dependencias, Stripe, Verifactu — sin tocar.
