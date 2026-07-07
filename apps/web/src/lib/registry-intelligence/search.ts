import { db } from '@/lib/db'
import { rankTool } from './ranking'
import { MIN_SCORE_THRESHOLD } from './types'
import type { ToolSearchHit } from './types'

const MAX_CANDIDATES = 200
const MAX_RESULTS = 5

interface SchemaCapability {
  label?: string
  type?: string
}

interface SchemaField {
  label?: string
}

interface SchemaJson {
  capabilities?: SchemaCapability[]
  dataSchema?: { fields?: Record<string, SchemaField> }
}

function extractSchemaText(schema: unknown): {
  capabilityLabels: string[]
  fieldLabels: string[]
  fieldCount: number
} {
  const s = schema as SchemaJson
  const capabilityLabels = (s?.capabilities ?? [])
    .flatMap(c => [c.label, c.type].filter((v): v is string => Boolean(v)))
  const fields = s?.dataSchema?.fields ?? {}
  const fieldLabels = Object.values(fields)
    .map(f => f.label)
    .filter((v): v is string => Boolean(v))
  return { capabilityLabels, fieldLabels, fieldCount: fieldLabels.length }
}

export async function searchSimilarTools(
  prompt: string,
  orgId: string,
  limit = MAX_RESULTS,
): Promise<ToolSearchHit[]> {
  const candidates = await db.toolDefinition.findMany({
    where: {
      OR: [
        { isPublic: true },
        { orgId },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      schema: true,
      isPublic: true,
      orgId: true,
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_CANDIDATES,
  })

  const hits: ToolSearchHit[] = []

  for (const tool of candidates) {
    const { capabilityLabels, fieldLabels, fieldCount } = extractSchemaText(tool.schema)
    const ranked = rankTool(prompt, {
      name: tool.name,
      description: tool.description,
      category: tool.category.toLowerCase(),
      capabilityLabels,
      fieldLabels,
    })

    if (ranked.score >= MIN_SCORE_THRESHOLD) {
      hits.push({
        toolDefinitionId: tool.id,
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        category: tool.category.toLowerCase(),
        capabilityLabels,
        fieldLabels,
        fieldCount,
        isPublic: tool.isPublic,
        orgId: tool.orgId,
        similarity: ranked.score,
        scoreBreakdown: ranked.breakdown,
        reason: ranked.reason,
      })
    }
  }

  return hits
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
