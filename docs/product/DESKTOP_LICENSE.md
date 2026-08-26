# DESKTOP_LICENSE — Token de licencia para la app de escritorio MITIKUS

Fecha: 2026-08-26

## Estado

Servidor implementado. Integración Rust pendiente.

## Propósito

Permite a la app Tauri verificar localmente si la suscripción está activa
sin depender de red en cada arranque. El token expira en 30 días; si caduca
y no hay red, la app muestra una pantalla de "reconéctate para continuar".

## Endpoint

```
POST /api/desktop/license-token
Authorization: Bearer <clerk-session-token>
Content-Type: application/json (sin body)
```

Respuesta exitosa (200):
```json
{
  "token": "<jwt>",
  "expiresInDays": 30,
  "tier": "PROFESSIONAL",
  "status": "ACTIVE"
}
```

Respuestas de error:
- `401` — no autenticado
- `403` — suscripción inactiva (EXPIRED/CANCELLED/BLOCKED)
- `503` — MITIKUS_LICENSE_SECRET no configurada

## Formato del token

JWT manual: `base64url(header).base64url(payload).HMAC-SHA256`

Header fijo: `{"alg":"HS256","typ":"JWT"}`

Payload:
```json
{
  "orgId":        "org_xxx",
  "tier":         "PROFESSIONAL",
  "status":       "ACTIVE",
  "tokenVersion": 3,
  "iat":          1724630400,
  "exp":          1727222400
}
```

## Variables de entorno requeridas

| Variable               | Descripción                                           |
|------------------------|-------------------------------------------------------|
| `MITIKUS_LICENSE_SECRET` | Secret para firmar tokens. Mínimo 16 chars, cualquier string aleatorio. |

Generar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Invalidación de tokens

Al cancelar o expirar una suscripción, el servidor incrementa `Subscription.tokenVersion`.
Un token con `tokenVersion` inferior al actual se rechaza con `reason: "version_mismatch"`.

Esto ocurre automáticamente vía webhook de Stripe en los eventos:
- `customer.subscription.updated` (status → canceled/unpaid)
- `customer.subscription.deleted`

## Integración Rust (pendiente)

El cliente Tauri debe:

### 1. Al arrancar
```rust
// Pseudocódigo — adaptar a tauri_plugin_store o fs::read
let token = load_token_from_local_store(); // clave: "mitikus_license_token"

match verify_token_locally(&token) {
    Ok(payload) if payload.seconds_remaining > 7 * 24 * 3600 => {
        // Token válido y fresco — arranque normal
    }
    Ok(_) => {
        // Válido pero caduca pronto — renovar en background
        spawn(renew_token());
        // Arranque normal mientras tanto
    }
    Err(reason) => {
        // expired, invalid_signature, version_mismatch
        if has_network() {
            renew_token().await;
        } else {
            show_offline_gate(); // pantalla "reconéctate para continuar"
        }
    }
}
```

### 2. Verificación local del JWT
```rust
fn verify_token_locally(token: &str) -> Result<Payload, Reason> {
    let parts: Vec<&str> = token.splitn(3, '.').collect();
    if parts.len() != 3 { return Err(Reason::Malformed); }

    let secret = env!("MITIKUS_LICENSE_SECRET"); // embebido en build o leído de keychain
    let expected_sig = hmac_sha256(secret, &format!("{}.{}", parts[0], parts[1]));
    if base64url_encode(expected_sig) != parts[2] { return Err(Reason::InvalidSignature); }

    let payload = base64url_decode_json::<Payload>(parts[1])?;
    if payload.exp < now_unix() { return Err(Reason::Expired); }
    // tokenVersion: el cliente no tiene la versión del servidor localmente,
    // así que esta comprobación solo ocurre al llamar al endpoint de renovación.
    Ok(payload)
}
```

### 3. Renovación
```rust
async fn renew_token() {
    let clerk_token = get_clerk_session_token(); // de la sesión activa del webview
    let resp = http_post(
        "https://mitikus.com/api/desktop/license-token",
        headers: [("Authorization", format!("Bearer {}", clerk_token))],
    ).await;

    if resp.status == 200 {
        let body: LicenseResponse = resp.json();
        save_token_to_local_store("mitikus_license_token", &body.token);
    } else if resp.status == 403 {
        show_subscription_expired_screen();
    }
}
```

### 4. Pantalla de bloqueo
Mostrar cuando el token ha expirado y no hay red (o el endpoint devuelve 403).
El webview puede apuntar a una ruta local `/offline` o mostrar una pantalla nativa.
La pantalla debe:
- Explicar que la suscripción necesita verificación.
- Ofrecer un botón "Reintentar" que llame a `renew_token()`.
- Mostrar un enlace a `https://mitikus.com/org` para gestionar la suscripción.

## Archivos del servidor

| Archivo | Propósito |
|---------|-----------|
| `src/lib/desktop/license-token.ts` | Emitir y verificar tokens JWT |
| `src/app/api/desktop/license-token/route.ts` | Endpoint POST |
| `src/lib/billing/subscription-service.ts` | `incrementTokenVersion()` |
| `prisma/schema.prisma` | `Subscription.tokenVersion Int @default(0)` |
