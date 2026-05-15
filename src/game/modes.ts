import type { WheelCategory } from './wheel'

export type GameModeId = 'default' | 'eurovision'

export interface GameMode {
  id: GameModeId
  label: string
  categories: readonly WheelCategory[]
}

// Colors mirror the default set so the bingo card on /join (which looks up
// colors from the default WHEEL_CATEGORIES) stays in sync with the host wheel.
const DEFAULT_CATEGORIES: readonly WheelCategory[] = [
  { id: 'artist', label: 'Artist', short: 'Artist', color: '#fbbf24' },
  { id: 'title', label: 'Song title', short: 'Title', color: '#10b981' },
  { id: 'year-exact', label: 'Exact year', short: 'Year', color: '#f472b6' },
  { id: 'year-plusminus', label: 'Year ±3', short: '±3 yr', color: '#3b82f6' },
  { id: 'decade', label: 'Decade', short: 'Decade', color: '#a78bfa' },
]

const EUROVISION_CATEGORIES: readonly WheelCategory[] = [
  { id: 'artist', label: 'Artist', short: 'Artist', color: '#fbbf24' },
  { id: 'title', label: 'Song title', short: 'Title', color: '#10b981' },
  { id: 'year-exact', label: 'Eurovision year', short: 'Year', color: '#f472b6' },
  { id: 'country', label: 'Country', short: 'Country', color: '#3b82f6' },
  { id: 'placement', label: 'Placement', short: 'Place', color: '#a78bfa' },
]

export const GAME_MODES: readonly GameMode[] = [
  { id: 'default', label: 'Default', categories: DEFAULT_CATEGORIES },
  { id: 'eurovision', label: 'Eurovision', categories: EUROVISION_CATEGORIES },
]

export function getGameMode(id: GameModeId): GameMode {
  return GAME_MODES.find((m) => m.id === id) ?? GAME_MODES[0]
}
