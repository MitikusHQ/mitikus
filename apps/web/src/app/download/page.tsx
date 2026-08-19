import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

const GITHUB_RELEASES_API =
  'https://api.github.com/repos/MitikusHQ/mitikus-desktop/releases/latest'
const FALLBACK_EXE_URL =
  'https://github.com/MitikusHQ/mitikus-desktop/releases/latest/download/MITIKUS_x64-setup.exe'

async function getLatestExeUrl(): Promise<string> {
  try {
    const res = await fetch(GITHUB_RELEASES_API, {
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

        <div className="space-y-3">
          <a
            href={exeUrl}
            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <WindowsIcon />
            Descargar para Windows (.exe)
          </a>
          <p className="text-sm text-muted-foreground">
            Versión de acceso anticipado · Windows 10/11
          </p>
        </div>

        <div className="rounded-xl border border-dashed p-6 text-muted-foreground space-y-1">
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
        </div>

        <div className="text-xs text-muted-foreground text-left bg-muted/50 rounded-lg p-4 space-y-1">
          <p className="font-medium text-foreground">Nota de seguridad</p>
          <p>
            Al instalar, Windows puede mostrar una alerta de seguridad. Haz clic en{' '}
            <strong>«Más información»</strong> →{' '}
            <strong>«Ejecutar de todas formas»</strong> para continuar. Es normal en la
            versión de acceso anticipado.
          </p>
        </div>

        <a
          href="https://github.com/MitikusHQ/mitikus-desktop/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todas las versiones →
        </a>
      </div>
    </main>
  )
}

function WindowsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 88 88"
      className="w-6 h-6"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349-.011 41.344-47.318-6.678-.066-34.78z" />
    </svg>
  )
}
