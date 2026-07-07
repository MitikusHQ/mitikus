import type { ParsedReport } from './types'
import { SECTION_PATTERNS } from './section-markers'
import type { SectionKey } from './section-markers'

const SECTION_MARKERS: Array<{ key: SectionKey; pattern: RegExp }> = (
  Object.entries(SECTION_PATTERNS) as Array<[SectionKey, RegExp]>
).map(([key, pattern]) => ({ key, pattern }))

/**
 * Extrae las cuatro secciones de un informe estructurado.
 * Si no se encuentran al menos 2 marcadores, hasStructure = false
 * y el campo `report` contiene el texto original completo.
 */
export function parseReport(text: string): ParsedReport {
  interface Pos { key: SectionKey; start: number; contentStart: number }

  const positions: Pos[] = []
  for (const { key, pattern } of SECTION_MARKERS) {
    const match = pattern.exec(text)
    if (match) {
      positions.push({ key, start: match.index, contentStart: match.index + match[0].length })
    }
  }

  if (positions.length < 2) {
    return { hasStructure: false, conclusion: '', action: '', why: '', report: text }
  }

  positions.sort((a, b) => a.start - b.start)

  const sections: Partial<Record<SectionKey, string>> = {}
  for (let i = 0; i < positions.length; i++) {
    const { key, contentStart } = positions[i]!
    const nextStart = positions[i + 1]?.start ?? text.length
    sections[key] = text.slice(contentStart, nextStart).trim()
  }

  return {
    hasStructure: true,
    conclusion: sections.conclusion ?? '',
    action:     sections.action     ?? '',
    why:        sections.why        ?? '',
    report:     sections.report     ?? '',
  }
}
