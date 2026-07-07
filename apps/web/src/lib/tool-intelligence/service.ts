/**
 * Tool Intelligence Service — API pública de inteligencia sobre herramientas.
 *
 * Toda la lógica de "qué hace una herramienta, cuándo usarla, cómo conectarla"
 * pasa por este módulo. Nunca acceder a ToolCapabilityProfile directamente
 * fuera de este archivo.
 */

import { db } from '@/lib/db'
import { calculateCompatibility } from './compatibility'
import { getNextSteps, getAlternatives, getPrerequisites, type ProfileWithSlug } from './recommendations'
import type {
  ToolFullProfile,
  CapabilityProfile,
  CompatibilityScore,
  ToolRecommendation,
  BusinessDomain,
  IOType,
  IntelligenceSearchHit,
} from './types'

// ── DB → Domain mappers ───────────────────────────────────────────

function dbProfileToCapabilityProfile(raw: {
  businessDomain:    string
  businessGoals:     unknown
  useCases:          unknown
  inputTypes:        unknown
  outputTypes:       unknown
  expectedOutput:    string | null
  requiredVariables: unknown
  optionalVariables: unknown
  recommendedModels: unknown
  supportedProviders: unknown
  executionCostEUR:  number
  qualityLevel:      string
  automationFriendly: boolean
  dependencies:      unknown
  relatedTools:      unknown
  alternativeTools:  unknown
}): CapabilityProfile {
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : []

  return {
    businessDomain:    raw.businessDomain as BusinessDomain,
    businessGoals:     arr(raw.businessGoals),
    useCases:          arr(raw.useCases),
    inputTypes:        arr(raw.inputTypes) as IOType[],
    outputTypes:       arr(raw.outputTypes) as IOType[],
    expectedOutput:    raw.expectedOutput ?? '',
    requiredVariables: arr(raw.requiredVariables),
    optionalVariables: arr(raw.optionalVariables),
    recommendedModels: arr(raw.recommendedModels),
    supportedProviders: arr(raw.supportedProviders),
    executionCostEUR:  raw.executionCostEUR,
    qualityLevel:      raw.qualityLevel as CapabilityProfile['qualityLevel'],
    automationFriendly: raw.automationFriendly,
    dependencies:      arr(raw.dependencies),
    relatedTools:      arr(raw.relatedTools),
    alternativeTools:  arr(raw.alternativeTools),
  }
}

async function loadAllProfilesWithSlug(): Promise<ProfileWithSlug[]> {
  const tools = await db.toolDefinition.findMany({
    where: { isPublic: true, capabilityProfile: { isNot: null } },
    select: {
      slug: true, name: true, description: true,
      capabilityProfile: true,
    },
  })

  return tools
    .filter((t) => t.capabilityProfile !== null)
    .map((t) => ({
      slug:        t.slug,
      name:        t.name,
      description: t.description,
      profile:     dbProfileToCapabilityProfile(t.capabilityProfile!),
    }))
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Devuelve el perfil completo de una herramienta (metadata + capacidad).
 */
export async function getToolCapabilities(toolSlug: string): Promise<ToolFullProfile | null> {
  const tool = await db.toolDefinition.findFirst({
    where: { slug: toolSlug },
    include: {
      registryMeta:      true,
      capabilityProfile: true,
    },
  })

  if (!tool) return null

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : []

  return {
    id:          tool.id,
    slug:        tool.slug,
    name:        tool.name,
    description: tool.description,
    category:    tool.category,
    source:      tool.source,
    icon:             tool.registryMeta?.icon ?? null,
    color:            tool.registryMeta?.color ?? null,
    displayCategory:  tool.registryMeta?.displayCategory ?? null,
    complexity:       tool.registryMeta?.complexity ?? null,
    estimatedMinutes: tool.registryMeta?.estimatedMinutes ?? null,
    tags:             arr(tool.registryMeta?.tags),
    keywords:         arr(tool.registryMeta?.keywords),
    tier:             tool.registryMeta?.tier ?? null,
    profile: tool.capabilityProfile
      ? dbProfileToCapabilityProfile(tool.capabilityProfile)
      : null,
  }
}

/**
 * Calcula la compatibilidad de conectar toolA → toolB en un workflow.
 */
export async function calculateWorkflowCompatibility(
  slugA: string,
  slugB: string,
): Promise<CompatibilityScore | null> {
  const [toolA, toolB] = await Promise.all([
    db.toolDefinition.findFirst({ where: { slug: slugA }, include: { capabilityProfile: true } }),
    db.toolDefinition.findFirst({ where: { slug: slugB }, include: { capabilityProfile: true } }),
  ])

  if (!toolA?.capabilityProfile || !toolB?.capabilityProfile) return null

  return calculateCompatibility(
    dbProfileToCapabilityProfile(toolA.capabilityProfile),
    dbProfileToCapabilityProfile(toolB.capabilityProfile),
    slugB,
  )
}

/**
 * Herramientas compatibles con la herramienta dada (puede conectar como output).
 */
export async function findCompatibleTools(
  toolSlug: string,
  limit = 8,
): Promise<Array<{ slug: string; name: string; description: string; compatibility: CompatibilityScore }>> {
  const source = await db.toolDefinition.findFirst({
    where: { slug: toolSlug },
    include: { capabilityProfile: true },
  })
  if (!source?.capabilityProfile) return []

  const sourceProfile = dbProfileToCapabilityProfile(source.capabilityProfile)
  const allTools = await loadAllProfilesWithSlug()

  return allTools
    .filter((t) => t.slug !== toolSlug)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      compatibility: calculateCompatibility(sourceProfile, t.profile, t.slug),
    }))
    .filter((r) => r.compatibility.score >= 20)
    .sort((a, b) => b.compatibility.score - a.compatibility.score)
    .slice(0, limit)
}

