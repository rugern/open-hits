import { Link } from 'react-router-dom'
import { useWakeLock } from '../game/useWakeLock'
import { BingoCard } from './BingoCard'

export function JoinView() {
  useWakeLock()

  return (
    <main className="mx-auto max-w-3xl px-6 py-6">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black tracking-tight">
          Open <span className="text-emerald-400">Hits</span>
        </h1>
        <Link
          to="/"
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          ← Back
        </Link>
      </header>

      <div className="mt-8">
        <BingoCard />
      </div>
    </main>
  )
}
