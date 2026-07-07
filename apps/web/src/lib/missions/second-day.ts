/**
 * Second Day Experience (BETA-002) — qué ha cambiado desde la última visita
 * y cómo ha progresado la empresa. Solo lectura de modelos ya existentes
 * (CompanyObjective, MissionStep, ToolExecution, BusinessMemoryLog,
 * CompanyRisk) — sin tocar ningún lib protegido, sin modelos nuevos.
 */

import { db } from '@/lib/db'

export interface SinceLastVisitItem {
  icon: string
  text: string
}

export interface SinceLastVisit {
  hasChanges: boolean
  items: SinceLastVisitItem[]
}

/**
 * Compara el estado de la empresa entre `since` (última visita) y ahora,
 * y devuelve una lista de cambios en lenguaje humano.
 */
export async function getSinceLastVisit(
  workspaceId: string,
  since: Date,
): Promise<SinceLastVisit> {
  const [
    missionsCreated,
    missionsCompleted,
    stepsCompleted,
    toolExecutions,
    knowledgeGained,
    newRisks,
    recommendationsGenerated,
  ] = await Promise.all([
    db.companyObjective.count({ where: { workspaceId, createdAt: { gt: since } } }),
    db.companyObjective.count({ where: { workspaceId, completedAt: { gt: since } } }),
    db.missionStep.count({ where: { workspaceId, completedAt: { gt: since } } }),
    db.toolExecution.count({ where: { workspaceId, createdAt: { gt: since } } }),
    db.businessMemoryLog.count({ where: { workspaceId, createdAt: { gt: since } } }),
    db.companyRisk.count({ where: { workspaceId, detectedAt: { gt: since }, status: 'open' } }),
    db.missionIntelligence.count({
      where: { workspaceId, updatedAt: { gt: since }, aiRecommendations: { not: null as never } },
    }),
  ])

  const items: SinceLastVisitItem[] = []

  if (missionsCompleted > 0) {
    items.push({ icon: '✓', text: `${missionsCompleted} misión${missionsCompleted > 1 ? 'es' : ''} completada${missionsCompleted > 1 ? 's' : ''}` })
  }
  if (missionsCreated > 0) {
    items.push({ icon: '✨', text: `${missionsCreated} misión${missionsCreated > 1 ? 'es' : ''} nueva${missionsCreated > 1 ? 's' : ''} definida${missionsCreated > 1 ? 's' : ''}` })
  }
  if (stepsCompleted > 0) {
    items.push({ icon: '◑', text: `${stepsCompleted} paso${stepsCompleted > 1 ? 's' : ''} completado${stepsCompleted > 1 ? 's' : ''}` })
  }
  if (recommendationsGenerated > 0) {
    items.push({ icon: '💡', text: `La IA preparó nuevas recomendaciones en ${recommendationsGenerated} misión${recommendationsGenerated > 1 ? 'es' : ''}` })
  }
  if (knowledgeGained > 0) {
    items.push({ icon: '🧠', text: `El conocimiento de tu empresa aumentó (${knowledgeGained} dato${knowledgeGained > 1 ? 's' : ''} nuevo${knowledgeGained > 1 ? 's' : ''})` })
  }
  if (toolExecutions > 0) {
    items.push({ icon: '⚙', text: `${toolExecutions} herramienta${toolExecutions > 1 ? 's' : ''} ejecutada${toolExecutions > 1 ? 's' : ''}` })
  }
  if (newRisks > 0) {
    items.push({ icon: '⚠', text: `${newRisks} riesgo${newRisks > 1 ? 's' : ''} nuevo${newRisks > 1 ? 's' : ''} detectado${newRisks > 1 ? 's' : ''}` })
  }

  return { hasChanges: items.length > 0, items }
}

export interface CompanyProgress {
  knowledgeEntries:    number  // conocimiento de empresa acumulado (total)
  automationsCreated:  number  // herramientas + flows instalados
  minutesSaved:        number  // suma de estimatedMinutes de pasos completados (todo el histórico)
  missionsCompleted:   number  // misiones completadas (todo el histórico)
  areasDiscovered:     number  // categorías de herramienta distintas ya usadas
}

/**
 * Progreso acumulado de la empresa (no de una misión individual).
 * Responde "por qué hoy estás mejor que ayer" con datos reales agregados.
 */
export async function getCompanyProgress(workspaceId: string): Promise<CompanyProgress> {
  const [
    knowledgeEntries,
    toolInstanceCount,
    workflowCount,
    completedSteps,
    missionsCompleted,
    categories,
  ] = await Promise.all([
    db.businessMemoryLog.count({ where: { workspaceId } }),
    db.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } }),
    db.workflow.count({ where: { workspaceId } }),
    db.missionStep.findMany({
      where: { workspaceId, status: 'completed' },
      select: { estimatedMinutes: true },
    }),
    db.companyObjective.count({ where: { workspaceId, status: 'completed' } }),
    db.missionStep.findMany({
      where: { workspaceId, recommendedCategory: { not: null } },
      select: { recommendedCategory: true },
      distinct: ['recommendedCategory'],
    }),
  ])

  const minutesSaved = completedSteps.reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0)

  return {
    knowledgeEntries,
    automationsCreated: toolInstanceCount + workflowCount,
    minutesSaved,
    missionsCompleted,
    areasDiscovered: categories.length,
  }
}
