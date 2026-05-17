// 참조: BRANDING.md 3절 / 4절 / config.yaml SSOT

export const SITE_NAME    = 'KNow'
export const SITE_SLOGAN  = 'KNow Korea, before anyone else.'
export const SITE_DESC    = 'Your daily dose of K-beauty, K-drama, K-pop, K-food, K-fashion and more.'

export const MVP_CATEGORIES = [
  'K-Beauty', 'K-Drama', 'K-Pop', 'K-Food', 'K-Fashion', 'K-Lifestyle',
] as const

export type Category = typeof MVP_CATEGORIES[number] | string

export interface CategoryColor {
  bg: string; text: string; badgeBg: string; badgeText: string
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'K-Beauty':        { bg: '#D4537E', text: '#fff', badgeBg: '#FBEAF0', badgeText: '#993556' },
  'K-Drama':         { bg: '#7F77DD', text: '#fff', badgeBg: '#EEEDFE', badgeText: '#534AB7' },
  'K-Pop':           { bg: '#D85A30', text: '#fff', badgeBg: '#FAECE7', badgeText: '#993C1D' },
  'K-Food':          { bg: '#BA7517', text: '#fff', badgeBg: '#FAEEDA', badgeText: '#854F0B' },
  'K-Fashion':       { bg: '#444441', text: '#fff', badgeBg: '#F1EFE8', badgeText: '#5F5E5A' },
  'K-Lifestyle':     { bg: '#1D9E75', text: '#fff', badgeBg: '#E1F5EE', badgeText: '#0F6E56' },
  'K-Travel':        { bg: '#378ADD', text: '#fff', badgeBg: '#E6F1FB', badgeText: '#185FA5' },
  'K-Sport':         { bg: '#639922', text: '#fff', badgeBg: '#EAF3DE', badgeText: '#3B6D11' },
  'K-Entertainment': { bg: '#E24B4A', text: '#fff', badgeBg: '#FCEBEB', badgeText: '#A32D2D' },
}

export function getCatColor(category: string): CategoryColor {
  return CATEGORY_COLORS[category] ?? { bg: '#C0392B', text: '#fff', badgeBg: '#FAE5E3', badgeText: '#C0392B' }
}

// "K-Beauty" ↔ "k-beauty"
export const catToSlug = (c: string) => c.toLowerCase()
export const slugToCat = (s: string) =>
  MVP_CATEGORIES.find(c => c.toLowerCase() === s) ?? s

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
