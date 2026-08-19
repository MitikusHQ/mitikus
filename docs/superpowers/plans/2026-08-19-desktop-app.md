# MITIKUS Desktop App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App de escritorio MITIKUS para Windows que carga mitikus.com en WebView nativa, con bandeja del sistema, notificaciones nativas, actualizaciones automáticas, e instalador NSIS descargable desde /download.

**Architecture:** Repositorio separado `mitikus-desktop` (Tauri 2 + Rust). Sin frontend propio — la WebView apunta directamente a `https://www.mitikus.com`. El puente JS↔Tauri lo provee automáticamente Tauri via `window.__TAURI__`. Las tareas 5 y 6 tocan el repo `protools-hub` existente.

**Tech Stack:** Tauri 2, Rust (stable), Node.js 20, GitHub Actions, Next.js 15 (apps/web en protools-hub)

---

## File Map

**Repo nuevo `mitikus-desktop/`:**
- `src-tauri/tauri.conf.json` — config principal: URL, ventana, tray, updater, bundle NSIS
- `src-tauri/Cargo.toml` — dependencias Rust: tauri 2, tauri-plugin-updater, tauri-plugin-notification
- `src-tauri/src/main.rs` — entry point Rust (solo llama lib)
- `src-tauri/src/lib.rs` — tray, menú, evento close-to-tray, updater al arrancar
- `src-tauri/icons/` — iconos en todos los tamaños (usar tauri-cli generate para generar desde PNG base)
- `src-tauri/capabilities/default.json` — permisos Tauri 2 (notification, updater)
- `package.json` — script `tauri` que llama a @tauri-apps/cli
- `.github/workflows/release.yml` — CI: push tag v* → build .exe → GitHub Release

**Repo `protools-hub/apps/web/`:**
- `src/lib/desktop-bridge.ts` — helper: detecta `window.__TAURI__`, expone `sendDesktopNotification(title, body)`
- `src/app/download/page.tsx` — server component: GitHub API → URL .exe → botón descarga
- `src/app/download/layout.tsx` — layout mínimo sin sidebar (página pública tras login)

---

## Task 1: Repo base + WebView

**Repo:** `mitikus-desktop/` (crear en `C:\Users\priet\mitikus-desktop\`)

**Files:**
- Create: `package.json`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`

- [ ] **Step 1: Crear el directorio e inicializar git**

```bash
mkdir C:\Users\priet\mitikus-desktop
cd C:\Users\priet\mitikus-desktop
git init
```

- [ ] **Step 2: Crear `package.json`**

```json
{
  "name": "mitikus-desktop",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "tauri": "tauri"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

- [ ] **Step 3: Instalar dependencias**

```bash
npm install
```

- [ ] **Step 4: Crear `src-tauri/tauri.conf.json`**

```json
{
  "productName": "MITIKUS",
  "version": "1.0.0",
  "identifier": "com.mitikus.desktop",
  "build": {
    "beforeDevCommand": "",
    "beforeBuildCommand": "",
    "frontendDist": "../dist-placeholder"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "label": "main",
        "title": "MITIKUS",
        "url": "https://www.mitikus.com",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "closable": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "nsis": {
        "displayLanguageSelector": false,
        "languages": ["SpadishSpain"],
        "installMode": "perMachine"
      }
    }
  }
}
```

- [ ] **Step 5: Crear `src-tauri/Cargo.toml`**

```toml
[package]
name = "mitikus-desktop"
version = "1.0.0"
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "mitikus_desktop_lib"
crate-type = ["lib", "cdylib", "staticlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-updater = "2"
tauri-plugin-notification = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 6: Crear `src-tauri/src/main.rs`**

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mitikus_desktop_lib::run();
}
```

- [ ] **Step 7: Crear `src-tauri/src/lib.rs` — solo WebView por ahora**

```rust
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.show().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MITIKUS");
}
```

- [ ] **Step 8: Crear directorio placeholder y build-script**

```bash
mkdir src-tauri\icons
mkdir dist-placeholder
echo. > dist-placeholder\index.html
```

Añadir `src-tauri/build.rs`:
```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 9: Generar iconos base**

