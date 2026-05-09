import { useState } from 'react'
import { useSpotifyAuth } from './spotify/useSpotifyAuth'
import { usePlaylists } from './spotify/usePlaylists'
import type { SpotifyPlaylist, SpotifyUser } from './spotify/api'
import { GameView } from './components/GameView'

function App() {
  const auth = useSpotifyAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-slate-100">
      {auth.status === 'authenticated' && auth.user ? (
        <SignedInView user={auth.user} onLogout={auth.logout} />
      ) : (
        <CenteredHero
          status={auth.status}
          error={auth.error}
          onLogin={auth.login}
        />
      )}
    </div>
  )
}

function CenteredHero({
  status,
  error,
  onLogin,
}: {
  status: 'loading' | 'idle' | 'error' | 'authenticated'
  error: string | null
  onLogin: () => void
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
        Open <span className="text-emerald-400">Hits</span>
      </h1>

      {status === 'loading' && <p className="mt-10 text-slate-400">Loading…</p>}

      {status === 'idle' && <LandingPitch onLogin={onLogin} />}

      {status === 'error' && (
        <>
          <p className="mt-8 max-w-md text-rose-300">
            Sign-in failed{error ? `: ${error}` : ''}. Try again?
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="mt-6 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Connect Spotify
          </button>
        </>
      )}
    </main>
  )
}

function LandingPitch({ onLogin }: { onLogin: () => void }) {
  return (
    <>
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

      <button
        type="button"
        onClick={onLogin}
        className="mt-12 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        Connect Spotify
      </button>

      <p className="mt-4 text-xs text-slate-500">Spotify Premium required.</p>
    </>
  )
}

function SignedInView({
  user,
  onLogout,
}: {
  user: SpotifyUser
  onLogout: () => void
}) {
  const playlists = usePlaylists()
  const isPremium = user.product === 'premium'
  const [selected, setSelected] = useState<SpotifyPlaylist | null>(null)

  if (selected) {
    return (
      <GameView
        playlistId={selected.id}
        playlistName={selected.name}
        onExit={() => setSelected(null)}
      />
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black tracking-tight">
          Open <span className="text-emerald-400">Hits</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="text-sm font-semibold">
              {user.display_name ?? user.id}
              <span
                className={
                  'ml-2 rounded-full px-2 py-0.5 text-xs font-medium ' +
                  (isPremium
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300')
                }
              >
                {isPremium ? 'Premium' : user.product}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {!isPremium && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Open Hits needs Spotify Premium to play music in the browser. You can
          browse your playlists, but the game can't start without Premium.
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          {isPremium ? 'Pick a playlist to play' : 'Your playlists'}
        </h2>
        <PlaylistsList
          state={playlists}
          onSelect={isPremium ? setSelected : null}
        />
      </section>
    </main>
  )
}

function PlaylistsList({
  state,
  onSelect,
}: {
  state: ReturnType<typeof usePlaylists>
  onSelect: ((playlist: SpotifyPlaylist) => void) | null
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
  return (
    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {state.playlists.map((p) => (
        <PlaylistCard key={p.id} playlist={p} onSelect={onSelect} />
      ))}
    </ul>
  )
}

function PlaylistCard({
  playlist,
  onSelect,
}: {
  playlist: SpotifyPlaylist
  onSelect: ((playlist: SpotifyPlaylist) => void) | null
}) {
  const cover = playlist.images?.[0]
  const trackCount = playlist.tracks?.total
  const ownerName = playlist.owner?.display_name
  const clickable = onSelect !== null

  const content = (
    <>
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
    </>
  )

  if (!clickable) {
    return (
      <li className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3 opacity-60">
        {content}
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(playlist)}
        className="flex w-full gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-emerald-500 hover:bg-slate-900 focus:border-emerald-500 focus:outline-none"
      >
        {content}
      </button>
    </li>
  )
}

export default App
