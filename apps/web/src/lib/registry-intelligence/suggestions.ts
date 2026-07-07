import { searchSimilarTools } from './search'
import { STRONG_MATCH_THRESHOLD } from './types'
import type { ToolSearchHit } from './types'

export interface SuggestionsResult {
  suggestions: ToolSearchHit[]
  hasStrongMatch: boolean
}

export async function getSuggestions(
  prompt: string,
  orgId: string,
): Promise<SuggestionsResult> {
  const suggestions = await searchSimilarTools(prompt, orgId)
  const topScore = suggestions[0]?.similarity ?? 0
  const hasStrongMatch = suggestions.length > 0 && topScore >= STRONG_MATCH_THRESHOLD

  return { suggestions, hasStrongMatch }
}