/**
 * Herramientas sugeridas como "siguiente paso" tras ejecutar la herramienta dada.
 */
export async function suggestNextTools(
  toolSlug: string,
  limit = 5,
): Promise<ToolRecommendation[]> {
  const tool = await db.toolDefinition.findFirst({
    where: { slug: toolSlug },
    include: { capabilityProfile: true },
  })
  if (!tool?.capabilityProfile) return []

  const current: ProfileWithSlug = {
    slug:        tool.slug,
    name:        tool.name,
    description: tool.description,
    profile:     dbProfileToCapabilityProfile(tool.capabilityProfile),
  }

  const allTools = await loadAllProfilesWithSlug()
  return getNextSteps(current, allTools).slice(0, limit)
}

/**
 * Herramientas que deben ejecutarse ANTES de la herramienta dada.
 */
export async function getToolPrerequisites(
  toolSlug: string,
): Promise<ToolRecommendation[]> {
  const tool = await db.toolDefinition.findFirst({
    where: { slug: toolSlug },
    include: { capabilityProfile: true },
  })
  if (!tool?.capabilityProfile) return []

  const current: ProfileWithSlug = {
    slug:        tool.slug,
    name:        tool.name,
    description: tool.description,
    profile:     dbProfileToCapabilityProfile(tool.capabilityProfile),
  }

  const allTools = await loadAllProfilesWithSlug()
  return getPrerequisites(current, allTools)
}

/**
 * Alternativas a la herramienta dada.
 */
export async function findAlternatives(toolSlug: string): Promise<ToolRecommendation[]> {
  const tool = await db.toolDefinition.findFirst({
    where: { slug: toolSlug },
    include: { capabilityProfile: true },
  })
  if (!tool?.capabilityProfile) return []

  const current: ProfileWithSlug = {
    slug:        tool.slug,
    name:        tool.name,
    description: tool.description,
    profile:     dbProfileToCapabilityProfile(tool.capabilityProfile),
  }

  const allTools = await loadAllProfilesWithSlug()
  return getAlternatives(current, allTools)
}

/**
 * Busca herramientas por objetivo empresarial.
 * Combina búsqueda sobre businessGoals y useCases.
 */
