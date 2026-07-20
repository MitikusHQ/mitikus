'use client'

import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { AIWorkflowModal } from '../../_components/AIWorkflowModal'
import { WorkflowNodeComponent, type WorkflowNodeData, type WorkflowNode as WFNode } from './WorkflowNodeComponent'
import { WorkflowSidebar } from './WorkflowSidebar'
import { WorkflowToolbar } from './WorkflowToolbar'
import { WorkflowInspector } from './WorkflowInspector'
import { WorkflowRunner } from './WorkflowRunner'
import type { WorkflowDetail, WorkflowVariableData, ToolPaletteItem } from '@/app/actions/workflows'
import { saveWorkflowGraph, publishWorkflow, archiveWorkflow } from '@/app/actions/workflows'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type RunState = 'idle' | 'running' | 'done' | 'error'

type FlowNode = WFNode

// Cast needed: React Flow's NodeTypes uses a generic base type; our typed component is compatible at runtime
const NODE_TYPES: NodeTypes = { workflowTool: WorkflowNodeComponent as NodeTypes[string] }

// ── Helpers ──────────────────────────────────────────────────────

function workflowNodeToFlowNode(n: WorkflowDetail['nodes'][number]): FlowNode {
  return {
    id: n.id,
    type: 'workflowTool',
    position: { x: n.positionX, y: n.positionY },
    data: {
      workflowNodeId: n.id,
      toolDefinitionId: n.toolDefinitionId,
      toolName: n.toolName,
      toolDescription: n.toolDescription,
      toolCategory: n.toolCategory,
      toolIcon: n.toolIcon,
      label: n.label,
      isDisabled: n.isDisabled,
      inputMapping: n.inputMapping,
      configOverride: n.configOverride,
      executionStatus: 'IDLE',
    },
  }
}

function workflowConnectionToEdge(c: WorkflowDetail['connections'][number]): Edge {
  return {
    id: c.id,
    source: c.sourceNodeId,
    target: c.targetNodeId,
    sourceHandle: c.sourceHandle ?? 'output',
    targetHandle: c.targetHandle ?? 'input',
    type: 'smoothstep',
    style: { strokeWidth: 2 },
  }
}

// ── Editor ───────────────────────────────────────────────────────

interface Props {
  workflow: WorkflowDetail
  workspaceName: string
  tools: ToolPaletteItem[]
}

