'use client'

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-blue-400">MITIKUS</p>
        <h1 className="mb-3 text-2xl font-semibold">Sin conexión</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-400">
          Tu dispositivo no tiene acceso a internet. Comprueba la conexión y vuelve a intentarlo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Reintentar
        </button>
      </div>
    </main>
  )
}
