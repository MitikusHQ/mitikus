import { Archive, Download, ExternalLink, MonitorDown, ShieldCheck, Smartphone } from 'lucide-react'

const GITHUB_RELEASES_API =
  'https://api.github.com/repos/MitikusHQ/mitikus-desktop/releases/latest'
const RELEASES_DESKTOP_URL = 'https://github.com/MitikusHQ/mitikus-desktop/releases/latest'
const RELEASES_ANDROID_URL = 'https://github.com/MitikusHQ/mitikus-android/releases/latest'

interface GitHubRelease {
  tag_name: string
  html_url: string
  assets: Array<{ name: string; browser_download_url: string }>
}

interface DownloadInfo {
  version: string
  releaseUrl: string
  installerUrl: string | null
  portableUrl: string | null
}

async function getLatestDownloadInfo(): Promise<DownloadInfo> {
  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('GitHub release unavailable')

    const data = (await res.json()) as GitHubRelease
    const installer = data.assets.find((a) => a.name.toLowerCase().endsWith('-setup.exe'))
      ?? data.assets.find((a) => a.name.toLowerCase().endsWith('.exe'))
    const portable = data.assets.find((a) => a.name.toLowerCase().includes('windows-x64.zip'))
      ?? data.assets.find((a) => a.name.toLowerCase().endsWith('.zip'))

    return {
      version: data.tag_name,
      releaseUrl: data.html_url,
      installerUrl: installer?.browser_download_url ?? null,
      portableUrl: portable?.browser_download_url ?? null,
    }
  } catch {
    return {
      version: 'última versión',
      releaseUrl: RELEASES_DESKTOP_URL,
      installerUrl: null,
      portableUrl: null,
    }
  }
}

export default async function DownloadPage() {
  const downloadInfo = await getLatestDownloadInfo()

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">

        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">MITIKUS Apps</p>
          <h1 className="text-3xl font-bold tracking-tight">Descarga MITIKUS</h1>
          <p className="text-muted-foreground">Accede a tu workspace desde cualquier dispositivo.</p>
        </div>

        {/* ── Windows ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MonitorDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Windows</h2>
              <p className="text-xs text-muted-foreground">App nativa · Windows 10/11 · {downloadInfo.version}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {downloadInfo.installerUrl ? (
              <a
                href={downloadInfo.installerUrl}
                className="flex min-h-28 flex-col justify-between rounded-lg border border-primary/40 bg-primary p-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Download className="h-4 w-4" />
                  Instalador recomendado
                </span>
                <span className="text-xs text-primary-foreground/80">
                  Instala MITIKUS y lo deja listo en el menú de Windows.
                </span>
              </a>
            ) : (
              <a
                href={downloadInfo.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-28 flex-col justify-between rounded-lg border border-primary/40 bg-primary p-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ExternalLink className="h-4 w-4" />
                  Abrir descarga
                </span>
                <span className="text-xs text-primary-foreground/80">
                  Te llevamos al release oficial para elegir el instalador.
                </span>
              </a>
            )}

            <a
              href={downloadInfo.portableUrl ?? downloadInfo.releaseUrl}
              target={downloadInfo.portableUrl ? undefined : '_blank'}
              rel={downloadInfo.portableUrl ? undefined : 'noopener noreferrer'}
              className="flex min-h-28 flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Archive className="h-4 w-4 text-primary" />
                ZIP portable
              </span>
              <span className="text-xs text-muted-foreground">
                Sin asistente de instalación. Descomprime y abre la app.
              </span>
            </a>
          </div>

          <div className="rounded-lg border bg-card p-4 flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Nota de seguridad</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Windows SmartScreen puede avisar porque la app está en acceso anticipado y aún no tiene reputación suficiente.
                Descarga siempre desde esta página o desde el{' '}
                <a href={downloadInfo.releaseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                  release oficial
                </a>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Android ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Android</h2>
              <p className="text-xs text-muted-foreground">App nativa · Android 8+</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={RELEASES_ANDROID_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-28 flex-col justify-between rounded-lg border border-primary/40 bg-primary p-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Download className="h-4 w-4" />
                Descargar APK
              </span>
              <span className="text-xs text-primary-foreground/80">
                Descarga el APK e instálalo directamente en tu Android.
              </span>
            </a>

            <div className="flex min-h-28 flex-col justify-between rounded-lg border bg-card p-5">
              <p className="text-sm font-semibold">Cómo instalar</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Descarga el APK desde el enlace</li>
                <li>Ajustes → Seguridad → Fuentes desconocidas</li>
                <li>Abre el APK descargado e instala</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ── iOS ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">iPhone / iPad</h2>
              <p className="text-xs text-muted-foreground">PWA instalable · iOS 16.4+</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="https://www.mitikus.com"
              className="flex min-h-28 flex-col justify-between rounded-lg border border-primary/40 bg-primary p-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ExternalLink className="h-4 w-4" />
                Abrir en Safari
              </span>
              <span className="text-xs text-primary-foreground/80">
                Abre mitikus.com en Safari para poder instalarlo.
              </span>
            </a>

            <div className="flex min-h-28 flex-col justify-between rounded-lg border bg-card p-5">
              <p className="text-sm font-semibold">Cómo instalar</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abre mitikus.com en Safari</li>
                <li>Toca el botón compartir <span className="font-mono">↑</span></li>
                <li>Selecciona "Añadir a pantalla de inicio"</li>
                <li>Toca "Añadir" — ya aparece el icono</li>
              </ol>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            La app se abre en pantalla completa sin barra de Safari. Funciona como una app nativa para el uso diario.
            Las notificaciones push requieren iOS 16.4 o superior.
          </p>
        </section>

      </div>
    </main>
  )
}
