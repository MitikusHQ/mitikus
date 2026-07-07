import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ToolCategory } from '@prisma/client'
import { MarketplaceHeader } from './_components/MarketplaceHeader'
import { MarketplaceClient } from './_components/MarketplaceClient'
import type { ToolCardData, ToolSchemaData } from './_lib/types'

interface Props {
  searchParams: Promise<{ category?: string; workspaceId?: string }>
}

export default async function ToolsPage({ searchParams }: Props) {
  const [{ category, workspaceId }, user] = await Promise.all([searchParams, requireUser()])

  const initialCategory = Object.values(ToolCategory).includes(category as ToolCategory)
    ? (category as ToolCategory)
    : undefined

  const [rawTools, favoriteRows] = await Promise.all([
    db.toolDefinition.findMany({
      where: { isPublic: true, orgId: null },
      include: { registryMeta: true },
      orderBy: { name: 'asc' },
    }),
    db.toolFavorite.findMany({
      where: { userId: user.id },
      select: { toolDefinitionId: true },
    }),
  ])

  const initialFavorites = favoriteRows.map((r) => r.toolDefinitionId)

  // Serialize to plain objects (no Date, no Prisma internals)
  const tools: ToolCardData[] = rawTools.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: t.category,
    source: t.source,
    schema: t.schema as ToolSchemaData,
    status: t.status as string,
    version: t.version,
    registryMeta: t.registryMeta
      ? {
          icon: t.registryMeta.icon,
          color: t.registryMeta.color,
          displayCategory: t.registryMeta.displayCategory,
          complexity: t.registryMeta.complexity,
          estimatedMinutes: t.registryMeta.estimatedMinutes,
          tags: t.registryMeta.tags as string[],
          keywords: t.registryMeta.keywords as string[],
          tier: t.registryMeta.tier,
        }
      : null,
  }))

  const totalCategories = new Set(rawTools.map((t) => t.category)).size
  const officialCount = rawTools.filter((t) => t.source === 'official').length
  const backHref = workspaceId ? `/workspace/${workspaceId}` : undefined

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        totalTools={tools.length}
        totalCategories={totalCategories}
        officialCount={officialCount}
        backHref={backHref}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <MarketplaceClient
          tools={tools}
          initialCategory={initialCategory}
          workspaceId={workspaceId}
          initialFavorites={initialFavorites}
        />
      </main>
    </div>
  )
}