Necesitas un PNG de 1024x1024 en `src-tauri/icons/app-icon.png`. Con el CLI de Tauri:

```bash
npx tauri icon src-tauri/icons/app-icon.png
```

Si no tienes el PNG todavía, crea un placeholder temporal:

```bash
# PowerShell — crea un PNG blanco de 1024x1024 como placeholder
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(1024,1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255,99,102,241))  # indigo
$bmp.Save("src-tauri\icons\app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
# Luego generar todos los tamaños:
npx tauri icon src-tauri/icons/app-icon.png
```

- [ ] **Step 10: Crear `src-tauri/capabilities/default.json`**

```bash
mkdir src-tauri\capabilities
```

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "notification:default",
    "updater:default"
  ]
}
```

- [ ] **Step 11: Verificar que compila en dev**

```bash
npx tauri dev
```

Expected: se abre ventana con https://www.mitikus.com cargando. Puede ser lento la primera vez (descarga Rust deps).

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: init mitikus-desktop Tauri 2 with WebView to mitikus.com"
```

---

## Task 2: System Tray

**Files:**
- Modify: `src-tauri/tauri.conf.json` — añadir tray config
- Modify: `src-tauri/src/lib.rs` — añadir tray icon, menú, close-to-tray

- [ ] **Step 1: Añadir el icono de tray en `tauri.conf.json`**

En la sección `"app"`, añadir:
```json
"app": {
  "withGlobalTauri": true,
  "trayIcon": {
    "id": "main",
    "iconPath": "icons/32x32.png",
    "tooltip": "MITIKUS",
    "iconAsTemplate": false
  },
  "windows": [...]
}
```

- [ ] **Step 2: Reemplazar `src-tauri/src/lib.rs` con tray completo**

```rust
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Menú del tray
            let open_item = MenuItem::with_id(app, "open", "Abrir MITIKUS", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &separator, &quit_item])?;

            // Icono en bandeja
            let _tray = TrayIconBuilder::new()
                .icon(Image::from_path("icons/32x32.png")?)
                .tooltip("MITIKUS")
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(w) = handle.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Cerrar ventana → minimizar a bandeja (no salir)
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running MITIKUS");
}
```

- [ ] **Step 3: Probar tray en dev**

```bash
npx tauri dev
```

Expected:
- Icono MITIKUS en la bandeja del sistema
- Clic derecho → menú con "Abrir MITIKUS" y "Salir"
- Al cerrar la ventana con la X → ventana desaparece, proceso continúa (icono en tray)
- Doble clic en tray (o "Abrir MITIKUS") → ventana reaparece

- [ ] **Step 4: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/src/lib.rs
git commit -m "feat: add system tray with show/quit menu and close-to-tray behavior"
```

---

## Task 3: Actualizaciones automáticas (Tauri Updater)

**Files:**
- Modify: `src-tauri/tauri.conf.json` — añadir updater endpoint
- Modify: `src-tauri/src/lib.rs` — inicializar plugin updater, comprobar al arrancar

- [ ] **Step 1: Añadir updater config en `tauri.conf.json`**

Dentro del objeto raíz, añadir:
```json
"plugins": {
  "updater": {
    "pubkey": "",
    "endpoints": [
      "https://github.com/MitikusHQ/mitikus-desktop/releases/latest/download/latest.json"
    ],
    "dialog": false,
    "windows": {
      "installMode": "passive"
    }
  }
}
```

Nota: `pubkey` se rellena con la clave pública generada en Task 4 (GitHub Actions). Por ahora vacía.

- [ ] **Step 2: Actualizar `src-tauri/src/lib.rs` — añadir updater al arrancar**

Sustituir el bloque `.setup(|app| {` por este (el resto del código no cambia):

```rust
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent,
};
use tauri_plugin_notification::NotificationExt;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Menú del tray
            let open_item = MenuItem::with_id(app, "open", "Abrir MITIKUS", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &separator, &quit_item])?;

            // Icono en bandeja
            let tray_handle = handle.clone();
            let _tray = TrayIconBuilder::new()
                .icon(Image::from_path("icons/32x32.png")?)
                .tooltip("MITIKUS")
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(w) = tray_handle.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Comprobar actualizaciones al arrancar (en segundo plano)
            let update_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                check_for_updates(update_handle).await;
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running MITIKUS");
}

