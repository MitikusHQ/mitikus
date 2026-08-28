// apps/web/src/lib/brain/brain-search.ts
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { searchProductKnowledge } from './product-knowledge'

export interface BrainFragment {
  type: 'document' | 'memory' | 'conversation' | 'tool' | 'help'
  id: string
  title: string
  excerpt: string
  score: number
}

const LIMIT_PER_SOURCE = 3

export async function searchWorkspace(
  workspaceId: string,
  query: string,
  orgId: string,
): Promise<BrainFragment[]> {
  const [docs, businessMemory, memoryItems, convs, tools, productHelp] = await Promise.all([
    searchDocuments(workspaceId, query),
    searchBusinessMemory(workspaceId, query),
    searchMemoryItems(workspaceId, query, orgId),
    searchConversations(workspaceId, query),
    searchTools(query, orgId),
    Promise.resolve(searchProductKnowledge(query)),
  ])

  const all = [...docs, ...businessMemory, ...memoryItems, ...convs, ...tools, ...productHelp]
  all.sort((a, b) => b.score - a.score)
  return all.slice(0, 8)
}

type DocRow = { id: string; title: string; excerpt: string; score: number }

async function searchDocuments(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<DocRow[]>(Prisma.sql`
      SELECT id,
             title,
             LEFT("rawText", 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE("rawText", '')), plainto_tsquery('spanish', ${query})) AS score
      FROM documents
      WHERE "workspaceId" = ${workspaceId}
        AND to_tsvector('spanish', COALESCE("rawText", '')) @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'document' as const,
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch (err) {
    console.error('[Brain] searchDocuments error:', err)
    return []
  }
}

type MemRow = { id: string; title: string; excerpt: string; score: number; kind: string }

async function searchBusinessMemory(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<MemRow[]>(Prisma.sql`
      SELECT id, title, LEFT(COALESCE(description, title), 300) AS excerpt, score, kind FROM (
        SELECT id,
               label AS title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(label, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'objetivo' AS kind
        FROM company_objectives
        WHERE "workspaceId" = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(label, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               name AS title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'activo' AS kind
        FROM company_assets
        WHERE "workspaceId" = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               name AS title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'proceso' AS kind
        FROM company_processes
        WHERE "workspaceId" = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'riesgo' AS kind
        FROM company_risks
        WHERE "workspaceId" = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
      ) sub
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'memory' as const,
      id: r.id,
      title: `${r.title} (${r.kind})`,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch (err) {
    console.error('[Brain] searchBusinessMemory error:', err)
    return []
  }
}

type MemoryItemRow = { id: string; title: string; excerpt: string; score: number; kind: string }

async function searchMemoryItems(
  workspaceId: string,
  query: string,
  orgId: string,
): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<MemoryItemRow[]>(Prisma.sql`
      SELECT id,
             title,
             LEFT(COALESCE(content, ''), 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(type, '')),
                     plainto_tsquery('spanish', ${query})) AS score,
             type AS kind
      FROM memory_items
      WHERE "workspaceId" = ${workspaceId}
        AND "orgId" = ${orgId}
        AND status = 'active'
        AND to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(type, ''))
            @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'memory' as const,
      id: r.id,
      title: `${r.title} (${r.kind})`,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch (err) {
    console.error('[Brain] searchMemoryItems error:', err)
    return []
  }
}

type ConvRow = { id: string; goal: string; excerpt: string; score: number }

async function searchConversations(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<ConvRow[]>(Prisma.sql`
      SELECT id,
             COALESCE("currentGoal", "rawInput", 'Conversación') AS goal,
             LEFT(COALESCE("rawInput", ''), 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE("rawInput", '') || ' ' || COALESCE("currentGoal", '')),
                     plainto_tsquery('spanish', ${query})) AS score
      FROM copilot_conversations
      WHERE "workspaceId" = ${workspaceId}
        AND to_tsvector('spanish', COALESCE("rawInput", '') || ' ' || COALESCE("currentGoal", ''))
            @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'conversation' as const,
      id: r.id,
      title: r.goal,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch (err) {
    console.error('[Brain] searchConversations error:', err)
    return []
  }
}

type ToolRow = { id: string; name: string; description: string; score: number }

async function searchTools(query: string, orgId: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<ToolRow[]>(Prisma.sql`
      SELECT id,
             name,
             LEFT(COALESCE(description, ''), 300) AS description,
             ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                     plainto_tsquery('spanish', ${query})) AS score
      FROM tool_definitions
      WHERE ("isPublic" = true OR "orgId" = ${orgId} OR "orgId" IS NULL)
        AND to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'tool' as const,
      id: r.id,
      title: r.name,
      excerpt: r.description,
      score: Number(r.score),
    }))
  } catch (err) {
    console.error('[Brain] searchTools error:', err)
    return []
  }
}

