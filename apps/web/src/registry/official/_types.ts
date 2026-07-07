import type { ToolSchemaV1 } from '@protools/schema'
import type { CapabilityProfile } from '@/lib/tool-intelligence/types'

export type ToolTier = 'official' | 'community' | 'partner' | 'premium' | 'private'
export type ToolStatus = 'active' | 'beta' | 'deprecated' | 'archived'
export type ToolComplexity = 'simple' | 'intermediate' | 'advanced'

export interface RegistryMeta {
  displayCategory: string
  icon: string
  color: string
  tags: string[]
  keywords: string[]
  synonyms: string[]
  complexity: ToolComplexity
  estimatedMinutes: number
  authorName?: string
  authorOrg?: string
  toolVersion?: string
  status?: ToolStatus
  tier?: ToolTier
}

export interface OfficialToolDefinition {
  meta: RegistryMeta
  schema: ToolSchemaV1
  capability?: CapabilityProfile
}
