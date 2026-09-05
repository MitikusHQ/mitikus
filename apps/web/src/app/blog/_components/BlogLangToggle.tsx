'use client'

export function BlogLangToggle({ lang }: { lang: string }) {
  function switchLang(next: string) {
    document.cookie = `protools-locale=${next};path=/;max-age=31536000;samesite=lax`
    window.location.reload()
  }

  return (
    <div className="flex items-center rounded-md border border-input overflow-hidden text-xs font-medium">
      <button
        type="button"
        onClick={() => switchLang('es')}
        className={`px-2.5 py-1.5 transition-colors ${lang === 'es' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground'}`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => switchLang('en')}
        className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground'}`}
      >
        EN
      </button>
    </div>
  )
}
