'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ResourceStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { assertCan } from '@/lib/permissions'
import { audit } from '@/lib/audit'
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'

// ── Tipos serializables (sin Date ni Prisma internals) ──────────

export interface WorkflowSummary {
  id: string
  name: string
  description: string | null
  isActive: boolean
  status: string   // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  version: number
  nodeCount: number
  executionCount: number
  lastExecutionAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkflowNodeData {
  id: string
  workflowId: string
  toolDefinitionId: string
  toolName: string
  toolDescription: string
  toolCategory: string
  toolIcon: string
  label: string
  positionX: number
  positionY: number
  inputMapping: Record<string, string>
  configOverride: Record<string, unknown>
  isDisabled: boolean
  executionOrder: number
}

export interface WorkflowConnectionData {
  id: string
  workflowId: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string | null
  targetHandle: string | null
}

export interface WorkflowVariableData {
  id: string
  workflowId: string
  key: string
  defaultValue: string
  description: string | null
  type: string
}

export interface WorkflowDetail {
  id: string
  name: string
  description: string | null
  isActive: boolean
  status: string   // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  version: number
  workspaceId: string
  nodes: WorkflowNodeData[]
  connections: WorkflowConnectionData[]
  variables: WorkflowVariableData[]
  createdAt: string
  updatedAt: string
}

// ── Helpers de acceso ────────────────────────────────────────────

async function verifyWorkspaceAccess(workspaceId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')
  return { user, workspace }
}

async function verifyWorkflowAccess(workflowId: string, workspaceId: string) {
  const { user } = await verifyWorkspaceAccess(workspaceId)
  const workflow = await db.workflow.findFirst({
    where: { id: workflowId, workspaceId },
  })
  if (!workflow) throw new Error('Workflow no encontrado')
  return { user, workflow }
}

// ── CRUD Workflows ────────────────────────────────────────────────

export async function listWorkflows(workspaceId: string): Promise<WorkflowSummary[]> {
  await verifyWorkspaceAccess(workspaceId)

  const workflows = await db.workflow.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { nodes: true, executions: true } },
      executions: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    isActive: w.isActive,
    status: w.status as string,
    version: w.version,
    nodeCount: w._count.nodes,
    executionCount: w._count.executions,
    lastExecutionAt: w.executions[0]?.createdAt.toISOString() ?? null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }))
}

export async function getWorkflowDetail(
  workflowId: string,
  workspaceId: string,
): Promise<WorkflowDetail | null> {
  await verifyWorkspaceAccess(workspaceId)

  const workflow = await db.workflow.findFirst({
    where: { id: workflowId, workspaceId },
    include: {
      nodes: { include: { toolDefinition: { include: { registryMeta: true } } } },
      connections: true,
      variables: true,
    },
  })
  if (!workflow) return null

  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    isActive: workflow.isActive,
    status: workflow.status as string,
    version: workflow.version,
    workspaceId: workflow.workspaceId,
    nodes: workflow.nodes.map((n) => ({
      id: n.id,
      workflowId: n.workflowId,
      toolDefinitionId: n.toolDefinitionId,
      toolName: n.toolDefinition.name,
      toolDescription: n.toolDefinition.description,
      toolCategory: n.toolDefinition.category,
      toolIcon: n.toolDefinition.registryMeta?.icon ?? '🔧',
      label: n.label,
      positionX: n.positionX,
      positionY: n.positionY,
      inputMapping: (n.inputMapping ?? {}) as Record<string, string>,
      configOverride: (n.configOverride ?? {}) as Record<string, unknown>,
      isDisabled: n.isDisabled,
      executionOrder: n.executionOrder,
    })),
    connections: workflow.connections.map((c) => ({
      id: c.id,
      workflowId: c.workflowId,
      sourceNodeId: c.sourceNodeId,
      targetNodeId: c.targetNodeId,
      sourceHandle: c.sourceHandle,
      targetHandle: c.targetHandle,
    })),
    variables: workflow.variables.map((v) => ({
      id: v.id,
      workflowId: v.workflowId,
      key: v.key,
      defaultValue: v.defaultValue,
      description: v.description,
      type: v.type,
    })),
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  }
}

export async function createWorkflow(
  workspaceId: string,
  name: string,
  description?: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const { user } = await verifyWorkspaceAccess(workspaceId)
    assertCan(user, 'create_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow' })
    const workflow = await db.workflow.create({
      data: { workspaceId, name, description: description ?? null, createdBy: user.id, status: ResourceStatus.DRAFT },
    })
    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.create',
      entityType: 'workflow',
      entityId: workflow.id,
      metadata: { name },
    })
    return { id: workflow.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al crear el workflow' }
  }
}

export async function updateWorkflowMeta(
  workflowId: string,
  workspaceId: string,
  data: { name?: string; description?: string | null; isActive?: boolean },
): Promise<{ success: true } | { error: string }> {
  try {
    const { user } = await verifyWorkflowAccess(workflowId, workspaceId)
    assertCan(user, 'edit_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow', entityId: workflowId })
    await db.workflow.update({ where: { id: workflowId }, data })
    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.update',
      entityType: 'workflow',
      entityId: workflowId,
      metadata: { fields: Object.keys(data) },
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al actualizar' }
  }
}

