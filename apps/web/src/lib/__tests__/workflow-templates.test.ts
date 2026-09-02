import { describe, expect, it } from 'vitest'
import { allOfficialTools } from '@/registry/official'
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'

const officialSlugs = new Set(allOfficialTools.map((tool) => tool.schema.slug))

describe('WORKFLOW_TEMPLATES', () => {
  it('uses unique template ids', () => {
    const ids = WORKFLOW_TEMPLATES.map((template) => template.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('defines actionable templates', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      expect(template.name.trim().length).toBeGreaterThan(0)
      expect(template.description.trim().length).toBeGreaterThan(0)
      expect(template.category.trim().length).toBeGreaterThan(0)
      expect(template.estimatedMinutes).toBeGreaterThan(0)
      expect(template.nodes.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('references existing official tools', () => {
    const missingSlugs = WORKFLOW_TEMPLATES.flatMap((template) =>
      template.nodes
        .map((node) => node.slug)
        .filter((slug) => !officialSlugs.has(slug))
        .map((slug) => `${template.id}:${slug}`),
    )

    expect(missingSlugs).toEqual([])
  })
})
