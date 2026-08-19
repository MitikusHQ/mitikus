// apps/web/src/lib/brain/brain-search.ts
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface BrainFragment {
  type: 'document' | 'memory' | 'conversation' | 'tool'
  id: string
  title: string
  excerpt: string
  score: number
}

const LIMIT_PER_SOURCE = 3

export async function searchWorkspace(
  workspaceId: string,
  query: string,
): Promise<BrainFragment[]> {
  const [docs, memory, convs, tools] = await Promise.all([
    searchDocuments(workspaceId, query),
    searchBusinessMemory(workspaceId, query),
    searchConversations(workspaceId, query),
    searchTools(query),
  ])

  const all = [...docs, ...memory, ...convs, ...tools]
  all.sort((a, b) => b.score - a.score)
  return all.slice(0, 8)
}

type DocRow = { id: string; title: string; excerpt: string; score: number }

async function searchDocuments(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<DocRow[]>(Prisma.sql`
      SELECT id,
             title,
             LEFT(raw_text, 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE(raw_text, '')), plainto_tsquery('spanish', ${query})) AS score
      FROM documents
      WHERE workspace_id = ${workspaceId}
        AND to_tsvector('spanish', COALESCE(raw_text, '')) @@ plainto_tsquery('spanish', ${query})
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
  } catch {
    return []
  }
}

type MemRow = { id: string; title: string; excerpt: string; score: number; kind: string }

async function searchBusinessMemory(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<MemRow[]>(Prisma.sql`
      SELECT id, title, LEFT(COALESCE(description, title), 300) AS excerpt, score, kind FROM (
        SELECT id,
               title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'objetivo' AS kind
        FROM company_objectives
        WHERE workspace_id = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               name AS title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'activo' AS kind
        FROM company_assets
        WHERE workspace_id = ${workspaceId}
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
        WHERE workspace_id = ${workspaceId}
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
        WHERE workspace_id = ${workspaceId}
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
  } catch {
    return []
  }
}

type ConvRow = { id: string; goal: string; excerpt: string; score: number }

async function searchConversations(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<ConvRow[]>(Prisma.sql`
      SELECT id,
             COALESCE(current_goal, raw_input, 'Conversación') AS goal,
             LEFT(COALESCE(raw_input, ''), 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE(raw_input, '') || ' ' || COALESCE(current_goal, '')),
                     plainto_tsquery('spanish', ${query})) AS score
      FROM copilot_conversations
      WHERE workspace_id = ${workspaceId}
        AND to_tsvector('spanish', COALESCE(raw_input, '') || ' ' || COALESCE(current_goal, ''))
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
  } catch {
    return []
  }
}

type ToolRow = { id: string; name: string; description: string; score: number }

async function searchTools(query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<ToolRow[]>(Prisma.sql`
      SELECT id,
             name,
             LEFT(COALESCE(description, ''), 300) AS description,
             ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                     plainto_tsquery('spanish', ${query})) AS score
      FROM tool_definitions
      WHERE to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
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
  } catch {
    return []
  }
}
