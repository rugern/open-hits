import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useSpotifyAuth } from './spotify/useSpotifyAuth'
import { usePlaylists } from './spotify/usePlaylists'
import type { SpotifyPlaylist } from './spotify/api'
import { GameView } from './components/GameView'
import { HostBingoOverlay } from './components/HostBingoOverlay'
import { JoinView } from './components/JoinView'
import { RulesView } from './components/RulesView'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/host" element={<HostRoute />} />
        <Route path="/join" element={<JoinView />} />
        <Route path="/rules" element={<RulesView />} />
      </Routes>
    </div>
  )
}

function LandingRoute() {
  const auth = useSpotifyAuth()
  const navigate = useNavigate()
  // Captured at mount, before the auth handler strips the URL params.
  const [hadCallback] = useState(
    () =>
      window.location.search.includes('code=') ||
      window.location.search.includes('error='),
  )
  // Lets the user dismiss a sign-in failure and see the regular hero. Reset
  // implicitly via the page reload that startLogin() triggers on the next
  // attempt.
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    if (hadCallback && auth.status === 'authenticated') {
      navigate('/host', { replace: true })
    }
  }, [auth.status, hadCallback, navigate])

  if (
    hadCallback &&
    (auth.status === 'loading' || auth.status === 'authenticated')
  ) {
    return <CenteredMessage text="Signing in…" />
  }

  const onStartHost = () => {
    if (auth.status === 'authenticated') navigate('/host')
    else auth.login()
  }

  const displayedStatus =
    auth.status === 'error' && errorDismissed ? 'idle' : auth.status

  return (
    <CenteredHero
      status={displayedStatus}
      error={auth.error}
      onStartHost={onStartHost}
      onDismissError={() => setErrorDismissed(true)}
    />
  )
}

function HostRoute() {
  const auth = useSpotifyAuth()
  const navigate = useNavigate()

  // Hosting requires auth. Anything other than authenticated bounces back to
  // the landing page; login flows are initiated from there. Also covers the
  // sign-out transition (status flips to idle, user is sent home).
  useEffect(() => {
    if (auth.status === 'idle' || auth.status === 'error') {
      navigate('/', { replace: true })
    }
  }, [auth.status, navigate])

  if (auth.status === 'authenticated' && auth.user) {
    return <SignedInView onLogout={auth.logout} />
  }
  return <CenteredMessage text="Loading…" />
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-slate-400">{text}</p>
    </main>
  )
}

function CenteredHero({
  status,
  error,
  onStartHost,
  onDismissError,
}: {
  status: 'loading' | 'idle' | 'error' | 'authenticated'
  error: string | null
  onStartHost: () => void
  onDismissError: () => void
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
        Open <span className="text-emerald-400">Hits</span>
      </h1>

      {status === 'loading' && <p className="mt-10 text-slate-400">Loading…</p>}

      {(status === 'idle' || status === 'authenticated') && (
        <LandingPitch onStartHost={onStartHost} />
      )}

      {status === 'error' && (
        <>
          <p className="mt-8 max-w-md text-rose-300">
            Sign-in failed{error ? `: ${error}` : ''}.
          </p>
          <p className="mt-4 max-w-md text-sm text-slate-300">
            To host a game, your Spotify account has to be added as a test
            user on this app's Spotify dashboard. If you weren't expecting
            to be on the list, ask whoever runs this deployment to add you —
            or fork the repo and run your own (see the README).
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartHost}
              className="rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onDismissError}
              className="rounded-full border border-slate-700 px-8 py-3 font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Back to landing
            </button>
          </div>
        </>
      )}
    </main>
  )
}

function LandingPitch({ onStartHost }: { onStartHost: () => void }) {
  return (
    <>
      <p className="mt-4 text-base italic text-emerald-300/80">
        50% less engagement, 100% more luggage space
      </p>
      <p className="mt-6 max-w-xl text-lg text-slate-300">
        A self-hosted music guessing game. Connect your Spotify, pick a playlist,
        and let the wheel decide what your friends have to guess.
      </p>

      <ol className="mt-10 grid w-full max-w-md gap-3 text-left text-slate-300">
        <li className="flex gap-3">
          <span className="font-mono text-emerald-400">1.</span>
          A song plays — but its title and artist stay hidden.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-emerald-400">2.</span>
          The wheel picks one of: artist, title, year, year ±3, or decade.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-emerald-400">3.</span>
          Guess. Reveal. Repeat.
        </li>
      </ol>

      <div className="mt-12 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onStartHost}
          className="w-64 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Start as host
        </button>
        <Link
          to="/join"
          className="w-64 rounded-full bg-emerald-500 px-8 py-3 text-center font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Join game
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Spotify Premium required to host.
      </p>

      <Link
        to="/rules"
        className="mt-6 text-sm text-slate-400 underline transition hover:text-slate-200"
      >
        How does it work?
      </Link>
    </>
  )
}

