'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DeleteButton } from './DeleteButton'

interface SocialPost {
  id: string
  titulo: string
  cliente_o_marca?: string
  plataforma?: string
  formato?: string
  estado?: string
  fecha_prevista?: string
  copy?: string
  revision?: string
  createdAt: Date
}

interface Props {
  records: SocialPost[]
  workspaceId: string
  instanceId: string
  locale: string
}

const STATUS_COLORS: Record<string, string> = {
  'Idea': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Borrador': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'En revisión': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Aprobado': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Programado manualmente': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Publicado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Descartado': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const PLATFORM_ICONS: Record<string, string> = {
  'Instagram': '📸',
  'LinkedIn': '💼',
  'Facebook': '👥',
  'TikTok': '🎵',
  'YouTube': '▶️',
  'X/Twitter': '𝕏',
  'Google Business': '🏢',
  'Newsletter': '📧',
  'Otro': '📢',
}

const REVISION_COLORS: Record<string, string> = {
  'Sin revisar': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  'Revisar tono': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Revisar diseño': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Revisar legal': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Listo': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function formatDateShort(value: string | undefined, locale: string): string {
  if (!value) return ''
  try {
    const d = new Date(value)
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

export function SocialMediaPostsView({ records, workspaceId, instanceId, locale }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>('Todos')
  const [filterPlatform, setFilterPlatform] = useState<string>('Todas')

  const statuses = useMemo(() => {
    const s = Array.from(new Set(records.map((r) => r.estado).filter(Boolean))) as string[]
    return ['Todos', ...s]
  }, [records])

  const platforms = useMemo(() => {
    const p = Array.from(new Set(records.map((r) => r.plataforma).filter(Boolean))) as string[]
    return ['Todas', ...p]
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterStatus !== 'Todos' && r.estado !== filterStatus) return false
      if (filterPlatform !== 'Todas' && r.plataforma !== filterPlatform) return false
      return true
    })
  }, [records, filterStatus, filterPlatform])

  if (records.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                filterStatus === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {platforms.length > 2 && (
          <div className="flex items-center gap-1 flex-wrap border-l pl-2 ml-1">
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPlatform(p)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  filterPlatform === p
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {p === 'Todas' ? 'Todas' : `${PLATFORM_ICONS[p] ?? '📢'} ${p}`}
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} de {records.length} {records.length === 1 ? 'publicación' : 'publicaciones'}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">No hay publicaciones con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => {
            const copyExcerpt = post.copy && post.copy.length > 100 ? post.copy.slice(0, 97) + '…' : post.copy
            const icon = PLATFORM_ICONS[post.plataforma ?? ''] ?? '📢'

            return (
              <div
                key={post.id}
                className="flex flex-col rounded-xl border bg-card hover:shadow-sm transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none shrink-0" aria-label={post.plataforma}>{icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-snug truncate">{post.titulo}</p>
                      {post.cliente_o_marca && (
                        <p className="text-xs text-muted-foreground truncate">{post.cliente_o_marca}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                  {post.estado && (
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[post.estado] ?? 'bg-muted text-muted-foreground')}>
                      {post.estado}
                    </span>
                  )}
                  {post.formato && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">
                      {post.formato}
                    </span>
                  )}
                  {post.revision && post.revision !== 'Sin revisar' && (
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', REVISION_COLORS[post.revision] ?? 'bg-muted text-muted-foreground')}>
                      {post.revision}
                    </span>
                  )}
                </div>

                {/* Copy excerpt */}
                {copyExcerpt && (
                  <p className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {copyExcerpt}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t bg-muted/30 mt-auto">
                  {post.fecha_prevista ? (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      📅 {formatDateShort(post.fecha_prevista, locale)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">Sin fecha</span>
                  )}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/workspace/${workspaceId}/tools/${instanceId}/records/${post.id}`}
                      className="text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      Ver
                    </Link>
                    <DeleteButton instanceId={instanceId} recordId={post.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