export async function deleteWorkflow(
  workflowId: string,
  workspaceId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { user } = await verifyWorkflowAccess(workflowId, workspaceId)
    assertCan(user, 'delete_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow', entityId: workflowId })
    await db.workflow.delete({ where: { id: workflowId } })
    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.delete',
      entityType: 'workflow',
      entityId: workflowId,
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al eliminar' }
  }
}

// ── Guardar el grafo completo (nodos + conexiones) ───────────────

export interface SaveGraphInput {
  nodes: Array<{
    id: string // React Flow node id (puede ser temporal "new-xxx")
    toolDefinitionId: string
    label: string
    positionX: number
    positionY: number
    inputMapping: Record<string, string>
    configOverride: Record<string, unknown>
    isDisabled: boolean
  }>
  connections: Array<{
    sourceNodeId: string
    targetNodeId: string
    sourceHandle?: string
    targetHandle?: string
  }>
}

export async function saveWorkflowGraph(
  workflowId: string,
  workspaceId: string,
  graph: SaveGraphInput,
): Promise<{ success: true; nodeIdMap: Record<string, string> } | { error: string }> {
  try {
    const { user } = await verifyWorkflowAccess(workflowId, workspaceId)
    assertCan(user, 'edit_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow', entityId: workflowId })

    // Transacción: borrar todo y recrear (más simple para MVP)
    const nodeIdMap: Record<string, string> = {}

    await db.$transaction(async (tx) => {
      // Borrar conexiones y nodos existentes
      await tx.workflowConnection.deleteMany({ where: { workflowId } })
      await tx.workflowNode.deleteMany({ where: { workflowId } })

      // Crear nodos nuevos
      for (let i = 0; i < graph.nodes.length; i++) {
        const n = graph.nodes[i]!
        const created = await tx.workflowNode.create({
          data: {
            workflowId,
            toolDefinitionId: n.toolDefinitionId,
            label: n.label,
            positionX: n.positionX,
            positionY: n.positionY,
            inputMapping: n.inputMapping as Prisma.InputJsonValue,
            configOverride: n.configOverride as Prisma.InputJsonValue,
            isDisabled: n.isDisabled,
            executionOrder: i,
          },
        })
        nodeIdMap[n.id] = created.id
      }

      // Crear conexiones con los IDs reales
      for (const c of graph.connections) {
        const realSource = nodeIdMap[c.sourceNodeId] ?? c.sourceNodeId
        const realTarget = nodeIdMap[c.targetNodeId] ?? c.targetNodeId
        await tx.workflowConnection.create({
          data: {
            workflowId,
            sourceNodeId: realSource,
            targetNodeId: realTarget,
            sourceHandle: c.sourceHandle ?? 'output',
            targetHandle: c.targetHandle ?? 'input',
          },
        })
      }

      await tx.workflow.update({ where: { id: workflowId }, data: { updatedAt: new Date() } })
    })

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.graph_save',
      entityType: 'workflow',
      entityId: workflowId,
      metadata: { nodeCount: graph.nodes.length, connectionCount: graph.connections.length },
    })

    return { success: true, nodeIdMap }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar el grafo' }
  }
}

// ── CRUD Variables ────────────────────────────────────────────────

export async function saveWorkflowVariables(
  workflowId: string,
  workspaceId: string,
  variables: Array<{ key: string; defaultValue: string; description?: string; type?: string }>,
): Promise<{ success: true } | { error: string }> {
  try {
    await verifyWorkflowAccess(workflowId, workspaceId)

    await db.$transaction(async (tx) => {
      await tx.workflowVariable.deleteMany({ where: { workflowId } })
      for (const v of variables) {
        await tx.workflowVariable.create({
          data: { workflowId, key: v.key, defaultValue: v.defaultValue, description: v.description ?? null, type: v.type ?? 'string' },
        })
      }
    })

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar variables' }
  }
}

// ── Herramientas disponibles para el sidebar ─────────────────────

export interface ToolPaletteItem {
  id: string
  name: string
  description: string
  category: string
  icon: string
  slug: string
}

export async function getToolPalette(): Promise<ToolPaletteItem[]> {
  const tools = await db.toolDefinition.findMany({
    where: { isPublic: true },
    include: { registryMeta: true },
    orderBy: { name: 'asc' },
  })
  return tools.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.registryMeta?.icon ?? '🔧',
    slug: t.slug,
  }))
}

// ── Versioning actions ───────────────────────────────────────────

export async function publishWorkflow(
  workflowId: string,
  workspaceId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { user } = await verifyWorkflowAccess(workflowId, workspaceId)
    assertCan(user, 'edit_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow', entityId: workflowId })
    await db.workflow.update({ where: { id: workflowId }, data: { status: ResourceStatus.PUBLISHED, isActive: true } })
    audit({ orgId: user.orgId, workspaceId, actorUserId: user.id, action: 'workflow.publish', entityType: 'workflow', entityId: workflowId })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al publicar workflow' }
  }
}

