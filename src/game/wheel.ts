export type CategoryId = 'artist' | 'title' | 'year-exact' | 'year-plusminus' | 'decade'

export interface WheelCategory {
  id: CategoryId
  label: string
  short: string
}

export const WHEEL_CATEGORIES: readonly WheelCategory[] = [
  { id: 'artist', label: 'Artist', short: 'Artist' },
  { id: 'title', label: 'Song title', short: 'Title' },
  { id: 'year-exact', label: 'Exact year', short: 'Year' },
  { id: 'year-plusminus', label: 'Year ±3', short: '±3 yr' },
  { id: 'decade', label: 'Decade', short: 'Decade' },
] as const

export function pickCategoryIndex(): number {
  return Math.floor(Math.random() * WHEEL_CATEGORIES.length)
}

export function pickSpinDurationMs(): number {
  // Uniform [5000, 9000]
  return 5000 + Math.floor(Math.random() * 4001)
}
