'use client'

export default function ReceiptsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
      <p className="text-sm text-muted-foreground">No se pudo cargar el escáner de gastos.</p>
      <p className="text-xs text-muted-foreground/60">Si el problema continúa, recarga la página o contacta con soporte.</p>
      <button
        onClick={reset}
        className="text-xs font-medium text-primary hover:underline"
      >
        Reintentar
      </button>
    </div>
  )
}
