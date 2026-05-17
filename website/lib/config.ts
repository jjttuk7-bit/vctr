// Vctr brand config — synced with config.yaml SSOT

export const SITE_NAME    = 'Vctr'
export const SITE_SLOGAN  = 'Find your vector.'
export const SITE_DESC    = 'Precision AI & SaaS tool reviews for global builders.'

export const MVP_CATEGORIES = [
  'AI Writing', 'AI Image', 'Productivity', 'Dev Tools', 'No-Code', 'Marketing',
] as const

export type Category = typeof MVP_CATEGORIES[number] | string

export interface CategoryColor {
  bg: string; text: string; badgeBg: string; badgeText: string
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'AI Writing':   { bg: '#6366F1', text: '#fff', badgeBg: '#EEF2FF', badgeText: '#4338CA' },
  'AI Image':     { bg: '#EC4899', text: '#fff', badgeBg: '#FDF2F8', badgeText: '#BE185D' },
  'Productivity': { bg: '#10B981', text: '#fff', badgeBg: '#ECFDF5', badgeText: '#065F46' },
  'Dev Tools':    { bg: '#F59E0B', text: '#fff', badgeBg: '#FFFBEB', badgeText: '#92400E' },
  'No-Code':      { bg: '#3B82F6', text: '#fff', badgeBg: '#EFF6FF', badgeText: '#1D4ED8' },
  'Marketing':    { bg: '#EF4444', text: '#fff', badgeBg: '#FEF2F2', badgeText: '#991B1B' },
}

export function getCatColor(category: string): CategoryColor {
  return CATEGORY_COLORS[category] ?? { bg: '#6366F1', text: '#fff', badgeBg: '#EEF2FF', badgeText: '#4338CA' }
}

// "AI Writing" ↔ "ai-writing"  |  "Dev Tools" ↔ "dev-tools"
export const catToSlug  = (c: string) => c.toLowerCase().replace(/\s+/g, '-')
export const slugToCat  = (s: string) =>
  MVP_CATEGORIES.find(c => c.toLowerCase().replace(/\s+/g, '-') === s) ?? s

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

export function readTime(body: string | null): number {
  if (!body) return 2
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
}

export function parseTags(json: string | null): string[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}
