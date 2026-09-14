'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'

export interface MentionMember {
  id: string
  name: string | null
  email: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  members: MentionMember[]
  placeholder?: string
  multiline?: boolean
  className?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  disabled?: boolean
}

// Returns the @query being typed at the current cursor position, or null
function getMentionQuery(text: string, cursor: number): string | null {
  const before = text.slice(0, cursor)
  const match = before.match(/@([\w\s]*)$/)
  return match ? (match[1] ?? '') : null
}

export function MentionInput({
  value,
  onChange,
  members,
  placeholder,
  multiline = false,
  className,
  onKeyDown,
  disabled,
}: Props) {
  const [query, setQuery]           = useState<string | null>(null)
  const [selected, setSelected]     = useState(0)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const suggestions = query === null
    ? []
    : members.filter((m) => {
        const q = query.toLowerCase()
        const name = (m.name ?? m.email).toLowerCase()
        return name.includes(q)
      }).slice(0, 6)

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const v = e.target.value
    const cursor = e.target.selectionStart ?? v.length
    onChange(v)
    const q = getMentionQuery(v, cursor)
    setQuery(q)
    setSelected(0)
  }

  function pickSuggestion(member: MentionMember) {
    const cursor = inputRef.current?.selectionStart ?? value.length
    const before = value.slice(0, cursor)
    const after  = value.slice(cursor)
    // Replace @query with @name
    const replaced = before.replace(/@([\w\s]*)$/, `@${member.name ?? member.email} `)
    onChange(replaced + after)
    setQuery(null)
    // Restore focus
    setTimeout(() => {
      inputRef.current?.focus()
      const pos = replaced.length
      inputRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelected((s) => (s + 1) % suggestions.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelected((s) => (s - 1 + suggestions.length) % suggestions.length)
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          const m = suggestions[selected]
          if (m) {
            e.preventDefault()
            pickSuggestion(m)
            return
          }
        }
        if (e.key === 'Escape') {
          setQuery(null)
          return
        }
      }
      onKeyDown?.(e)
    },
    [suggestions, selected, onKeyDown],
  )

  // Close on click outside
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setQuery(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sharedProps = {
    ref:         inputRef as never,
    value,
    onChange:    handleChange,
    onKeyDown:   handleKeyDown,
    placeholder,
    disabled,
    className,
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      {multiline ? (
        <textarea {...sharedProps} rows={3} />
      ) : (
        <input {...sharedProps} type="text" />
      )}

      {suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 bottom-full mb-1 left-0 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={i === selected}
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(m) }}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs ${
                i === selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0 select-none">
                {(m.name ?? m.email)[0]?.toUpperCase()}
              </span>
              <span className="truncate">{m.name ?? m.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