async fn check_for_updates(app: tauri::AppHandle) {
    use tauri_plugin_updater::UpdaterExt;

    let Ok(Some(update)) = app.updater().check().await else {
        return;
    };

    // Notificación: nueva versión disponible
    let _ = app
        .notification()
        .builder()
        .title("Nueva versión de MITIKUS disponible")
        .body(&format!("Versión {} lista para descargar", update.version))
        .show();

    // Descargar en segundo plano
    let Ok(()) = update.download_and_install(|_chunk, _total| {}, || {}).await else {
        return;
    };

    // Notificación: lista para reiniciar
    let _ = app
        .notification()
        .builder()
        .title("Actualización lista")
        .body("Reinicia MITIKUS para aplicar la nueva versión")
        .show();
}
```

- [ ] **Step 3: Verificar que compila**

```bash
npx tauri dev
```

Expected: arranca sin errores. El updater falla silenciosamente en dev porque no hay endpoint real — es correcto.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/src/lib.rs
git commit -m "feat: add auto-updater checking GitHub Releases on startup"
```

---

## Task 4: GitHub Actions — release.yml

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Crear `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache Rust
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'MITIKUS ${{ github.ref_name }}'
          releaseBody: 'Descarga e instala MITIKUS para Windows.'
          releaseDraft: false
          prerelease: false
          includeUpdaterJson: true
```

- [ ] **Step 2: Generar el par de claves para el updater**

Ejecutar en cualquier terminal con el CLI de Tauri:

```bash
npx tauri signer generate -w ~/.tauri/mitikus.key
```

Guarda las claves:
- `~/.tauri/mitikus.key` → es la **clave privada** (secreto, no commitear)
- La clave pública se imprime en pantalla — copiarla para el Step 3

- [ ] **Step 3: Configurar secretos en GitHub**

En `github.com/MitikusHQ/mitikus-desktop/settings/secrets/actions`, añadir:
- `TAURI_SIGNING_PRIVATE_KEY` → contenido del archivo `~/.tauri/mitikus.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` → contraseña elegida al generar (o vacío si no se puso)

- [ ] **Step 4: Añadir la clave pública en `tauri.conf.json`**

En `plugins.updater.pubkey`, pegar la clave pública que imprimió el Step 2:
```json
"updater": {
  "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6...",
  ...
}
```

- [ ] **Step 5: Commit y push inicial**

```bash
git add .github/workflows/release.yml src-tauri/tauri.conf.json
git commit -m "feat: add GitHub Actions release workflow with Tauri signing"
git remote add origin https://github.com/MitikusHQ/mitikus-desktop.git
git push -u origin main
```

- [ ] **Step 6: Crear y push del primer tag para probar CI**

```bash
git tag v1.0.0
git push origin v1.0.0
```

Expected: en GitHub Actions se dispara el workflow. Tarda ~15-20 min. Al terminar, aparece una Release con el `.exe` NSIS y un `latest.json` (para el updater).

---

## Task 5: Página /download en mitikus.com

**Repo:** `protools-hub/`

