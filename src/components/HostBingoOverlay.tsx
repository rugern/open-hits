import { BingoCard } from './BingoCard'

interface HostBingoOverlayProps {
  onBack: () => void
}

// Renders on top of the host UI without unmounting it, so any in-progress
// game (selected playlist, useGame state, playback session) survives.
export function HostBingoOverlay({ onBack }: HostBingoOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto max-w-3xl px-6 py-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-xl font-black tracking-tight">
            Open <span className="text-emerald-400">Hits</span>
          </h1>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            ← Back
          </button>
        </header>

        <div className="mt-8">
          <BingoCard />
        </div>
      </main>
    </div>
  )
}
