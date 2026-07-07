import type { ValidatedToolSchema, CapabilityType } from '@protools/schema'

interface Tab {
  type: CapabilityType
  label: string
  href: string
}

const RELEVANT_TYPES: CapabilityType[] = ['TABLE', 'FORM', 'CHECKLIST', 'SCORING']

export function buildCapabilityTabs(
  schema: ValidatedToolSchema,
  workspaceId: string,
  instanceId: string,
): Tab[] {
  const base = `/workspace/${workspaceId}/tools/${instanceId}`

  return schema.capabilities
    .filter((c) => RELEVANT_TYPES.includes(c.type))
    .map((cap) => {
      let href = base
      if (cap.type === 'FORM') href = `${base}/records/new`
      else if (cap.type === 'CHECKLIST') href = `${base}/checklist/new`
      else if (cap.type === 'SCORING') href = `${base}/scoring/new`

      return { type: cap.type, label: cap.label, href }
    })
}
