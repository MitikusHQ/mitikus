export interface ToolSearchHit {
  toolDefinitionId: string
  slug: string
  name: string
  description: string
  category: string
  capabilityLabels: string[]
  fieldCount: number
  fieldLabels: string[]
  isPublic: boolean
  orgId: string | null
  similarity: number  // 0–100 overall weighted score
  scoreBreakdown: {
    name: number
    description: number
    category: number
    capabilities: number
    fields: number
  }
  reason: string
}

export interface SearchSimilarResponse {
  suggestions: ToolSearchHit[]
  hasStrongMatch: boolean
  searchId: string
}

export type RegistryAction = 'install' | 'fork' | 'generate' | 'dismissed'

export const STRONG_MATCH_THRESHOLD = 70
export const MIN_SCORE_THRESHOLD = 12