export async function archiveWorkflow(
  workflowId: string,
  workspaceId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { user } = await verifyWorkflowAccess(workflowId, workspaceId)
    assertCan(user, 'edit_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow', entityId: workflowId })
    await db.workflow.update({ where: { id: workflowId }, data: { status: ResourceStatus.ARCHIVED, isActive: false } })
    audit({ orgId: user.orgId, workspaceId, actorUserId: user.id, action: 'workflow.archive', entityType: 'workflow', entityId: workflowId })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al archivar workflow' }
  }
}

export async function duplicateWorkflowVersion(
  workflowId: string,
  workspaceId: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const { user, workflow } = await verifyWorkflowAccess(workflowId, workspaceId)
    assertCan(user, 'create_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow' })

    const full = await db.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true, connections: true, variables: true },
    })
    if (!full) throw new Error('Workflow no encontrado')

    const newVersion = workflow.version + 1

    const newWorkflow = await db.$transaction(async (tx) => {
      const w = await tx.workflow.create({
        data: {
          workspaceId,
          name: full.name,
          description: full.description,
          createdBy: user.id,
          status: ResourceStatus.DRAFT,
          version: newVersion,
          isActive: false,
        },
      })

      // Copy nodes — build old→new ID map for connection remapping
      const nodeIdMap = new Map<string, string>()
      for (const node of full.nodes) {
        const n = await tx.workflowNode.create({
          data: {
            workflowId: w.id,
            toolDefinitionId: node.toolDefinitionId,
            label: node.label,
            positionX: node.positionX,
            positionY: node.positionY,
            inputMapping: node.inputMapping as Prisma.InputJsonValue,
            configOverride: node.configOverride as Prisma.InputJsonValue,
            isDisabled: node.isDisabled,
            executionOrder: node.executionOrder,
          },
        })
        nodeIdMap.set(node.id, n.id)
      }

      // Copy connections with remapped node IDs
      for (const conn of full.connections) {
        const src = nodeIdMap.get(conn.sourceNodeId)
        const tgt = nodeIdMap.get(conn.targetNodeId)
        if (!src || !tgt) continue
        await tx.workflowConnection.create({
          data: {
            workflowId: w.id,
            sourceNodeId: src,
            targetNodeId: tgt,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
          },
        })
      }

      // Copy variables
      for (const v of full.variables) {
        await tx.workflowVariable.create({
          data: { workflowId: w.id, key: v.key, defaultValue: v.defaultValue, description: v.description, type: v.type },
        })
      }

      return w
    })

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.version_create',
      entityType: 'workflow',
      entityId: newWorkflow.id,
      metadata: { sourceWorkflowId: workflowId, version: newVersion, name: full.name },
    })

    return { id: newWorkflow.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al duplicar versión' }
  }
}

// ── Templates ────────────────────────────────────────────────────

export async function createWorkflowFromTemplate(
  workspaceId: string,
  templateId: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const user = await requireUser()
    const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
    if (!workspace) return { error: 'Workspace no encontrado' }
    assertCan(user, 'create_workflow', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'workflow' })

    const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return { error: 'Template no encontrado' }

    // Resolve slugs → toolDefinitionIds (official tools only)
    const slugs = template.nodes.map((n) => n.slug)
    const toolDefs = await db.toolDefinition.findMany({
      where: { slug: { in: slugs }, orgId: null },
      select: { id: true, slug: true },
    })
    const slugToId = Object.fromEntries(toolDefs.map((t) => [t.slug, t.id]))

    const workflow = await db.$transaction(async (tx) => {
      const w = await tx.workflow.create({
        data: {
          workspaceId,
          name: template.name,
          description: template.description,
          createdBy: user.id,
          status: ResourceStatus.DRAFT,
        },
      })

      const nodeIds: string[] = []
      for (let i = 0; i < template.nodes.length; i++) {
        const tn = template.nodes[i]!
        const toolDefinitionId = slugToId[tn.slug]
        if (!toolDefinitionId) continue
        const node = await tx.workflowNode.create({
          data: {
            workflowId: w.id,
            toolDefinitionId,
            label: tn.label,
            positionX: tn.positionX,
            positionY: tn.positionY,
            executionOrder: i,
          },
        })
        nodeIds.push(node.id)
      }

      // Connect consecutive nodes
      for (let i = 0; i < nodeIds.length - 1; i++) {
        await tx.workflowConnection.create({
          data: {
            workflowId: w.id,
            sourceNodeId: nodeIds[i]!,
            targetNodeId: nodeIds[i + 1]!,
            sourceHandle: 'output',
            targetHandle: 'input',
          },
        })
      }

      return w
    })

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.create',
      entityType: 'workflow',
      entityId: workflow.id,
      metadata: { name: template.name, templateId },
    })

    return { id: workflow.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al crear el workflow' }
  }
}