**Files:**
- Create: `apps/web/src/app/download/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/app/download/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

const GITHUB_RELEASES_URL =
  'https://api.github.com/repos/MitikusHQ/mitikus-desktop/releases/latest'
const FALLBACK_EXE_URL =
  'https://github.com/MitikusHQ/mitikus-desktop/releases/latest/download/MITIKUS_x64-setup.exe'

async function getLatestExeUrl(): Promise<string> {
  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return FALLBACK_EXE_URL
    const data = (await res.json()) as {
      assets: Array<{ name: string; browser_download_url: string }>
    }
    const exe = data.assets.find((a) => a.name.endsWith('.exe'))
    return exe?.browser_download_url ?? FALLBACK_EXE_URL
  } catch {
    return FALLBACK_EXE_URL
  }
}

export default async function DownloadPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const exeUrl = await getLatestExeUrl()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">MITIKUS para escritorio</h1>
          <p className="text-muted-foreground">
            Accede a tu workspace desde la barra de tareas de Windows.
          </p>
        </div>

        <WindowsDownload exeUrl={exeUrl} />

        <OtherOS />

        <div className="text-xs text-muted-foreground space-y-1 text-left bg-muted/50 rounded-lg p-4">
          <p className="font-medium">Nota de seguridad</p>
          <p>
            Al instalar, Windows puede mostrar una alerta de seguridad porque el instalador
            no está firmado con certificado EV. Haz clic en{' '}
            <strong>«Más información»</strong> → <strong>«Ejecutar de todas formas»</strong>{' '}
            para continuar. Esta alerta es normal en la versión de acceso anticipado.
          </p>
        </div>

        <a
          href="https://github.com/MitikusHQ/mitikus-desktop/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todas las versiones →
        </a>
      </div>
    </main>
  )
}

function WindowsDownload({ exeUrl }: { exeUrl: string }) {
  return (
    <div className="space-y-3">
      <a
        href={exeUrl}
        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 88 88"
          className="w-6 h-6"
          fill="currentColor"
        >
          <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349-.011 41.344-47.318-6.678-.066-34.78z" />
        </svg>
        Descargar para Windows (.exe)
      </a>
      <p className="text-sm text-muted-foreground">Versión de acceso anticipado · Windows 10/11</p>
    </div>
  )
}

function OtherOS() {
  return (
    <div className="rounded-xl border border-dashed p-6 text-muted-foreground space-y-1">
      <p className="font-medium text-foreground">¿Mac o Linux?</p>
      <p className="text-sm">
        La versión para Mac estará disponible próximamente. Mientras tanto, accede a MITIKUS
        desde tu navegador en{' '}
        <a
          href="https://www.mitikus.com"
          className="underline hover:text-foreground transition-colors"
        >
          mitikus.com
        </a>
        .
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que la ruta está accesible**

La página usa el middleware Clerk existente (`middleware.ts` en apps/web) que ya protege todas las rutas excepto `/sign-in`. No hace falta tocar el middleware.

Arrancar el servidor local:
```bash
cd C:\Users\priet\protools-hub
npx turbo dev --filter=web
```

Navegar a `http://localhost:3000/download`. Expected: si no hay sesión → redirige a sign-in. Con sesión → muestra la página de descarga.

- [ ] **Step 3: Commit y deploy**

```bash
cd C:\Users\priet\protools-hub
git add apps/web/src/app/download/page.tsx
git commit -m "feat: add /download page with GitHub Releases API for Windows .exe"
npx vercel --prod
```

---

## Task 6: Puente de notificaciones (desktop-bridge.ts)

**Repo:** `protools-hub/`

**Files:**
- Create: `apps/web/src/lib/desktop-bridge.ts`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/NotificationBell.tsx`

- [ ] **Step 1: Crear `apps/web/src/lib/desktop-bridge.ts`**

```typescript
declare global {
  interface Window {
    __TAURI__?: {
      notification?: {
        sendNotification: (options: { title: string; body?: string }) => Promise<void>
      }
    }
  }
}

/**
 * Detecta si la app corre dentro de Tauri y envía una notificación nativa.
 * Si no está en Tauri, no hace nada (las notificaciones in-app siguen activas).
 * Retorna true si se envió la notificación nativa, false si no.
 */
