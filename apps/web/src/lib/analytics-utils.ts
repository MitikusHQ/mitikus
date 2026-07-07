export type Range = '7d' | '30d' | '90d' | 'all'

export function parseRange(raw: string | undefined): Range {
  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === 'all') return raw
  return '30d'
}
