/**
 * FUENTE ÚNICA DE VERDAD para los marcadores de sección del sistema de informes MITIKUS.
 *
 * Cualquier cambio en los headings (texto, emoji, orden) debe hacerse EXCLUSIVAMENTE aquí.
 * No modificar cadenas de heading directamente en parse-report.ts, detect-type.ts
 * ni en execution-prompts.ts — todos importan desde este archivo.
 *
 * Un cambio aquí se propaga automáticamente al parser y al prompt de la IA.
 */

export const SECTION_HEADINGS = {
  conclusion: '## 🎯 CONCLUSIÓN EJECUTIVA',
  action:     '## ⚡ ACCIÓN RECOMENDADA',
  why:        '## 📌 ¿POR QUÉ?',
  report:     '## 📄 INFORME COMPLETO',
} as const

export type SectionKey = keyof typeof SECTION_HEADINGS

function headingToPattern(heading: string): RegExp {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}[ \\t]*$`, 'm')
}

/** Patrones regex derivados de los headings — nunca definirlos manualmente. */
export const SECTION_PATTERNS: Record<SectionKey, RegExp> = {
  conclusion: headingToPattern(SECTION_HEADINGS.conclusion),
  action:     headingToPattern(SECTION_HEADINGS.action),
  why:        headingToPattern(SECTION_HEADINGS.why),
  report:     headingToPattern(SECTION_HEADINGS.report),
}
