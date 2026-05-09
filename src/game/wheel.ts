export type CategoryId = 'artist' | 'title' | 'year-exact' | 'year-plusminus' | 'decade'

export interface WheelCategory {
  id: CategoryId
  label: string
  short: string
  color: string
}

export const WHEEL_CATEGORIES: readonly WheelCategory[] = [
  { id: 'artist', label: 'Artist', short: 'Artist', color: '#10b981' },
  { id: 'title', label: 'Song title', short: 'Title', color: '#06b6d4' },
  { id: 'year-exact', label: 'Exact year', short: 'Year', color: '#a78bfa' },
  { id: 'year-plusminus', label: 'Year ±3', short: '±3 yr', color: '#f472b6' },
  { id: 'decade', label: 'Decade', short: 'Decade', color: '#fbbf24' },
] as const

export function pickCategoryIndex(): number {
  return Math.floor(Math.random() * WHEEL_CATEGORIES.length)
}

export function pickSpinDurationMs(): number {
  // Uniform [5000, 9000]
  return 5000 + Math.floor(Math.random() * 4001)
}
