import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createWorkflow, saveWorkflowGraph } from '@/app/actions/workflows'
import { installToolFromRegistry } from '@/app/actions/registry'

export const runtime = 'nodejs'

interface ConfirmNode {
  toolId: string
  toolName: string
  label: string
  needsInstall: boolean
}

interface ConfirmRequest {
  workspaceId: string
  workflowName: string
  nodes: ConfirmNode[]
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const body: ConfirmRequest = await req.json().catch(() => null)
  if (!body?.workspaceId || !body?.workflowName || !body?.nodes?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { workspaceId, workflowName, nodes } = body

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  // 1. Instalar herramientas pendientes
  for (const node of nodes.filter((n) => n.needsInstall)) {
    const result = await installToolFromRegistry(node.toolId, workspaceId)
    if ('error' in result) {
      return NextResponse.json(
        { error: `No se pudo instalar "${node.toolName}": ${result.error}` },
        { status: 400 },
      )
    }
  }

  // 2. Obtener instancias
  const instances = await db.toolInstance.findMany({
    where: {
      workspaceId,
      status: 'ACTIVE',
      toolDefinitionId: { in: nodes.map((n) => n.toolId) },
    },
    select: { toolDefinitionId: true, id: true },
  })
  const instanceMap = new Map(instances.map((i) => [i.toolDefinitionId, i.id]))

  // 3. Crear workflow
  const workflowResult = await createWorkflow(workspaceId, workflowName)
  if ('error' in workflowResult) {
    return NextResponse.json({ error: workflowResult.error }, { status: 500 })
  }
  const workflowId = workflowResult.id

  // 4. Construir grafo lineal
  const SPACING_X = 250
  const BASE_Y = 200
  const ZIGZAG_Y = 350

  const graphNodes = nodes.map((n, i) => ({
    id: `ai-node-${i}`,
    toolDefinitionId: n.toolId,
    label: n.label,
    positionX: 100 + i * SPACING_X,
    positionY: nodes.length > 5 && i % 2 !== 0 ? ZIGZAG_Y : BASE_Y,
    inputMapping: {} as Record<string, string>,
    configOverride: {} as Record<string, unknown>,
    isDisabled: false,
  }))

  const graphConnections = graphNodes.slice(0, -1).map((n, i) => ({
    sourceNodeId: n.id,
    targetNodeId: graphNodes[i + 1]!.id,
    sourceHandle: 'output',
    targetHandle: 'input',
  }))

  // 5. Guardar grafo
  const saveResult = await saveWorkflowGraph(workflowId, workspaceId, {
    nodes: graphNodes,
    connections: graphConnections,
  })
  if ('error' in saveResult) {
    return NextResponse.json({ error: saveResult.error }, { status: 500 })
  }

  // instanceMap usado para referencia futura (evitar lint warning)
  void instanceMap

  return NextResponse.json({ workflowId, workspaceId })
}
