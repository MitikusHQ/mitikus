import { PrismaClient, ToolCategory } from '@prisma/client'
import { allOfficialTools } from '../src/registry/official'
import { CAPABILITY_PROFILES } from '../src/registry/official/_capability-profiles'

const db = new PrismaClient()

const CATEGORY_MAP: Record<string, ToolCategory> = {
  audit: ToolCategory.AUDIT,
  evaluation: ToolCategory.EVALUATION,
  checklist: ToolCategory.CHECKLIST,
  crm: ToolCategory.CRM,
  report: ToolCategory.REPORT,
  hr: ToolCategory.HR,
  operations: ToolCategory.OPERATIONS,
  finance: ToolCategory.FINANCE,
  custom: ToolCategory.CUSTOM,
}

async function seedOfficialTools() {
  console.log(`\nSeedling ${allOfficialTools.length} official tools...`)
  let created = 0
  let updated = 0

  for (const tool of allOfficialTools) {
    const { schema, meta } = tool

    const category = CATEGORY_MAP[schema.category]
    if (!category) {
      console.warn(`  ! Categoría desconocida '${schema.category}' en ${schema.slug} — saltando`)
      continue
    }

    const existing = await db.toolDefinition.findFirst({
      where: { slug: schema.slug, orgId: null },
    })

    let toolId: string

    if (existing) {
      await db.toolDefinition.update({
        where: { id: existing.id },
        data: {
          name: schema.name,
          description: schema.description,
          category,
          schema: schema as object,
          isPublic: true,
          source: 'official',
        },
      })
      toolId = existing.id
      updated++
    } else {
      const created_ = await db.toolDefinition.create({
        data: {
          id: schema.id,
          slug: schema.slug,
          name: schema.name,
          description: schema.description,
          category,
          schema: schema as object,
          isPublic: true,
          source: 'official',
          orgId: null,
          createdBy: null,
        },
      })
      toolId = created_.id
      created++
    }

    // Upsert registry metadata
    await db.toolRegistryMeta.upsert({
      where: { toolDefinitionId: toolId },
      create: {
        toolDefinitionId: toolId,
        displayCategory: meta.displayCategory,
        icon: meta.icon,
        color: meta.color,
        tags: meta.tags,
        keywords: meta.keywords,
        synonyms: meta.synonyms,
        complexity: meta.complexity,
        estimatedMinutes: meta.estimatedMinutes,
        authorName: meta.authorName ?? 'ProTools Hub Team',
        authorOrg: meta.authorOrg ?? 'ProTools Hub',
        toolVersion: meta.toolVersion ?? '1.0.0',
        status: meta.status ?? 'active',
        tier: meta.tier ?? 'official',
      },
      update: {
        displayCategory: meta.displayCategory,
        icon: meta.icon,
        color: meta.color,
        tags: meta.tags,
        keywords: meta.keywords,
        synonyms: meta.synonyms,
        complexity: meta.complexity,
        estimatedMinutes: meta.estimatedMinutes,
        authorName: meta.authorName ?? 'ProTools Hub Team',
        authorOrg: meta.authorOrg ?? 'ProTools Hub',
        toolVersion: meta.toolVersion ?? '1.0.0',
        status: meta.status ?? 'active',
        tier: meta.tier ?? 'official',
      },
    })

    console.log(`  ok [${schema.category}] ${schema.name}`)
  }

  console.log(`\nOfficial tools: ${created} creadas, ${updated} actualizadas.`)
}

async function seedCapabilityProfiles() {
  console.log('\nSeeding capability profiles...')
  let seeded = 0
  let skipped = 0

  for (const [slug, profile] of Object.entries(CAPABILITY_PROFILES)) {
    const tool = await db.toolDefinition.findFirst({
      where: { slug, orgId: null },
      select: { id: true },
    })

    if (!tool) {
      console.warn(`  ! Tool '${slug}' not found — skipping capability profile`)
      skipped++
      continue
    }

    await db.toolCapabilityProfile.upsert({
      where: { toolDefinitionId: tool.id },
      create: {
        toolDefinitionId: tool.id,
        businessDomain:    profile.businessDomain,
        businessGoals:     profile.businessGoals,
        useCases:          profile.useCases,
        inputTypes:        profile.inputTypes,
        outputTypes:       profile.outputTypes,
        expectedOutput:    profile.expectedOutput,
        requiredVariables: profile.requiredVariables,
        optionalVariables: profile.optionalVariables,
        recommendedModels: profile.recommendedModels,
        supportedProviders: profile.supportedProviders,
        executionCostEUR:  profile.executionCostEUR,
        qualityLevel:      profile.qualityLevel,
        automationFriendly: profile.automationFriendly,
        dependencies:      profile.dependencies,
        relatedTools:      profile.relatedTools,
        alternativeTools:  profile.alternativeTools,
      },
      update: {
        businessDomain:    profile.businessDomain,
        businessGoals:     profile.businessGoals,
        useCases:          profile.useCases,
        inputTypes:        profile.inputTypes,
        outputTypes:       profile.outputTypes,
        expectedOutput:    profile.expectedOutput,
        requiredVariables: profile.requiredVariables,
        optionalVariables: profile.optionalVariables,
        recommendedModels: profile.recommendedModels,
        supportedProviders: profile.supportedProviders,
        executionCostEUR:  profile.executionCostEUR,
        qualityLevel:      profile.qualityLevel,
        automationFriendly: profile.automationFriendly,
        dependencies:      profile.dependencies,
        relatedTools:      profile.relatedTools,
        alternativeTools:  profile.alternativeTools,
      },
    })

    console.log(`  ok [${profile.businessDomain}] ${slug}`)
    seeded++
  }

  console.log(`\nCapability profiles: ${seeded} seeded, ${skipped} skipped.`)
}

async function main() {
  console.log('=== ProTools Hub Seed ===')
  await seedOfficialTools()
  await seedCapabilityProfiles()
  console.log('\nSeed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
