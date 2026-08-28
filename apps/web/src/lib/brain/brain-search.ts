// apps/web/src/lib/brain/brain-search.ts
import { db } from '@/lib/db'
import { Prisma, TaskStatus } from '@prisma/client'
import { searchProductKnowledge } from './product-knowledge'

export interface BrainFragment {
  type: 'document' | 'memory' | 'conversation' | 'tool' | 'help' | 'objective' | 'mission_step' | 'task'
  id: string
  title: string
  excerpt: string
  score: number
}

const LIMIT_PER_SOURCE = 3
const ACTIVE_CONTEXT_TERMS = [
  'ahora',
  'sigo',
  'seguir',
  'hacer',
  'pendiente',
  'pendientes',
  'urgente',
  'urgentes',
  'prioridad',
  'prioridades',
  'objetivo',
  'objetivos',
  'mision',
  'misión',
  'misiones',
  'estado',
  'resumen',
]

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

  const exactSources = [...docs, ...businessMemory, ...memoryItems, ...convs, ...tools]
  const activeContext = shouldIncludeActiveContext(query, exactSources.length)
    ? await searchActiveContext(workspaceId, orgId)
    : []

  const all = [...exactSources, ...activeContext, ...productHelp]
  all.sort((a, b) => b.score - a.score)
  return all.slice(0, 8)
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function shouldIncludeActiveContext(query: string, sourceCount: number): boolean {
  const normalized = normalizeSearchText(query)

  return sourceCount < 3 || ACTIVE_CONTEXT_TERMS.some((term) => normalized.includes(normalizeSearchText(term)))
}

async function searchActiveContext(workspaceId: string, orgId: string): Promise<BrainFragment[]> {
  try {
    const [memories, objectives, steps, tasks, documents] = await Promise.all([
      db.memoryItem.findMany({
        where: { workspaceId, orgId, status: 'active' },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, content: true, type: true, updatedAt: true },
      }),
      db.companyObjective.findMany({
        where: { workspaceId, status: { in: ['active', 'paused'] } },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: {
          id: true,
          label: true,
          description: true,
          status: true,
          priority: true,
          progress: true,
          dueDate: true,
          intelligence: { select: { state: true, nextActionText: true } },
        },
      }),
      db.missionStep.findMany({
        where: { workspaceId, status: { in: ['pending', 'in_progress', 'blocked'] } },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { id: true, title: true, description: true, status: true, priority: true },
      }),
      db.task.findMany({
        where: { workspaceId, status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { id: true, title: true, description: true, status: true, priority: true, dueDate: true },
      }),
      db.document.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' },
        take: 2,
        select: { id: true, title: true, rawText: true },
      }),
    ])

    return [
      ...memories.map((memory, index) => ({
        type: 'memory' as const,
        id: memory.id,
        title: `Memoria reciente: ${memory.title} (${memory.type})`,
        excerpt: memory.content.slice(0, 300),
        score: 0.85 - index * 0.02,
      })),
      ...objectives.map((objective, index) => ({
        type: 'objective' as const,
        id: objective.id,
        title: `Objetivo activo: ${objective.label}`,
        excerpt: [
          objective.description,
          `Estado: ${objective.status}. Prioridad: ${objective.priority}. Progreso: ${objective.progress}%.`,
          objective.intelligence?.state ? `Estado de misión: ${objective.intelligence.state}.` : '',
          objective.intelligence?.nextActionText ? `Siguiente acción: ${objective.intelligence.nextActionText}` : '',
          objective.dueDate ? `Vence: ${objective.dueDate.toISOString().slice(0, 10)}.` : '',
        ].filter(Boolean).join(' '),
        score: 0.8 - index * 0.02,
      })),
      ...steps.map((step, index) => ({
        type: 'mission_step' as const,
        id: step.id,
        title: `Paso de misión: ${step.title}`,
        excerpt: [
          step.description,
          `Estado: ${step.status}. Prioridad: ${step.priority}.`,
        ].filter(Boolean).join(' '),
        score: 0.75 - index * 0.02,
      })),
      ...tasks.map((task, index) => ({
        type: 'task' as const,
        id: task.id,
        title: `Tarea pendiente: ${task.title}`,
        excerpt: [
          task.description,
          `Estado: ${task.status}. Prioridad: ${task.priority}.`,
          task.dueDate ? `Vence: ${task.dueDate.toISOString().slice(0, 10)}.` : '',
        ].filter(Boolean).join(' '),
        score: 0.7 - index * 0.02,
      })),
      ...documents.map((document, index) => ({
        type: 'document' as const,
        id: document.id,
        title: `Documento reciente: ${document.title}`,
        excerpt: document.rawText.slice(0, 300),
        score: 0.55 - index * 0.02,
      })),
    ].filter((fragment) => fragment.excerpt.trim().length > 0)
  } catch (err) {
    console.error('[Brain] searchActiveContext error:', err)
    return []
  }
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

