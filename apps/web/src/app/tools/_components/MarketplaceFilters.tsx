import { cn } from '@/lib/utils'
import { CategoryChip } from './CategoryChip'
import type { CategoryFilterItem, SortOption, ToolCategory } from '../_lib/types'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc',  label: 'A → Z' },
  { value: 'name_desc', label: 'Z → A' },
  { value: 'category',  label: 'Categoría' },
  { value: 'time_asc',  label: 'Más rápidas' },
  { value: 'complexity', label: 'Dificultad' },
]

interface Props {
  categories: CategoryFilterItem[]
  activeCategory: ToolCategory | 'ALL'
  onCategoryChange: (cat: ToolCategory | 'ALL') => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  totalVisible: number
  totalAll: number
}

export function MarketplaceFilters({
  categories,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  totalVisible,
  totalAll,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Category chips */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por categoría"
      >
        {categories.map((item) => (
          <CategoryChip
            key={item.value}
            item={item}
            isActive={activeCategory === item.value}
            onClick={() => onCategoryChange(item.value)}
          />
        ))}
      </div>

      {/* Bottom row: result count + sort */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {totalVisible === totalAll
            ? `${totalAll} herramientas`
            : `${totalVisible} de ${totalAll} herramientas`}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-muted-foreground sr-only">
            Ordenar por
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={cn(
              'text-xs rounded-md border border-input bg-background px-2 py-1.5',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'text-muted-foreground cursor-pointer',
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
