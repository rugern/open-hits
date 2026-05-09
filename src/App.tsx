import { useSpotifyAuth } from './spotify/useSpotifyAuth'
import type { SpotifyUser } from './spotify/api'

function App() {
  const auth = useSpotifyAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
          Open <span className="text-emerald-400">Hits</span>
        </h1>

        {auth.status === 'loading' && (
          <p className="mt-10 text-slate-400">Loading…</p>
        )}

        {auth.status === 'idle' && <LandingPitch onLogin={auth.login} />}

        {auth.status === 'authenticated' && auth.user && (
          <SignedIn user={auth.user} onLogout={auth.logout} />
        )}

        {auth.status === 'error' && (
          <ErrorPanel error={auth.error} onRetry={auth.login} />
        )}
      </main>
    </div>
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

function SignedIn({ user, onLogout }: { user: SpotifyUser; onLogout: () => void }) {
  const isPremium = user.product === 'premium'
  return (
    <>
      <p className="mt-8 text-lg text-slate-300">
        Signed in as{' '}
        <span className="font-semibold text-slate-100">
          {user.display_name ?? user.id}
        </span>
      </p>

      {isPremium ? (
        <p className="mt-2 text-sm text-emerald-400">Premium account ✓</p>
      ) : (
        <p className="mt-2 max-w-md text-sm text-amber-300">
          Your account is <strong>{user.product}</strong>. Open Hits needs Spotify
          Premium to play music in the browser. Upgrade or sign in with a Premium
          account to continue.
        </p>
      )}

      <button
        type="button"
        onClick={onLogout}
        className="mt-10 rounded-full border border-slate-600 px-6 py-2 text-sm text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
      >
        Sign out
      </button>
    </>
  )
}

function ErrorPanel({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <>
      <p className="mt-8 max-w-md text-rose-300">
        Sign-in failed{error ? `: ${error}` : ''}. Try again?
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
      >
        Connect Spotify
      </button>
    </>
  )
}

export default App
