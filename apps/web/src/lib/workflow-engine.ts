// WorkflowEngine — orquestador de ejecuciones de workflow
// Reutiliza runToolExecution() del execution-engine sin duplicar lógica

import { db } from '@/lib/db'
import { runToolExecution } from '@/lib/execution-engine'
import { recordAIUsage } from '@/lib/ai-usage'
import { validateGraph, topologicalSort } from '@/lib/workflow-graph'
import { resolveInputMapping, type WorkflowContext } from '@/lib/workflow-variables'
import { validateToolSchema } from '@protools/schema'
import { Prisma } from '@prisma/client'

// Tipo de retorno de la carga del workflow completo
type WorkflowWithGraph = Prisma.WorkflowGetPayload<{
  include: {
    nodes: { include: { toolDefinition: true } }
    connections: true
    variables: true
  }
}>

export interface WorkflowExecutionResult {
  workflowExecutionId: string
  status: 'COMPLETED' | 'FAILED'
  finalOutput: string | null
  totalCostEUR: number
  durationMs: number
  errorMessage?: string
}

// Fire-and-forget: los logs de ejecución son observabilidad pura, no deben bloquear el engine.
// En caso de fallo del log, la ejecución continúa; el resultado es siempre fiable.
function log(
  workflowExecutionId: string,
  message: string,
  level: 'info' | 'warning' | 'error' | 'debug' = 'info',
  workflowNodeId?: string,
  metadata?: Record<string, unknown>,
): void {
  void db.workflowExecutionLog
    .create({
      data: {
        workflowExecutionId,
        workflowNodeId: workflowNodeId ?? null,
        level,
        message,
        metadata: (metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    })
    .catch((err: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[workflow-log] Error al escribir log:', err)
      }
    })
}

export async function executeWorkflow(
  workflowExecutionId: string,
  userId: string,
  workspaceId: string,
  orgId: string,
  workflowId: string,
  executionVariables: Record<string, string> = {},
): Promise<WorkflowExecutionResult> {
  const startMs = Date.now()

  // Marcar RUNNING y cargar workflow en paralelo (2 → 1 roundtrip secuencial eliminado)
  const [, workflow] = await Promise.all([
    db.workflowExecution.update({
      where: { id: workflowExecutionId },
      data: { status: 'RUNNING', startedAt: new Date() },
    }),
    db.workflow.findUniqueOrThrow({
      where: { id: workflowId },
      include: {
        nodes: { include: { toolDefinition: true } },
        connections: true,
        variables: true,
      },
    }) as Promise<WorkflowWithGraph>,
  ])

  await log(workflowExecutionId, `Iniciando workflow "${workflow.name}" con ${workflow.nodes.length} nodo(s)`)

  // Filtrar nodos deshabilitados
  const activeNodes = workflow.nodes.filter((n) => !n.isDisabled)
  const activeNodeIds = new Set(activeNodes.map((n) => n.id))
  const activeConnections = workflow.connections.filter(
    (c) => activeNodeIds.has(c.sourceNodeId) && activeNodeIds.has(c.targetNodeId),
  )

  // Validar grafo
  const validation = validateGraph(
    activeNodes.map((n) => ({ id: n.id })),
    activeConnections.map((c) => ({ sourceNodeId: c.sourceNodeId, targetNodeId: c.targetNodeId })),
  )

  if (!validation.isValid) {
    const errorMessage = `Workflow inválido: ${validation.errors.join('; ')}`
    await db.workflowExecution.update({
      where: { id: workflowExecutionId },
      data: { status: 'FAILED', errorMessage, completedAt: new Date() },
    })
    await log(workflowExecutionId, errorMessage, 'error')
    return {
      workflowExecutionId,
      status: 'FAILED',
      finalOutput: null,
      totalCostEUR: 0,
      durationMs: Date.now() - startMs,
      errorMessage,
    }
  }

  // Ordenamiento topológico
  const executionOrder = topologicalSort(
    activeNodes.map((n) => ({ id: n.id })),
    activeConnections.map((c) => ({ sourceNodeId: c.sourceNodeId, targetNodeId: c.targetNodeId })),
  )

  await log(workflowExecutionId, `Orden de ejecución: ${executionOrder.length} nodos`)

  // Inicializar todos los nodos en IDLE con un solo INSERT (createMany vs N inserts secuenciales)
  await db.workflowNodeExecution.createMany({
    data: executionOrder.map((nodeId) => ({
      workflowExecutionId,
      workflowNodeId: nodeId,
      status: 'IDLE' as const,
    })),
  })

  // Pre-fetch de todas las virtual instances del workflow en 1 query (en vez de 1 por nodo en el loop)
  const toolDefinitionIds = [...new Set(activeNodes.map((n) => n.toolDefinition.id))]
  const existingInstances = await db.toolInstance.findMany({
    where: { toolDefinitionId: { in: toolDefinitionIds }, workspaceId },
    select: { id: true, toolDefinitionId: true },
  })
  const virtualInstanceMap = new Map(existingInstances.map((i) => [i.toolDefinitionId, i.id]))

  const missingDefinitionIds = toolDefinitionIds.filter((id) => !virtualInstanceMap.has(id))
  if (missingDefinitionIds.length > 0) {
    const created = await db.toolInstance.createManyAndReturn({
      data: missingDefinitionIds.map((tdId) => ({
        toolDefinitionId: tdId,
        workspaceId,
        name: activeNodes.find((n) => n.toolDefinition.id === tdId)!.toolDefinition.name,
        createdBy: userId,
      })),
      select: { id: true, toolDefinitionId: true },
    })
    for (const inst of created) {
      virtualInstanceMap.set(inst.toolDefinitionId, inst.id)
    }
  }

  // Contexto de ejecución (se va rellenando conforme completan los nodos)
  const context: WorkflowContext = {
    variables: executionVariables,
    nodes: {},
  }

  let totalCostEUR = 0
  let lastOutput: string | null = null
  let lastNodeId: string | null = null

  // Ejecutar nodos en orden topológico
  for (const nodeId of executionOrder) {
    const node = activeNodes.find((n) => n.id === nodeId)!
    const tool = node.toolDefinition

    // Marcar directamente como RUNNING (QUEUED es transitorio sin valor)
    await db.workflowNodeExecution.update({
      where: { workflowExecutionId_workflowNodeId: { workflowExecutionId, workflowNodeId: nodeId } },
      data: { status: 'RUNNING', startedAt: new Date() },
    })
    await log(workflowExecutionId, `Nodo "${node.label}" — ejecutando`, 'info', nodeId)

    // Resolver inputMapping con el contexto actual
    const rawMapping = (node.inputMapping ?? {}) as Record<string, string>
    const resolvedInputs = resolveInputMapping(rawMapping, context)

    // Validar schema de la herramienta
    const schemaResult = validateToolSchema(tool.schema)
    if (!schemaResult.success) {
      const err = `Schema inválido para "${tool.name}"`
      await db.workflowNodeExecution.update({
        where: { workflowExecutionId_workflowNodeId: { workflowExecutionId, workflowNodeId: nodeId } },
        data: { status: 'FAILED', errorMessage: err, completedAt: new Date() },
      })
      await log(workflowExecutionId, err, 'error', nodeId)
      await db.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: { status: 'FAILED', errorMessage: err, completedAt: new Date(), durationMs: Date.now() - startMs },
      })
      return { workflowExecutionId, status: 'FAILED', finalOutput: null, totalCostEUR, durationMs: Date.now() - startMs, errorMessage: err }
    }

    const configOverride = (node.configOverride ?? {}) as Record<string, unknown>
    const nodeStartMs = Date.now()

    try {
      // Crear ToolExecution en estado RUNNING (reutilizando el modelo existente)
      const toolExecution = await db.toolExecution.create({
        data: {
          toolInstanceId: virtualInstanceMap.get(tool.id)!,
          workspaceId,
          userId,
          status: 'RUNNING',
          variables: resolvedInputs as Prisma.InputJsonValue,
          model: (configOverride.model as string) ?? 'claude-sonnet-4-6',
          provider: (configOverride.provider as string) ?? 'anthropic',
        },
      })

      // Llamar al execution engine existente
      const execResult = await runToolExecution({
        toolName: tool.name,
        toolDescription: tool.description,
        category: tool.category,
        fields: schemaResult.data.dataSchema.fields,
        variables: resolvedInputs,
        model: (configOverride.model as string) ?? 'claude-sonnet-4-6',
        provider: (configOverride.provider as string) ?? 'anthropic',
        temperature: (configOverride.temperature as number | null) ?? null,
        maxTokens: (configOverride.maxTokens as number | null) ?? null,
      })

      const nodeDurationMs = Date.now() - nodeStartMs

      // Actualizar ToolExecution como COMPLETED
      await db.toolExecution.update({
        where: { id: toolExecution.id },
        data: {
          status: 'COMPLETED',
          result: execResult.result,
          systemPrompt: execResult.systemPrompt,
          userPrompt: execResult.userPrompt,
          inputTokens: execResult.inputTokens,
          outputTokens: execResult.outputTokens,
          estimatedCostEUR: execResult.estimatedCostEUR,
          durationMs: execResult.durationMs,
        },
      })

      // Actualizar WorkflowNodeExecution y vincular al ToolExecution
      await db.workflowNodeExecution.update({
        where: { workflowExecutionId_workflowNodeId: { workflowExecutionId, workflowNodeId: nodeId } },
        data: {
          status: 'COMPLETED',
          toolExecutionId: toolExecution.id,
          resolvedInputs: resolvedInputs as Prisma.InputJsonValue,
          output: execResult.result,
          completedAt: new Date(),
          durationMs: nodeDurationMs,
          inputTokens: execResult.inputTokens,
          outputTokens: execResult.outputTokens,
          estimatedCostEUR: execResult.estimatedCostEUR,
        },
      })

      // Registrar AIUsage (fire-and-forget, orgId viene del parámetro — sin N+1)
      recordAIUsage({
        userId,
        orgId,
        workspaceId,
        model:            execResult.model,
        inputTokens:      execResult.inputTokens,
        outputTokens:     execResult.outputTokens,
        estimatedCostEUR: execResult.estimatedCostEUR,
        durationMs:       execResult.durationMs,
        status:           'success',
      })

      // Añadir output al contexto para los nodos siguientes
      context.nodes[nodeId] = { output: execResult.result }
      totalCostEUR += execResult.estimatedCostEUR
      lastOutput = execResult.result
      lastNodeId = nodeId

      await log(workflowExecutionId, `Nodo "${node.label}" completado (${nodeDurationMs}ms, ${execResult.inputTokens + execResult.outputTokens} tokens)`, 'info', nodeId, {
        inputTokens: execResult.inputTokens,
        outputTokens: execResult.outputTokens,
        estimatedCostEUR: execResult.estimatedCostEUR,
        model: execResult.model,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      const nodeDurationMs = Date.now() - nodeStartMs

      await db.workflowNodeExecution.update({
        where: { workflowExecutionId_workflowNodeId: { workflowExecutionId, workflowNodeId: nodeId } },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
          durationMs: nodeDurationMs,
        },
      })
      await log(workflowExecutionId, `Nodo "${node.label}" falló: ${errorMessage}`, 'error', nodeId)

      // Fallar toda la ejecución del workflow
      await db.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: {
          status: 'FAILED',
          errorMessage: `Nodo "${node.label}" falló: ${errorMessage}`,
          completedAt: new Date(),
          durationMs: Date.now() - startMs,
          totalCostEUR,
        },
      })

      return {
        workflowExecutionId,
        status: 'FAILED',
        finalOutput: null,
        totalCostEUR,
        durationMs: Date.now() - startMs,
        errorMessage,
      }
    }
  }

  const durationMs = Date.now() - startMs

  await db.workflowExecution.update({
    where: { id: workflowExecutionId },
    data: {
      status: 'COMPLETED',
      finalOutput: lastOutput,
      completedAt: new Date(),
      durationMs,
      totalCostEUR,
    },
  })

  await log(workflowExecutionId, `Workflow completado en ${durationMs}ms. Coste total: €${totalCostEUR.toFixed(4)}`, 'info')

  return {
    workflowExecutionId,
    status: 'COMPLETED',
    finalOutput: lastOutput,
    totalCostEUR,
    durationMs,
  }
}

// Obtiene o crea una ToolInstance virtual para vincular la ejecución del nodo al workspace.
// Necesario porque ToolExecution requiere un toolInstanceId.
// Sin caché en módulo — el findFirst es idempotente y un Map en serverless no persiste.
async function getOrCreateVirtualInstance(
  toolDefinitionId: string,
  workspaceId: string,
  userId: string,
): Promise<string> {
  const existing = await db.toolInstance.findFirst({
    where: { toolDefinitionId, workspaceId },
    select: { id: true },
  })
  if (existing) return existing.id

  const tool = await db.toolDefinition.findUniqueOrThrow({
    where: { id: toolDefinitionId },
    select: { name: true },
  })

  const created = await db.toolInstance.create({
    data: {
      toolDefinitionId,
      workspaceId,
      name: tool.name,
      createdBy: userId,
    },
  })
  return created.id
}
