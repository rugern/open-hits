export type CategoryId =
  | 'artist'
  | 'title'
  | 'year-exact'
  | 'year-plusminus'
  | 'decade'
  | 'country'
  | 'placement'

export interface WheelCategory {
  id: CategoryId
  label: string
  short: string
  color: string
}

export const WHEEL_CATEGORIES: readonly WheelCategory[] = [
  { id: 'artist', label: 'Artist', short: 'Artist', color: '#fbbf24' },
  { id: 'title', label: 'Song title', short: 'Title', color: '#10b981' },
  { id: 'year-exact', label: 'Exact year', short: 'Year', color: '#f472b6' },
  { id: 'year-plusminus', label: 'Year ±3', short: '±3 yr', color: '#3b82f6' },
  { id: 'decade', label: 'Decade', short: 'Decade', color: '#a78bfa' },
] as const

export function pickCategoryIndex(count: number = WHEEL_CATEGORIES.length): number {
  return Math.floor(Math.random() * count)
}

export function pickSpinDurationMs(): number {
  // Uniform [5000, 11000]
  return 5000 + Math.floor(Math.random() * 6001)
}
