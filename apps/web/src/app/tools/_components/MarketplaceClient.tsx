'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/marketplace-config'
import { MarketplaceSearch } from './MarketplaceSearch'
import { MarketplaceFilters } from './MarketplaceFilters'
import { ToolCard } from './ToolCard'
import { EmptyState } from './EmptyState'
import { toggleFavorite } from '@/app/actions/favorites'
import type { ToolCardData, ToolCategory, SortOption, CategoryFilterItem } from '../_lib/types'

interface Props {
  tools: ToolCardData[]
  initialCategory?: ToolCategory
  workspaceId?: string
  initialFavorites?: string[]
}

const COMPLEXITY_ORDER: Record<string, number> = {
  simple: 0,
  intermediate: 1,
  advanced: 2,
}

function sortTools(tools: ToolCardData[], sortBy: SortOption): ToolCardData[] {
  return [...tools].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name, 'es')
      case 'name_desc':
        return b.name.localeCompare(a.name, 'es')
      case 'category':
        return CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category], 'es')
      case 'time_asc': {
        const aTime = a.registryMeta?.estimatedMinutes ?? 999
        const bTime = b.registryMeta?.estimatedMinutes ?? 999
        return aTime - bTime
      }
      case 'complexity': {
        const aOrder = COMPLEXITY_ORDER[a.registryMeta?.complexity ?? 'intermediate'] ?? 1
        const bOrder = COMPLEXITY_ORDER[b.registryMeta?.complexity ?? 'intermediate'] ?? 1
        return aOrder - bOrder
      }
      default:
        return 0
    }
  })
}

function matchesSearch(tool: ToolCardData, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  if (tool.name.toLowerCase().includes(lower)) return true
  if (tool.description.toLowerCase().includes(lower)) return true
  if (CATEGORY_LABELS[tool.category].toLowerCase().includes(lower)) return true
  if (tool.registryMeta) {
    const { displayCategory, tags, keywords } = tool.registryMeta
    if (displayCategory.toLowerCase().includes(lower)) return true
    if (tags.some((t) => t.toLowerCase().includes(lower))) return true
    if (keywords.some((k) => k.toLowerCase().includes(lower))) return true
  }
  return false
}

export function MarketplaceClient({ tools, initialCategory, workspaceId, initialFavorites }: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'ALL'>(
    initialCategory ?? 'ALL',
  )
  const [sortBy, setSortBy] = useState<SortOption>('name_asc')
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(initialFavorites ?? []),
  )

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 220)
    return () => clearTimeout(id)
  }, [query])

  const handleFavorite = useCallback((id: string) => {
    // Optimistic update inmediato
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    // Persiste en DB (no esperamos para no bloquear UI)
    void toggleFavorite(id)
  }, [])

  // Category counts (always from full list)
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of tools) {
      map[t.category] = (map[t.category] ?? 0) + 1
    }
    return map
  }, [tools])

  // Build filter items
  const filterCategories = useMemo<CategoryFilterItem[]>(() => {
    const all: CategoryFilterItem = {
      value: 'ALL',
      label: 'Todas',
      icon: '✦',
      count: tools.length,
    }
    const cats = (Object.entries(categoryCounts) as [ToolCategory, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]): CategoryFilterItem => ({
        value: cat,
        label: CATEGORY_LABELS[cat],
        icon: CATEGORY_ICONS[cat],
        count,
      }))
    return [all, ...cats]
  }, [categoryCounts, tools.length])

  // Filter + sort
  const visibleTools = useMemo(() => {
    const filtered = tools.filter((t) => {
      const catMatch = activeCategory === 'ALL' || t.category === activeCategory
      const searchMatch = matchesSearch(t, debouncedQuery)
      return catMatch && searchMatch
    })
    return sortTools(filtered, sortBy)
  }, [tools, activeCategory, debouncedQuery, sortBy])

  const isSearching = debouncedQuery.length > 0

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <MarketplaceSearch value={query} onChange={setQuery} />

      {/* Filters row */}
      <MarketplaceFilters
        categories={filterCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalVisible={visibleTools.length}
        totalAll={tools.length}
      />

      {/* Grid */}
      {visibleTools.length === 0 ? (
        isSearching ? (
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            description={`No se encontraron herramientas para "${debouncedQuery}". Prueba con otro término.`}
            action={
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveCategory('ALL') }}
                className="text-sm text-primary hover:underline"
              >
                Limpiar búsqueda
              </button>
            }
          />
        ) : (
          <EmptyState
            icon="📭"
            title="Sin herramientas"
            description="No hay herramientas disponibles en esta categoría aún."
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 duration-200">
          {visibleTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              workspaceId={workspaceId}
              isFavorite={favorites.has(tool.id)}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
