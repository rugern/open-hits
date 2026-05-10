import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CategoryId } from '../game/wheel'
import { WHEEL_CATEGORIES } from '../game/wheel'
import { shuffle } from '../game/shuffle'
import { useWakeLock } from '../game/useWakeLock'

const STORAGE_KEY = 'open-hits.bingo'
const BOARD_SIZE = 25
const CELLS_PER_CATEGORY = 5

interface PersistedState {
  board: CategoryId[]
  ticks: boolean[]
  guess: string
}

function makeShuffledBoard(): CategoryId[] {
  const cells: CategoryId[] = []
  for (const cat of WHEEL_CATEGORIES) {
    for (let i = 0; i < CELLS_PER_CATEGORY; i++) cells.push(cat.id)
  }
  return shuffle(cells)
}

function freshState(): PersistedState {
  return {
    board: makeShuffledBoard(),
    ticks: new Array<boolean>(BOARD_SIZE).fill(false),
    guess: '',
  }
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (
      Array.isArray(parsed.board) &&
      parsed.board.length === BOARD_SIZE &&
      Array.isArray(parsed.ticks) &&
      parsed.ticks.length === BOARD_SIZE &&
      typeof parsed.guess === 'string'
    ) {
      return {
        board: parsed.board as CategoryId[],
        ticks: parsed.ticks as boolean[],
        guess: parsed.guess,
      }
    }
  } catch {
    // Malformed JSON or storage unavailable — fall through to fresh state.
  }
  return freshState()
}

export function BingoCard() {
  const [state, setState] = useState(loadState)
  const [isLandscape, setIsLandscape] = useState(() =>
    window.matchMedia('(orientation: landscape)').matches,
  )
  useWakeLock()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private mode / quota — silent.
    }
  }, [state])

  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')
    const onChange = () => setIsLandscape(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  if (isLandscape) {
    return <BigGuess guess={state.guess} />
  }

  const toggleTick = (idx: number) => {
    setState((prev) => {
      const next = prev.ticks.slice()
      next[idx] = !next[idx]
      return { ...prev, ticks: next }
    })
  }

  const newCard = () => {
    setState((prev) => ({
      board: makeShuffledBoard(),
      ticks: new Array<boolean>(BOARD_SIZE).fill(false),
      guess: prev.guess,
    }))
  }

  const setGuess = (guess: string) => {
    setState((prev) => ({ ...prev, guess }))
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wide text-slate-400">
          Your card
        </h2>
        <button
          type="button"
          onClick={newCard}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          New card
        </button>
      </div>

      <div className="rounded-md bg-white p-1.5">
        <div className="grid grid-cols-5 gap-1">
          {state.board.map((catId, idx) => (
            <BingoCell
              key={idx}
              categoryId={catId}
              ticked={state.ticks[idx] ?? false}
              onClick={() => toggleTick(idx)}
            />
          ))}
        </div>
      </div>

      <GuessInput value={state.guess} onChange={setGuess} />
      <p className="text-center text-xs text-slate-500">
        Flip your phone horizontally to show your guess
      </p>
    </div>
  )
}

function BingoCell({
  categoryId,
  ticked,
  onClick,
}: {
  categoryId: CategoryId
  ticked: boolean
  onClick: () => void
}) {
  const cat = WHEEL_CATEGORIES.find((c) => c.id === categoryId)
  const color = cat?.color ?? '#10b981'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ticked}
      className="relative flex aspect-square items-center justify-center rounded-md transition active:brightness-90"
      style={{
        backgroundColor: color,
        opacity: ticked ? 0.5 : 1,
      }}
    >
      {ticked && (
        <span
          aria-hidden
          className="text-3xl font-bold leading-none text-white drop-shadow-md"
        >
          ✓
        </span>
      )}
    </button>
  )
}

function GuessInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your guess..."
        className="w-full rounded-full border border-slate-700 bg-slate-900/60 px-4 py-3 pr-10 text-base text-slate-100 placeholder:text-slate-500 transition focus:border-emerald-500 focus:outline-none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear guess"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
        >
          ×
        </button>
      )}
    </div>
  )
}

function BigGuess({ guess }: { guess: string }) {
  const trimmed = guess.trim()
  const isPlaceholder = trimmed.length === 0
  const text = isPlaceholder ? '(no guess)' : trimmed
  const textRef = useRef<SVGTextElement>(null)
  const [bbox, setBbox] = useState({ width: 100, height: 30 })

  // SVG viewBox auto-fits to the rendered text bbox: short text fills the
  // screen big, long text scales down to fit. preserveAspectRatio keeps
  // glyph proportions intact (no stretching).
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    const b = el.getBBox()
    setBbox({ width: Math.max(b.width, 1), height: Math.max(b.height, 1) })
  }, [text])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6">
      <svg
        viewBox={`0 0 ${bbox.width} ${bbox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        <text
          ref={textRef}
          x={bbox.width / 2}
          y={bbox.height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={28}
          fontWeight={isPlaceholder ? 400 : 700}
          fontStyle={isPlaceholder ? 'italic' : 'normal'}
          fill={isPlaceholder ? '#64748b' : '#f8fafc'}
        >
          {text}
        </text>
      </svg>
    </div>
  )
}
