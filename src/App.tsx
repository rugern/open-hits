function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
          Open <span className="text-emerald-400">Hits</span>
        </h1>
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
          className="mt-12 cursor-not-allowed rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 opacity-60"
          disabled
        >
          Connect Spotify (coming soon)
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Spotify Premium required.
        </p>
      </main>
    </div>
  )
}

export default App
