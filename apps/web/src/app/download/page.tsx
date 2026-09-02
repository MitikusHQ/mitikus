import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Archive, Download, ExternalLink, MonitorDown, ShieldCheck } from 'lucide-react'

const GITHUB_RELEASES_API =
  'https://api.github.com/repos/MitikusHQ/mitikus-desktop/releases/latest'
const RELEASES_URL = 'https://github.com/MitikusHQ/mitikus-desktop/releases/latest'

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
      releaseUrl: RELEASES_URL,
      installerUrl: null,
      portableUrl: null,
    }
  }
}

export default async function DownloadPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const downloadInfo = await getLatestDownloadInfo()

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MonitorDown className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            MITIKUS Desktop
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Descarga MITIKUS para Windows</h1>
          <p className="text-muted-foreground">
            Accede a tu workspace desde una app nativa en Windows 10/11.
          </p>
          <p className="text-xs text-muted-foreground">Versión {downloadInfo.version}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {downloadInfo.installerUrl ? (
            <a
              href={downloadInfo.installerUrl}
              className="flex min-h-32 flex-col justify-between rounded-lg border border-primary/40 bg-primary p-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Download className="h-4 w-4" aria-hidden />
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
              className="flex min-h-32 flex-col justify-between rounded-lg border border-primary/40 bg-primary p-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ExternalLink className="h-4 w-4" aria-hidden />
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
            className="flex min-h-32 flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Archive className="h-4 w-4 text-primary" aria-hidden />
              ZIP portable
            </span>
            <span className="text-xs text-muted-foreground">
              Alternativa sin asistente de instalación. Descomprime y abre la app.
            </span>
          </a>
        </div>

        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Nota de seguridad</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                MITIKUS Desktop está en acceso anticipado. Windows SmartScreen o algunos antivirus
                pueden avisar porque la app todavía no tiene reputación suficiente como editor nuevo.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Descarga siempre desde esta página o desde el release oficial. Estamos tramitando
                revisiones de falso positivo con los proveedores de seguridad.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-dashed p-5 text-muted-foreground">
          <p className="font-medium text-foreground">¿Mac o Linux?</p>
          <p className="text-sm">
            La versión para Mac estará disponible próximamente. Mientras tanto, accede a
            MITIKUS desde tu navegador en{' '}
            <a
              href="https://www.mitikus.com"
              className="underline hover:text-foreground transition-colors"
            >
              mitikus.com
            </a>
            .
          </p>
        </section>

        <a
          href={downloadInfo.releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver release oficial
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </main>
  )
}
