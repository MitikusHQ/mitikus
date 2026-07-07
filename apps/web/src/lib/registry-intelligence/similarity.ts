const STOP_WORDS = new Set([
  // Spanish
  'de', 'la', 'el', 'en', 'y', 'a', 'un', 'una', 'para', 'con', 'los', 'las',
  'del', 'al', 'por', 'se', 'que', 'es', 'su', 'sus', 'le', 'les', 'nos', 'lo',
  'las', 'me', 'mi', 'te', 'tu', 'nos', 'os', 'si', 'no', 'ya', 'muy', 'mas',
  'pero', 'como', 'cuando', 'donde', 'cual', 'que', 'quien',
  // English
  'the', 'a', 'an', 'for', 'with', 'to', 'and', 'or', 'in', 'on', 'at',
  'is', 'are', 'of', 'this', 'that', 'it', 'its', 'be', 'by', 'as', 'from',
  'we', 'our', 'my', 'your', 'their', 'not', 'but', 'if', 'so', 'do',
])

export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w)),
  )
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  const intersection = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return intersection / union
}

export function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  const intersection = [...a].filter(x => b.has(x)).length
  return intersection / Math.min(a.size, b.size)
}
