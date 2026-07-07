// Algoritmos de grafos para el Workflow Engine
// DAG: Directed Acyclic Graph — validación, ordenamiento topológico, detección de ciclos

export interface GraphNode {
  id: string
}

export interface GraphEdge {
  sourceNodeId: string
  targetNodeId: string
}

// Construye mapa de adyacencia (id → [ids de nodos siguientes])
export function buildAdjacencyMap(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const node of nodes) map.set(node.id, [])
  for (const edge of edges) {
    const children = map.get(edge.sourceNodeId)
    if (children) children.push(edge.targetNodeId)
  }
  return map
}

// Detección de ciclos usando DFS
// Retorna true si el grafo tiene al menos un ciclo
export function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const adj = buildAdjacencyMap(nodes, edges)
  const visited = new Set<string>()
  const stack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    stack.add(nodeId)
    for (const neighbor of adj.get(nodeId) ?? []) {
      if (!visited.has(neighbor) && dfs(neighbor)) return true
      if (stack.has(neighbor)) return true
    }
    stack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true
  }
  return false
}

// Ordenamiento topológico (Kahn's algorithm — BFS)
// Retorna los nodos en orden de ejecución (primero los que no tienen dependencias)
export function topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const adj = buildAdjacencyMap(nodes, edges)

  // in-degree: cuántas aristas entran a cada nodo
  const inDegree = new Map<string, number>()
  for (const node of nodes) inDegree.set(node.id, 0)
  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) ?? 0) + 1)
  }

  // Queue: nodos con in-degree 0 (sin dependencias)
  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const order: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    order.push(nodeId)
    for (const neighbor of adj.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  return order
}

// Encuentra nodos raíz (sin aristas entrantes)
export function findRootNodes(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const targets = new Set(edges.map((e) => e.targetNodeId))
  return nodes.filter((n) => !targets.has(n.id)).map((n) => n.id)
}

// Encuentra nodos hoja (sin aristas salientes)
export function findLeafNodes(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const sources = new Set(edges.map((e) => e.sourceNodeId))
  return nodes.filter((n) => !sources.has(n.id)).map((n) => n.id)
}

// Valida que el grafo es ejecutable
export interface GraphValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphValidationResult {
  const errors: string[] = []

  if (nodes.length === 0) {
    errors.push('El workflow debe tener al menos un nodo.')
  }

  if (hasCycle(nodes, edges)) {
    errors.push('El workflow contiene ciclos. Los workflows deben ser DAGs (sin ciclos).')
  }

  // Verificar que todas las aristas referencian nodos existentes
  const nodeIds = new Set(nodes.map((n) => n.id))
  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId)) {
      errors.push(`Arista con sourceNodeId "${edge.sourceNodeId}" no existe.`)
    }
    if (!nodeIds.has(edge.targetNodeId)) {
      errors.push(`Arista con targetNodeId "${edge.targetNodeId}" no existe.`)
    }
  }

  return { isValid: errors.length === 0, errors }
}
