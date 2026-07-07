'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CAPABILITY_LABELS,
  COMPLEXITY_LABELS,
  COMPLEXITY_COLORS,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  type ResourceStatusString,
} from '@/lib/marketplace-config'
import type { ToolCardData } from '../_lib/types'

interface Props {
  tool: ToolCardData
  workspaceId?: string
  isFavorite?: boolean
  onFavorite?: (id: string) => void
}

export function ToolCard({ tool, workspaceId, isFavorite = false, onFavorite }: Props) {
  const { id, slug, name, description, category, source, schema, registryMeta: meta, status, version } = tool
  const statusKey = (status ?? 'PUBLISHED') as ResourceStatusString

  const href = workspaceId
    ? `/tools/${slug}?workspaceId=${workspaceId}`
    : `/tools/${slug}`

  const caps = schema?.capabilities?.slice(0, 3) ?? []
  const extraCaps = (schema?.capabilities?.length ?? 0) - caps.length

  const colors = CATEGORY_COLORS[category]
  const icon = meta?.icon ?? '🔧'
  const bgColor = meta?.color ? `${meta.color}18` : undefined
  const fgColor = meta?.color

  return (
    <article
      className={cn(
        'group flex flex-col rounded-xl border bg-card overflow-hidden',
        'transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'hover:border-primary/30',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
      )}
    >
      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">

        {/* Top row: icon + badges */}
        <div className="flex items-start justify-between gap-2">
          {/* Icon */}
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0',
              !bgColor && colors.iconBg,
            )}
            style={bgColor && fgColor ? { backgroundColor: bgColor, color: fgColor } : undefined}
          >
            {icon}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {source === 'official' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">
                Oficial
              </span>
            )}
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border leading-none',
                STATUS_BADGE_CLASSES[statusKey],
              )}
            >
              {STATUS_LABELS[statusKey]} · v{version ?? 1}
            </span>
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border leading-none',
                colors.bg, colors.text, colors.border,
              )}
            >
              {CATEGORY_LABELS[category]}
            </span>
          </div>
        </div>

        {/* Name */}
        <h2 className="font-semibold text-[15px] leading-snug">
          <Link
            href={href}
            className="hover:text-primary transition-colors focus:outline-none focus-visible:text-primary"
          >
            {name}
          </Link>
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {description}
        </p>

        {/* Metadata row */}
        {meta && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <span>⏱</span>
              <span>{meta.estimatedMinutes} min</span>
            </span>
            <span className={cn('font-medium', COMPLEXITY_COLORS[meta.complexity])}>
              {COMPLEXITY_LABELS[meta.complexity] ?? meta.complexity}
            </span>
          </div>
        )}

        {/* Capability chips */}
        {caps.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {caps.map((cap) => (
              <span
                key={cap.instanceId ?? cap.type}
                className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full leading-none"
              >
                {CAPABILITY_LABELS[cap.type] ?? cap.type}
              </span>
            ))}
            {extraCaps > 0 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full leading-none">
                +{extraCaps}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t px-5 py-3 flex items-center justify-between bg-muted/20">
        <Link
          href={href}
          className={cn(
            'text-xs font-semibold transition-colors',
            'text-primary hover:text-primary/80',
            'focus:outline-none focus-visible:underline',
          )}
          tabIndex={0}
        >
          Abrir →
        </Link>
        <button
          type="button"
          onClick={() => onFavorite?.(id)}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className={cn(
            'text-lg leading-none transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
            isFavorite
              ? 'text-rose-500 scale-110'
              : 'text-muted-foreground/40 hover:text-rose-400',
          )}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
    </article>
  )
}