export async function sendDesktopNotification(title: string, body?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!window.__TAURI__?.notification?.sendNotification) return false

  try {
    await window.__TAURI__.notification.sendNotification({ title, body })
    return true
  } catch {
    return false
  }
}

/** True si la app está corriendo dentro de la app de escritorio Tauri. */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI__)
}
```

- [ ] **Step 2: Integrar en `NotificationBell.tsx`**

El componente ya muestra notificaciones in-app. Vamos a añadir la llamada al bridge cuando llega una notificación nueva.

Leer el archivo completo:
`apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/NotificationBell.tsx`

Añadir el import al principio:
```typescript
import { sendDesktopNotification } from '@/lib/desktop-bridge'
```

En la función `handleOpen`, justo después de cargar las notificaciones, enviar notificación nativa para las no leídas recientes (las que no tienen `readAt`):

```typescript
async function handleOpen() {
  if (open) { setOpen(false); return }
  setOpen(true)
  const list = await getNotifications(workspaceId)
  setNotifications(list)

  // Notificación nativa para la más reciente no leída (solo en app de escritorio)
  const latest = list.find((n) => !n.readAt)
  if (latest) {
    await sendDesktopNotification('MITIKUS', latest.title ?? 'Tienes notificaciones nuevas')
  }
}
```

Nota: `latest.title` depende de cómo esté tipada `NotificationData`. Si el campo no existe como `title`, usar `latest.message ?? latest.content ?? 'Nueva notificación'`. Verificar el tipo en `@/app/actions/tasks` y ajustar el campo.

- [ ] **Step 3: Verificar en navegador normal**

```bash
npx turbo dev --filter=web
```

Navegar al workspace. Expected: ningún error en consola (el bridge retorna `false` silenciosamente al no detectar Tauri). Las notificaciones in-app funcionan igual que antes.

- [ ] **Step 4: Verificar en la app de escritorio (si ya hay build)**

Si ya se generó el `.exe` en Task 4, instalar y abrir. Expected: al abrir el NotificationBell con notificaciones no leídas → aparece notificación nativa del OS.

- [ ] **Step 5: Commit y deploy**

```bash
cd C:\Users\priet\protools-hub
git add apps/web/src/lib/desktop-bridge.ts
git add apps/web/src/app/\(dashboard\)/workspace/\[workspaceId\]/_components/NotificationBell.tsx
git commit -m "feat: add desktop-bridge for native OS notifications via Tauri"
npx vercel --prod
```

---

## Self-Review

**Spec coverage:**
- ✅ Task 1 — WebView apunta a https://www.mitikus.com, 1280×800, mínimo 800×600
- ✅ Task 2 — System tray: icono, menú (Abrir/Salir), cerrar → minimizar a bandeja
- ✅ Task 3 — Updater: comprueba al arrancar, notifica antes y después de descargar
- ✅ Task 4 — GitHub Actions: push v* → build .exe → GitHub Release con `latest.json`
- ✅ Task 5 — Página /download: detecta OS, botón Windows, fallback Mac, link a todas las releases, nota SmartScreen
- ✅ Task 6 — `desktop-bridge.ts` detecta `window.__TAURI__`, integración en NotificationBell

**Fuera de scope confirmado:**
- Mac build — no incluido (spec sección 9)
- Firma de código EV — no incluido (spec sección 9, nota SmartScreen en instalador)
- Token offline — no incluido (spec sección 9)

**Notas de implementación:**
- El campo `title` de `NotificationData` debe verificarse en `@/app/actions/tasks` antes de usar en Task 6 Step 2
- El repo `MitikusHQ/mitikus-desktop` debe existir en GitHub antes de poder hacer push en Task 4 Step 5
- La clave pública del updater (Task 4 Step 2) debe estar en `tauri.conf.json` antes de que el updater pueda funcionar; en dev se puede dejar vacía