export function WorkflowEditor({ workflow, workspaceName, tools }: Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const draggedTool = useRef<ToolPaletteItem | null>(null)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(
    workflow.nodes.map(workflowNodeToFlowNode),
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    workflow.connections.map(workflowConnectionToEdge),
  )

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [runState, setRunState] = useState<RunState>('idle')
  const [runResult, setRunResult] = useState<Parameters<typeof WorkflowRunner>[0]['result']>(null)
  const [rightPanel, setRightPanel] = useState<'inspector' | 'run'>('inspector')
  const [variables] = useState<WorkflowVariableData[]>(workflow.variables)
  const [workflowStatus, setWorkflowStatus] = useState<string>(workflow.status)
  const [workflowVersion] = useState<number>(workflow.version)

  // ── Canvas events ────────────────────────────────────────────

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge({ ...connection, type: 'smoothstep', style: { strokeWidth: 2 } }, eds),
      ),
    [setEdges],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setSelectedNodeId(node.id)
    setRightPanel('inspector')
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  // ── Drag-and-drop from sidebar ───────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const tool = draggedTool.current
      if (!tool) return

      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const newId = `new-${Date.now()}`
      const newNode: FlowNode = {
        id: newId,
        type: 'workflowTool',
        position: pos,
        data: {
          workflowNodeId: newId,
          toolDefinitionId: tool.id,
          toolName: tool.name,
          toolDescription: tool.description,
          toolCategory: tool.category,
          toolIcon: tool.icon,
          label: tool.name,
          isDisabled: false,
          inputMapping: {},
          configOverride: {},
          executionStatus: 'IDLE',
        },
      }
      setNodes((nds) => [...nds, newNode])
      draggedTool.current = null
    },
    [screenToFlowPosition, setNodes],
  )

  // ── Inspector callbacks ──────────────────────────────────────

  const updateNodeData = useCallback(
    (nodeId: string, updater: (data: WorkflowNodeData) => Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updater(n.data) } } : n)),
      )
    },
    [setNodes],
  )

  const handleUpdateLabel = useCallback(
    (nodeId: string, label: string) => updateNodeData(nodeId, () => ({ label })),
    [updateNodeData],
  )
  const handleUpdateInputMapping = useCallback(
    (nodeId: string, mapping: Record<string, string>) =>
      updateNodeData(nodeId, () => ({ inputMapping: mapping })),
    [updateNodeData],
  )
  const handleToggleDisabled = useCallback(
    (nodeId: string, isDisabled: boolean) => updateNodeData(nodeId, () => ({ isDisabled })),
    [updateNodeData],
  )
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedNodeId === nodeId) setSelectedNodeId(null)
    },
    [setNodes, setEdges, selectedNodeId],
  )

  // ── Save ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    const graphNodes = nodes.map((n) => ({
      id: n.id,
      toolDefinitionId: n.data.toolDefinitionId,
      label: n.data.label,
      positionX: n.position.x,
      positionY: n.position.y,
      inputMapping: (n.data.inputMapping ?? {}) as Record<string, string>,
      configOverride: (n.data.configOverride ?? {}) as Record<string, unknown>,
      isDisabled: n.data.isDisabled,
    }))
    const graphConnections = edges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      sourceHandle: e.sourceHandle ?? 'output',
      targetHandle: e.targetHandle ?? 'input',
    }))

    const result = await saveWorkflowGraph(workflow.id, workflow.workspaceId, {
      nodes: graphNodes,
      connections: graphConnections,
    })

    if ('error' in result) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
      return
    }

    // Update node IDs with the server-assigned real IDs
    if ('nodeIdMap' in result && result.nodeIdMap) {
      const idMap = result.nodeIdMap
      setNodes((nds) =>
        nds.map((n) => {
          const realId = idMap[n.id]
          if (!realId || realId === n.id) return n
          return { ...n, id: realId, data: { ...n.data, workflowNodeId: realId } }
        }),
      )
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          source: idMap[e.source] ?? e.source,
          target: idMap[e.target] ?? e.target,
        })),
      )
    }

    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2500)
  }, [nodes, edges, workflow.id, workflow.workspaceId, setNodes, setEdges])

  // ── Publish / Archive ────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    const result = await publishWorkflow(workflow.id, workflow.workspaceId)
    if (!('error' in result)) setWorkflowStatus('PUBLISHED')
  }, [workflow.id, workflow.workspaceId])

  const handleArchive = useCallback(async () => {
    const result = await archiveWorkflow(workflow.id, workflow.workspaceId)
    if (!('error' in result)) setWorkflowStatus('ARCHIVED')
  }, [workflow.id, workflow.workspaceId])

  // ── Derived: selected node ───────────────────────────────────

  const selectedNode = selectedNodeId
    ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
    : null

  const isEmpty = nodes.length === 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <WorkflowToolbar
        workspaceName={workspaceName}
        workspaceId={workflow.workspaceId}
        workflowName={workflow.name}
        workflowStatus={workflowStatus}
        workflowVersion={workflowVersion}
        saveState={saveState}
        runState={runState}
        onSave={handleSave}
        onRun={() => setRightPanel('run')}
        onPublish={workflowStatus === 'DRAFT' ? handlePublish : null}
        onArchive={workflowStatus === 'PUBLISHED' ? handleArchive : null}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView({ padding: 0.1 })}
      />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — tool palette */}
        <WorkflowSidebar
          tools={tools}
          onDragStart={(tool) => {
            draggedTool.current = tool
          }}
        />

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="relative flex-1 bg-muted/20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              className="!bg-muted/20 opacity-60"
            />
          </ReactFlow>

          {isEmpty && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card/90 backdrop-blur-sm p-8 flex flex-col items-center text-center gap-4 max-w-sm pointer-events-auto">
                <div className="text-4xl">✨</div>
                <div>
                  <h3 className="text-base font-semibold">Canvas vacío</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Arrastra herramientas desde el panel izquierdo, o deja que la IA monte el workflow por ti.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <AIWorkflowModal
                    workspaceId={workflow.workspaceId}
                    trigger={
                      <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                        ✨ Generar
                      </button>
                    }
                  />
                  <p className="text-xs text-muted-foreground">o arrastra una herramienta para empezar</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — Inspector / Run */}
        <div className="w-72 shrink-0 border-l bg-card flex flex-col h-full">
          {/* Tab header */}
          <div className="flex border-b">
            {(['inspector', 'run'] as const).map((panel) => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  rightPanel === panel
                    ? 'bg-background border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {panel === 'inspector' ? '⚙ Inspector' : '▶ Ejecutar'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanel === 'inspector' ? (
              <WorkflowInspector
                selectedNode={selectedNode ? { id: selectedNode.id, data: selectedNode.data } : null}
                variables={variables}
                onUpdateLabel={handleUpdateLabel}
                onUpdateInputMapping={handleUpdateInputMapping}
                onToggleDisabled={handleToggleDisabled}
                onDelete={handleDeleteNode}
              />
            ) : (
              <div className="p-4">
                <WorkflowRunner
                  workspaceId={workflow.workspaceId}
                  workflowId={workflow.id}
                  variables={variables}
                  runState={runState}
                  result={runResult}
                  onRunStateChange={setRunState}
                  onResultChange={setRunResult}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
