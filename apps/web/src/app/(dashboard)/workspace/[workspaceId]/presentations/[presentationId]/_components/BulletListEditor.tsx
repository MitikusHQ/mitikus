'use client'

import { useRef } from 'react'

interface Props {
  bullets:  string[]
  onChange: (bullets: string[]) => void
  onBlur:   () => void
}

export function BulletListEditor({ bullets, onChange, onBlur }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRefs    = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, value: string) {
    const next = [...bullets]
    next[index] = value
    onChange(next)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...bullets]
      next.splice(index + 1, 0, '')
      onChange(next)
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
    } else if (e.key === 'Backspace' && bullets[index] === '') {
      e.preventDefault()
      if (bullets.length === 1) return
      const next = bullets.filter((_, i) => i !== index)
      onChange(next)
      setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 0)
    }
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    onBlur()
  }

  const list = bullets.length > 0 ? bullets : ['']

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onBlur={handleContainerBlur}
      className="space-y-1 outline-none"
    >
      {list.map((bullet, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-muted-foreground">•</span>
          <input
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            value={bullet}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            placeholder="Punto clave..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      ))}
    </div>
  )
}
