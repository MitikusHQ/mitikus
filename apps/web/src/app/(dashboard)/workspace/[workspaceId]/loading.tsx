export default function WorkspaceLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <div className="h-7 w-40 rounded bg-muted animate-pulse" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-2">
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            <div className="h-8 w-12 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
        <div className="rounded-lg border divide-y">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-12 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
