/**
 * Workflow Generator — transforma un ExecutionPlan en una estructura de Workflow.
 *
 * Produce GeneratedWorkflow, directamente compatible con los modelos
 * Prisma WorkflowNode + WorkflowConnection.
 *
 * Posicionamiento: grilla vertical con fases en columnas.
 *   X = índice de fase × 320
 *   Y = índice de step × 140
 */

import type { ExecutionPlan, GeneratedWorkflow, GeneratedWorkflowNode, GeneratedWorkflowConnection } from './planner-types'

const COLUMN_SPACING = 320
const ROW_SPACING    = 140
const PADDING        = 60

export function generateWorkflow(plan: ExecutionPlan): GeneratedWorkflow {
  const nodes: GeneratedWorkflowNode[]             = []
  const connections: GeneratedWorkflowConnection[] = []

  // stepId → índice en nodes[]
  const stepIndexMap = new Map<string, number>()

  // ── Crear nodos ───────────────────────────────────────────────
  let globalOrder = 1

  for (let phaseIdx = 0; phaseIdx < plan.phases.length; phaseIdx++) {
    const phase = plan.phases[phaseIdx]
    if (!phase) continue

    for (let stepIdx = 0; stepIdx < phase.steps.length; stepIdx++) {
      const step = phase.steps[stepIdx]
      if (!step) continue

      const node: GeneratedWorkflowNode = {
        label:            step.toolName,
        toolDefinitionId: '',
        toolSlug:         step.toolSlug,
        positionX:        PADDING + phaseIdx * COLUMN_SPACING,
        positionY:        PADDING + stepIdx  * ROW_SPACING,
        executionOrder:   globalOrder,
        inputMapping:     {},
      }

      stepIndexMap.set(step.id, nodes.length)
      nodes.push(node)
      globalOrder++
    }
  }

  // ── Crear conexiones ──────────────────────────────────────────

  // 1. Dependencias declaradas en steps
  for (const phase of plan.phases) {
    for (const step of phase.steps) {
      const targetIdx = stepIndexMap.get(step.id)
      if (targetIdx === undefined) continue

      for (const depId of step.dependencies) {
        const sourceIdx = stepIndexMap.get(depId)
        if (sourceIdx !== undefined) {
          connections.push({ sourceIndex: sourceIdx, targetIndex: targetIdx })
        }
      }
    }
  }

  // 2. Conexiones lineales entre fases: último step fase N → primer step fase N+1
  for (let i = 0; i < plan.phases.length - 1; i++) {
    const currentPhase = plan.phases[i]
    const nextPhase    = plan.phases[i + 1]
    if (!currentPhase || !nextPhase) continue

    const lastStep  = currentPhase.steps[currentPhase.steps.length - 1]
    const firstStep = nextPhase.steps[0]
    if (!lastStep || !firstStep) continue

    const sourceIdx = stepIndexMap.get(lastStep.id)
    const targetIdx = stepIndexMap.get(firstStep.id)

    if (sourceIdx !== undefined && targetIdx !== undefined) {
      const alreadyExists = connections.some(
        (c) => c.sourceIndex === sourceIdx && c.targetIndex === targetIdx,
      )
      if (!alreadyExists) {
        connections.push({ sourceIndex: sourceIdx, targetIndex: targetIdx })
      }
    }
  }

  // 3. Conexiones secuenciales dentro de cada fase (cuando no es paralela)
  for (const phase of plan.phases) {
    if (phase.canParallel) continue

    for (let i = 0; i < phase.steps.length - 1; i++) {
      const stepA = phase.steps[i]
      const stepB = phase.steps[i + 1]
      if (!stepA || !stepB) continue

      const src = stepIndexMap.get(stepA.id)
      const tgt = stepIndexMap.get(stepB.id)
      if (src !== undefined && tgt !== undefined) {
        const alreadyExists = connections.some(
          (c) => c.sourceIndex === src && c.targetIndex === tgt,
        )
        if (!alreadyExists) {
          connections.push({ sourceIndex: src, targetIndex: tgt })
        }
      }
    }
  }

  return {
    name:        `${plan.label} — ${plan.rawGoal}`,
    description: plan.description,
    nodes,
    connections,
    totalNodes:  nodes.length,
  }
}
