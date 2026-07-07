import type { ToolCategory } from '@prisma/client'

export type { ToolCategory }

export type SortOption = 'name_asc' | 'name_desc' | 'category' | 'complexity' | 'time_asc'

export interface CapabilityData {
  type: string
  instanceId?: string
  label?: string
}

export interface ToolSchemaData {
  capabilities?: CapabilityData[]
  dataSchema?: {
    fields?: Record<string, { type: string; label: string; required?: boolean; options?: string[] }>
    criteria?: Array<{ id: string; label: string; weight?: number }>
    items?: Array<{ id: string; label: string; category?: string; required?: boolean }>
  }
}

export interface ToolMetaData {
  icon: string
  color: string
  displayCategory: string
  complexity: string
  estimatedMinutes: number
  tags: string[]
  keywords: string[]
  tier: string
}

/** Serializable shape passed from server to client (no Date objects) */
export interface ToolCardData {
  id: string
  slug: string
  name: string
  description: string
  category: ToolCategory
  source: string
  schema: ToolSchemaData
  registryMeta: ToolMetaData | null
  status: string   // ResourceStatus as string: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  version: number
}

export interface CategoryFilterItem {
  value: ToolCategory | 'ALL'
  label: string
  icon: string
  count: number
}
