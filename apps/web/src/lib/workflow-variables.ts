// Resolución de variables y plantillas en el Workflow Engine
// Soporta: {{variables.key}}, {{nodes.nodeId.output}}, valores estáticos

export interface WorkflowContext {
  // Variables globales del workflow (rellenadas por el usuario antes de ejecutar)
  variables: Record<string, string>
  // Outputs de nodos ya ejecutados (nodeId → texto output de la IA)
  nodes: Record<string, { output: string }>
}

// Interpola una plantilla con el contexto actual
// Ejemplo: "Empresa: {{variables.empresa}}, Contexto: {{nodes.swot.output}}"
export function resolveTemplate(template: string, context: WorkflowContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
    const parts = path.trim().split('.')

    if (parts[0] === 'variables' && parts.length === 2 && parts[1]) {
      const value = context.variables[parts[1]]
      return value !== undefined ? value : match
    }

    if (parts[0] === 'nodes' && parts.length >= 3 && parts[2] === 'output' && parts[1]) {
      const nodeOutput = context.nodes[parts[1]]?.output
      return nodeOutput !== undefined ? nodeOutput : match
    }

    return match
  })
}

// Resuelve el inputMapping completo de un nodo
// inputMapping: Record<fieldId, plantilla|valor estático>
export function resolveInputMapping(
  inputMapping: Record<string, string>,
  context: WorkflowContext,
): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const [fieldId, template] of Object.entries(inputMapping)) {
    resolved[fieldId] = resolveTemplate(template, context)
  }
  return resolved
}

// Detecta qué variables de plantilla se usan en un inputMapping
export function extractTemplateRefs(
  inputMapping: Record<string, string>,
): { variables: string[]; nodeIds: string[] } {
  const variables = new Set<string>()
  const nodeIds = new Set<string>()

  for (const template of Object.values(inputMapping)) {
    const matches = template.matchAll(/\{\{([^}]+)\}\}/g)
    for (const match of matches) {
      const path = match[1]
      if (!path) continue
      const parts = path.trim().split('.')
      if (parts[0] === 'variables' && parts[1]) variables.add(parts[1])
      if (parts[0] === 'nodes' && parts[1]) nodeIds.add(parts[1])
    }
  }

  return { variables: [...variables], nodeIds: [...nodeIds] }
}

// Valida que un inputMapping es resolvible con el contexto dado
export function validateInputMapping(
  inputMapping: Record<string, string>,
  context: WorkflowContext,
): string[] {
  const errors: string[] = []
  const { variables, nodeIds } = extractTemplateRefs(inputMapping)

  for (const v of variables) {
    if (!(v in context.variables)) {
      errors.push(`Variable "{{variables.${v}}}" no está definida en el workflow.`)
    }
  }

  for (const nodeId of nodeIds) {
    if (!(nodeId in context.nodes)) {
      errors.push(`Output del nodo "{{nodes.${nodeId}.output}}" aún no disponible.`)
    }
  }

  return errors
}
