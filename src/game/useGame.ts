import { useReducer } from 'react'
import type { GameTrack } from '../spotify/api'
import { shuffle } from './shuffle'
import { pickCategoryIndex, pickSpinDurationMs } from './wheel'

export type GameState =
  | { kind: 'ready' }
  | { kind: 'spinning'; categoryIndex: number; durationMs: number }
  | { kind: 'playing'; categoryIndex: number; track: GameTrack }
  | { kind: 'revealing'; categoryIndex: number; track: GameTrack }
  | { kind: 'done' }

interface InternalState {
  tracks: GameTrack[]
  index: number
  game: GameState
}

type Action =
  | { type: 'start' }
  | { type: 'spin_complete' }
  | { type: 'reveal' }
  | { type: 'continue' }
  | { type: 'restart'; freshTracks: GameTrack[] }

function reducer(s: InternalState, action: Action): InternalState {
  switch (action.type) {
    case 'start': {
      if (s.game.kind !== 'ready') return s
      return {
        ...s,
        game: {
          kind: 'spinning',
          categoryIndex: pickCategoryIndex(),
          durationMs: pickSpinDurationMs(),
        },
      }
    }
    case 'spin_complete': {
      if (s.game.kind !== 'spinning') return s
      const track = s.tracks[s.index]
      if (!track) return { ...s, game: { kind: 'done' } }
      return {
        ...s,
        game: { kind: 'playing', categoryIndex: s.game.categoryIndex, track },
      }
    }
    case 'reveal': {
      if (s.game.kind !== 'playing') return s
      return {
        ...s,
        game: {
          kind: 'revealing',
          categoryIndex: s.game.categoryIndex,
          track: s.game.track,
        },
      }
    }
    case 'continue': {
      if (s.game.kind !== 'revealing') return s
      const nextIndex = s.index + 1
      if (nextIndex >= s.tracks.length) {
        return { ...s, index: nextIndex, game: { kind: 'done' } }
      }
      return {
        ...s,
        index: nextIndex,
        game: {
          kind: 'spinning',
          categoryIndex: pickCategoryIndex(),
          durationMs: pickSpinDurationMs(),
        },
      }
    }
    case 'restart': {
      return {
        tracks: action.freshTracks,
        index: 0,
        game: { kind: 'ready' },
      }
    }
  }
}

export interface UseGame {
  state: GameState
  totalTracks: number
  roundNumber: number
  startGame: () => void
  onSpinComplete: () => void
  reveal: () => void
  continueRound: () => void
  restart: () => void
}

export function useGame(initialTracks: GameTrack[]): UseGame {
  const [s, dispatch] = useReducer(
    reducer,
    initialTracks,
    (init): InternalState => ({
      tracks: shuffle(init),
      index: 0,
      game: { kind: 'ready' },
    }),
  )

  return {
    state: s.game,
    totalTracks: s.tracks.length,
    roundNumber: s.index + 1,
    startGame: () => dispatch({ type: 'start' }),
    onSpinComplete: () => dispatch({ type: 'spin_complete' }),
    reveal: () => dispatch({ type: 'reveal' }),
    continueRound: () => dispatch({ type: 'continue' }),
    restart: () =>
      dispatch({ type: 'restart', freshTracks: shuffle(initialTracks) }),
  }
}
