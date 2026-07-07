/** Genera un UUID estable para herramientas oficiales — determinista por índice */
export function oid(n: number): string {
  const hex = n.toString(16).padStart(12, '0')
  return `a0000000-0000-4000-8000-${hex}`
}
