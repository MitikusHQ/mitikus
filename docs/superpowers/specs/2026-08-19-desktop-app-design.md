# MITIKUS Desktop App — Design Spec

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement the plan derived from this spec.

**Goal:** App de escritorio MITIKUS para Windows, descargable desde mitikus.com/download tras login. WebView nativa que carga mitikus.com con icono en bandeja, notificaciones del OS, actualizaciones automáticas e instalador con desinstalador.

**Tech Stack:** Tauri 2 (Rust), GitHub Actions (CI), Next.js 15 (página /download en mitikus.com existente).

---

## 1. Repositorio

Repositorio nuevo y separado: `mitikus-desktop` (no forma parte de `protools-hub`).

```
mitikus-desktop/
├── src-tauri/
│   ├── tauri.conf.json       # Config principal: URL, ventana, tray, updater
│   ├── Cargo.toml
│   ├── icons/                # Iconos en todos los tamaños requeridos por Tauri
│   └── src/
│       └── main.rs           # Tray, notificaciones, updater
├── .github/
│   └── workflows/
│       └── release.yml       # Compila y publica en GitHub Releases al crear tag v*
└── package.json              # Solo para invocar tauri CLI
```

No hay frontend propio. La WebView apunta directamente a `https://www.mitikus.com`.

---

## 2. WebView

- URL principal: `https://www.mitikus.com`
- Título de ventana: `MITIKUS`
- Tamaño inicial: 1280×800, mínimo 800×600
- Sin frame personalizado — usa el frame nativo del OS
- Cerrar ventana → minimiza a bandeja (no termina el proceso)

---

## 3. System Tray

- Icono MITIKUS siempre visible en la bandeja del sistema
- Tooltip: `MITIKUS`
- Menú contextual (clic derecho):
  - **Abrir MITIKUS** — muestra y enfoca la ventana
  - ─── separador ───
  - **Salir** — termina el proceso completamente
- Doble clic en el icono → muestra y enfoca la ventana

---

## 4. Notificaciones nativas

La web app se comunica con Tauri via `window.__TAURI__` (inyectado automáticamente por Tauri cuando la WebView carga mitikus.com).

**Puente JS → Tauri:**
- mitikus.com detecta si `window.__TAURI__` existe
- Si existe, en vez de mostrar notificaciones in-app llama a `@tauri-apps/api/notification` para mostrar notificaciones nativas del OS
- Eventos que generan notificación nativa:
  - Nueva tarea asignada al usuario
  - Contrato firmado por el cliente
  - Respuesta de Arkos completada

**Implementación en mitikus.com (apps/web):**
- Añadir helper `src/lib/desktop-bridge.ts` que detecta `window.__TAURI__` y expone `sendDesktopNotification(title, body)`
- Los componentes que hoy muestran notificaciones in-app llaman a este helper primero

---

## 5. Actualizaciones automáticas

- Tauri Updater comprueba al arrancar la app
- Endpoint: GitHub Releases API (`https://github.com/MitikusHQ/mitikus-desktop/releases/latest`)
- Si hay versión nueva:
  1. Notificación nativa: "Nueva versión de MITIKUS disponible"
  2. Descarga en segundo plano
  3. Al terminar: notificación "Actualización lista — reinicia MITIKUS para aplicarla"
  4. El usuario reinicia manualmente (no forzado)

---

## 6. Instalador Windows

- Generado automáticamente por Tauri (NSIS)
- Aparece en "Programas y características" con desinstalador
- Durante la instalación ofrece (opcionales): acceso directo en escritorio, entrada en menú inicio
- Sin firma de código en MVP (SmartScreen mostrará alerta — aceptable para acceso anticipado)

---

## 7. CI/CD — GitHub Actions

**Trigger:** push de tag `v*` (ej. `v1.0.0`) al repo `mitikus-desktop`

**Workflow `release.yml`:**
1. Checkout del repo
2. Instalar Rust (stable) y Node.js 20
3. `npm install` para tauri CLI
4. `npm run tauri build` — genera `.exe` NSIS en `src-tauri/target/release/bundle/nsis/`
5. Crear GitHub Release con el `.exe` como asset

**Resultado:** cada tag genera automáticamente una release descargable en `github.com/MitikusHQ/mitikus-desktop/releases`.

---

## 8. Página /download en mitikus.com

**Ruta:** `/download` (protegida — requiere login via middleware Clerk existente)

**Contenido:**
- Detecta OS con `navigator.userAgent`
- Si Windows: botón principal "Descargar para Windows (.exe)" → enlace directo a la última release de GitHub
- Si otro OS: mensaje "Versión para Mac disponible próximamente"
- Enlace secundario "Ver todas las versiones" → GitHub Releases page
- Instrucciones breves: "Al instalar, Windows puede mostrar una alerta de seguridad — haz clic en 'Más información' → 'Ejecutar de todas formas'"

**Implementación:**
- Server component que llama a GitHub API para obtener la URL del último `.exe`
- Fallback a URL hardcodeada si la API falla
- Sin autenticación especial con GitHub — releases públicas

---

## 9. Fuera de scope (v1)

- App para Mac — pendiente hasta validar adopción en Windows
- Firma de código (EV certificate Windows, Apple Developer) — v2
- Token offline / acceso sin conexión — v2
- Modo quiosco o restricción de URLs — no necesario
- Integración con MITIKUS AI offline — v3

---

## 10. Orden de implementación

1. **Repo `mitikus-desktop`** — estructura base, `tauri.conf.json`, WebView apuntando a mitikus.com
2. **System tray** — icono, menú, comportamiento al cerrar ventana
3. **Actualizaciones automáticas** — Tauri Updater configurado
4. **GitHub Actions** — release.yml que compila y publica
5. **Página `/download`** en mitikus.com — server component con GitHub API
6. **Puente de notificaciones** — `desktop-bridge.ts` en mitikus.com + integración en componentes existentes
