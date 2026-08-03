'use client'

interface Props { url: string }

export function CopyLinkButton({ url }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.open(url, '_blank')}
      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors shrink-0"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      </svg>
      Ver formulario
    </button>
  )
}