function SignedInView({ onLogout }: { onLogout: () => void }) {
  const playlists = usePlaylists()
  const [selected, setSelected] = useState<SpotifyPlaylist | null>(null)
  const [filter, setFilter] = useState('')
  const [bingoOpen, setBingoOpen] = useState(false)
  const openBingo = () => setBingoOpen(true)
  const closeBingo = () => setBingoOpen(false)

  // Spotify-curated playlists (Discover Weekly, editorial like "Today's Top
  // Hits", etc.) always 403 for apps in Development Mode, so we hide them.
  // For other third-party playlists the API doesn't reliably tell us whether
  // we can read them — we show them optimistically and let a click-time 403
  // surface a friendly error in GameView.
  const isLikelyPlayable = (p: SpotifyPlaylist): boolean =>
    p.owner?.id !== 'spotify'

  const playable: typeof playlists =
    playlists.status === 'loaded'
      ? {
          ...playlists,
          playlists: playlists.playlists.filter(isLikelyPlayable),
        }
      : playlists

  // Bingo overlay renders on top while GameView stays mounted, so any
  // in-progress game (selected playlist, wheel state, playback) survives.
  // Only reachable from inside an active game — the playlist picker has no
  // bingo affordance.
  if (selected) {
    return (
      <>
        <GameView
          playlistId={selected.id}
          playlistName={selected.name}
          onExit={() => setSelected(null)}
          onOpenBingo={openBingo}
        />
        {bingoOpen && <HostBingoOverlay onBack={closeBingo} />}
      </>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black tracking-tight">
          Open <span className="text-emerald-400">Hits</span>
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <Link
            to="/"
            className="whitespace-nowrap rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            ← Back
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Pick a playlist to play</h2>
          {playable.status === 'loaded' && playable.playlists.length > 0 && (
            <PlaylistFilter value={filter} onChange={setFilter} />
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Official Spotify playlists (Discover Weekly, editorial picks)
          aren't supported
        </p>
        <PlaylistsList
          state={playable}
          filter={filter}
          onSelect={setSelected}
        />
      </section>
    </main>
  )
}

function PlaylistsList({
  state,
  filter,
  onSelect,
}: {
  state: ReturnType<typeof usePlaylists>
  filter: string
  onSelect: (playlist: SpotifyPlaylist) => void
}) {
  if (state.status === 'loading') {
    return <p className="mt-4 text-slate-400">Loading playlists…</p>
  }
  if (state.status === 'error') {
    return (
      <p className="mt-4 text-rose-300">
        Failed to load playlists{state.error ? `: ${state.error}` : ''}
      </p>
    )
  }
  if (state.playlists.length === 0) {
    return <p className="mt-4 text-slate-400">You don't have any playlists yet.</p>
  }

  const trimmed = filter.trim().toLowerCase()
  const matches = trimmed
    ? state.playlists.filter((p) => p.name.toLowerCase().includes(trimmed))
    : state.playlists

  if (matches.length === 0) {
    return (
      <p className="mt-4 text-slate-400">
        No playlists match "{filter.trim()}".
      </p>
    )
  }

  return (
    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((p) => (
        <PlaylistCard key={p.id} playlist={p} onSelect={onSelect} />
      ))}
    </ul>
  )
}

function PlaylistFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="relative w-full sm:w-72">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter playlists…"
        className="w-full rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 pr-9 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-emerald-500 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear filter"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
        >
          ×
        </button>
      )}
    </div>
  )
}

function PlaylistCard({
  playlist,
  onSelect,
}: {
  playlist: SpotifyPlaylist
  onSelect: (playlist: SpotifyPlaylist) => void
}) {
  const cover = playlist.images?.[0]
  const trackCount = playlist.items?.total ?? playlist.tracks?.total
  const ownerName = playlist.owner?.display_name

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(playlist)}
        className="flex w-full gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-emerald-500 hover:bg-slate-900 focus:border-emerald-500 focus:outline-none"
      >
        {cover ? (
          <img
            src={cover.url}
            alt=""
            className="h-16 w-16 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded bg-slate-800" />
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-semibold">{playlist.name}</p>
          <p className="truncate text-sm text-slate-400">
            {trackCount !== undefined
              ? `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`
              : '— tracks'}
            {ownerName ? ` · ${ownerName}` : ''}
          </p>
        </div>
      </button>
    </li>
  )
}

export default App