export async function searchByBusinessGoal(
  goal: string,
  limit = 6,
): Promise<IntelligenceSearchHit[]> {
  const goalLower = goal.toLowerCase()
  const tools = await loadAllProfilesWithSlug()

  const hits: IntelligenceSearchHit[] = []

  for (const tool of tools) {
    const matchedTerms: string[] = []
    let score = 0

    for (const g of tool.profile.businessGoals) {
      if (g.toLowerCase().includes(goalLower) || goalLower.includes(g.toLowerCase())) {
        matchedTerms.push(g)
        score += 40
      }
    }
    for (const u of tool.profile.useCases) {
      if (u.toLowerCase().includes(goalLower)) {
        matchedTerms.push(u)
        score += 20
      }
    }

    if (matchedTerms.length > 0) {
      // Fetch description from the in-memory object
      const toolDef = await db.toolDefinition.findFirst({
        where: { slug: tool.slug },
        select: { id: true, description: true },
      })
      hits.push({
        toolDefinitionId: toolDef?.id ?? tool.slug,
        slug:             tool.slug,
        name:             tool.name,
        description:      toolDef?.description ?? '',
        domain:           tool.profile.businessDomain,
        matchType:        'goal',
        matchedTerms:     [...new Set(matchedTerms)],
        score:            Math.min(100, score),
      })
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Busca herramientas por tipo de entrada (qué datos necesitan).
 */
export async function searchByInput(
  inputType: IOType,
  limit = 6,
): Promise<IntelligenceSearchHit[]> {
  const profiles = await db.toolCapabilityProfile.findMany({
    where: { inputTypes: { array_contains: inputType } },
    include: { toolDefinition: { select: { id: true, slug: true, name: true, description: true } } },
  })

  return profiles.slice(0, limit).map((p) => ({
    toolDefinitionId: p.toolDefinition.id,
    slug:             p.toolDefinition.slug,
    name:             p.toolDefinition.name,
    description:      p.toolDefinition.description,
    domain:           p.businessDomain as BusinessDomain,
    matchType:        'input' as const,
    matchedTerms:     [inputType],
    score:            80,
  }))
}

/**
 * Busca herramientas por tipo de salida (qué datos producen).
 */
export async function searchByOutput(
  outputType: IOType,
  limit = 6,
): Promise<IntelligenceSearchHit[]> {
  const profiles = await db.toolCapabilityProfile.findMany({
    where: { outputTypes: { array_contains: outputType } },
    include: { toolDefinition: { select: { id: true, slug: true, name: true, description: true } } },
  })

  return profiles.slice(0, limit).map((p) => ({
    toolDefinitionId: p.toolDefinition.id,
    slug:             p.toolDefinition.slug,
    name:             p.toolDefinition.name,
    description:      p.toolDefinition.description,
    domain:           p.businessDomain as BusinessDomain,
    matchType:        'output' as const,
    matchedTerms:     [outputType],
    score:            80,
  }))
}

/**
 * Busca herramientas por dominio empresarial.
 */
export async function searchByDomain(
  domain: BusinessDomain,
  limit = 12,
): Promise<IntelligenceSearchHit[]> {
  const profiles = await db.toolCapabilityProfile.findMany({
    where: { businessDomain: domain },
    include: { toolDefinition: { select: { id: true, slug: true, name: true, description: true } } },
    take: limit,
  })

  return profiles.map((p) => ({
    toolDefinitionId: p.toolDefinition.id,
    slug:             p.toolDefinition.slug,
    name:             p.toolDefinition.name,
    description:      p.toolDefinition.description,
    domain:           domain,
    matchType:        'capability' as const,
    matchedTerms:     [domain],
    score:            70,
  }))
}

/**
 * Construye el grafo completo de herramientas con sus conexiones.
 * Útil para el AI Planner: cada nodo sabe a quién puede conectarse.
 * Retorna estructura serializable para consumo por LLM.
 */
export async function buildToolGraph(): Promise<{
  nodes: Array<{
    slug: string
    name: string
    domain: BusinessDomain
    inputTypes: IOType[]
    outputTypes: IOType[]
    businessGoals: string[]
    successors: string[]     // slugs que pueden seguir a esta herramienta
    predecessors: string[]   // slugs que deben ejecutarse antes
    alternatives: string[]
  }>
}> {
  const allTools = await loadAllProfilesWithSlug()

  const nodes = allTools.map((tool) => {
    const myOutputs = new Set(tool.profile.outputTypes)
    const myInputs  = new Set(tool.profile.inputTypes)

    // Tools that can follow this one (consume our output)
    const successors = allTools
      .filter((t) => t.slug !== tool.slug)
      .filter((t) => t.profile.inputTypes.some((inp) => myOutputs.has(inp)))
      .map((t) => t.slug)

    // Tools that should run before this one (produce what we need)
    const predecessors = allTools
      .filter((t) => t.slug !== tool.slug)
      .filter((t) => t.profile.outputTypes.some((out) => myInputs.has(out)))
      .map((t) => t.slug)

    return {
      slug:          tool.slug,
      name:          tool.name,
      domain:        tool.profile.businessDomain,
      inputTypes:    tool.profile.inputTypes,
      outputTypes:   tool.profile.outputTypes,
      businessGoals: tool.profile.businessGoals,
      successors:    [...new Set([...tool.profile.relatedTools, ...successors])],
      predecessors:  [...new Set([...tool.profile.dependencies, ...predecessors])],
      alternatives:  tool.profile.alternativeTools,
    }
  })

  return { nodes }
}

/**
 * Serializa un perfil de herramienta para consumo por LLM (AI Planner).
 * Formato plano, sin objetos anidados, sin fechas, sin IDs internos.
 */
export function serializeProfileForLLM(profile: ToolFullProfile): Record<string, unknown> {
  return {
    slug:             profile.slug,
    name:             profile.name,
    description:      profile.description,
    category:         profile.category,
    // Presentación
    complexity:       profile.complexity,
    estimatedMinutes: profile.estimatedMinutes,
    tags:             profile.tags,
    // Inteligencia
    businessDomain:    profile.profile?.businessDomain,
    businessGoals:     profile.profile?.businessGoals ?? [],
    useCases:          profile.profile?.useCases ?? [],
    inputTypes:        profile.profile?.inputTypes ?? [],
    outputTypes:       profile.profile?.outputTypes ?? [],
    expectedOutput:    profile.profile?.expectedOutput,
    qualityLevel:      profile.profile?.qualityLevel,
    automationFriendly: profile.profile?.automationFriendly,
    executionCostEUR:  profile.profile?.executionCostEUR,
    recommendedModels: profile.profile?.recommendedModels ?? [],
    dependencies:      profile.profile?.dependencies ?? [],
    relatedTools:      profile.profile?.relatedTools ?? [],
    alternativeTools:  profile.profile?.alternativeTools ?? [],
  }
}
