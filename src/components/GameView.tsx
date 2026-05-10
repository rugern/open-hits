import { useEffect, useState } from 'react'
import { fetchPlaylistTracks } from '../spotify/api'
import type { GameTrack } from '../spotify/api'
import { useGame } from '../game/useGame'
import { useWakeLock } from '../game/useWakeLock'
import { WHEEL_CATEGORIES } from '../game/wheel'
import { usePlayback } from '../spotify/usePlayback'
import type { SpotifyDevice } from '../spotify/playback'
import { Wheel } from './Wheel'
import { RevealCard } from './RevealCard'

interface GameViewProps {
  playlistId: string
  playlistName: string
  onExit: () => void
  onOpenBingo: () => void
}

export function GameView({
  playlistId,
  playlistName,
  onExit,
  onOpenBingo,
}: GameViewProps) {
  const [tracks, setTracks] = useState<GameTrack[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setTracks(null)
    setError(null)
    fetchPlaylistTracks(playlistId)
      .then((t) => {
        if (cancelled) return
        if (t.length === 0) {
          setError(
            'This playlist has no playable tracks (after filtering local files, podcasts, and tracks without a release year).',
          )
        } else {
          setTracks(t)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'unknown_error')
      })
    return () => {
      cancelled = true
    }
  }, [playlistId])

  if (error) {
    const isForbidden = error.startsWith('tracks_fetch_403')
    return (
      <Shell>
        {isForbidden ? (
          <p className="mx-auto max-w-md rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            Spotify won't let the app read this playlist. You need to be either the playlist owner or a collaborator to access it.
          </p>
        ) : (
          <p className="text-rose-300">Failed to load tracks: {error}</p>
        )}
        <BackButton onClick={onExit} />
      </Shell>
    )
  }

  if (!tracks) {
    return (
      <Shell>
        <p className="text-slate-400">Loading tracks…</p>
      </Shell>
    )
  }

  return (
    <Game
      key={playlistId}
      tracks={tracks}
      playlistName={playlistName}
      onExit={onExit}
      onOpenBingo={onOpenBingo}
    />
  )
}

function Game({
  tracks,
  playlistName,
  onExit,
  onOpenBingo,
}: {
  tracks: GameTrack[]
  playlistName: string
  onExit: () => void
  onOpenBingo: () => void
}) {
  const game = useGame(tracks)
  const playback = usePlayback()
  const [playError, setPlayError] = useState<string | null>(null)
  const [partyMode, setPartyMode] = useState(false)
  useWakeLock()

  useEffect(() => {
    if (game.state.kind !== 'playing') return
    if (playback.status !== 'ready') return
    setPlayError(null)
    playback.play(game.state.track.uri).catch((err: unknown) => {
      setPlayError(err instanceof Error ? err.message : 'play_failed')
    })
  }, [game.state, playback.status, playback.play])

  // Don't pause between rounds — iOS suspends Spotify when paused+backgrounded,
  // dropping the device from Connect. Letting the previous track keep playing
  // through the wheel spin keeps the device active until the next play() call
  // replaces it. Only pause when the game ends.
  useEffect(() => {
    if (game.state.kind === 'done') void playback.pause()
  }, [game.state.kind, playback.pause])

  const handleContinue = () => {
    game.continueRound()
  }

  // Reveal also clears party mode so the next player gets a fresh choice.
  const handleReveal = () => {
    setPartyMode(false)
    game.reveal()
  }

  return (
    <div className={partyMode ? 'min-h-screen party-mode' : ''}>
      <Shell>
        <Header
          playlistName={playlistName}
          onExit={onExit}
          onOpenBingo={onOpenBingo}
          showBingo={game.state.kind !== 'ready'}
        />

        <div className="mt-10">
          {game.state.kind === 'ready' && (
            <ReadyView
              totalTracks={game.totalTracks}
              playback={playback}
              onStart={game.startGame}
            />
          )}

          {(game.state.kind === 'awaiting-spin' ||
            game.state.kind === 'spinning') && (
            <RoundView
              targetIndex={
                game.state.kind === 'spinning'
                  ? game.state.categoryIndex
                  : null
              }
              durationMs={
                game.state.kind === 'spinning' ? game.state.durationMs : 0
              }
              roundNumber={game.roundNumber}
              totalTracks={game.totalTracks}
              onSpinNow={game.spinNow}
              onSpinComplete={game.onSpinComplete}
              partyMode={partyMode}
              onTogglePartyMode={() => setPartyMode((p) => !p)}
            />
          )}

          {game.state.kind === 'playing' && (
            <PlayingView
              categoryIndex={game.state.categoryIndex}
              roundNumber={game.roundNumber}
              totalTracks={game.totalTracks}
              playError={playError}
              onReveal={handleReveal}
            />
          )}

          {game.state.kind === 'revealing' && (
            <RevealingView
              categoryIndex={game.state.categoryIndex}
              track={game.state.track}
              roundNumber={game.roundNumber}
              totalTracks={game.totalTracks}
              onContinue={handleContinue}
            />
          )}

          {game.state.kind === 'done' && (
            <DoneView
              totalTracks={game.totalTracks}
              onPlayAgain={game.restart}
              onExit={onExit}
            />
          )}
        </div>
      </Shell>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
}

function Header({
  playlistName,
  onExit,
  onOpenBingo,
  showBingo,
}: {
  playlistName: string
  onExit: () => void
  onOpenBingo: () => void
  showBingo: boolean
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Playing</p>
        <p className="party-text text-xl font-semibold">{playlistName}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          Quit
        </button>
        {showBingo && (
          <button
            type="button"
            onClick={onOpenBingo}
            className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-200"
          >
            Bingo
          </button>
        )}
      </div>
    </header>
  )
}

function ReadyView({
  totalTracks,
  playback,
  onStart,
}: {
  totalTracks: number
  playback: ReturnType<typeof usePlayback>
  onStart: () => void
}) {
  if (playback.status === 'loading') {
    return <p className="text-center text-slate-400">Looking for Spotify devices…</p>
  }

  if (playback.status === 'error') {
    return (
      <div className="text-center">
        <p className="text-rose-300">
          Couldn't load devices{playback.error ? `: ${playback.error}` : ''}
        </p>
        <button
          type="button"
          onClick={playback.refresh}
          className="mt-6 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          Retry
        </button>
      </div>
    )
  }

  if (playback.status === 'no-device') {
    return (
      <div className="text-center">
        <p className="text-lg text-slate-200">No active Spotify devices found.</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
          Open Spotify on your phone, desktop app, speaker, or another browser tab,
          and play any song briefly to wake the device. Then click Refresh below.
        </p>
        <button
          type="button"
          onClick={playback.refresh}
          className="mt-8 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Refresh devices
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-slate-300">
        {totalTracks} track{totalTracks === 1 ? '' : 's'} ready, shuffled and waiting.
      </p>

      <div className="mt-8">
        <DevicePicker
          devices={playback.devices}
          selectedDeviceId={playback.selectedDeviceId}
          onSelect={playback.selectDevice}
          onRefresh={playback.refresh}
        />
      </div>

      <p className="mx-auto mt-6 max-w-md rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
        Heads up: The Spotify app on the device above will display the song's title,
        artist and album art. Keep that screen out of sight during play!
      </p>

      <button
        type="button"
        onClick={onStart}
        disabled={!playback.selectedDeviceId}
        className="mt-8 rounded-full bg-emerald-500 px-10 py-4 text-lg font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start game
      </button>
    </div>
  )
}

function DevicePicker({
  devices,
  selectedDeviceId,
  onSelect,
  onRefresh,
}: {
  devices: SpotifyDevice[]
  selectedDeviceId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
}) {
  return (
    <div className="mx-auto max-w-md text-left">
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">Play on</p>
      <ul className="space-y-2">
        {devices.map((device) => {
          const selected = selectedDeviceId === device.id
          return (
            <li key={device.id}>
              <label
                className={
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ' +
                  (selected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-500')
                }
              >
                <input
                  type="radio"
                  name="device"
                  value={device.id}
                  checked={selected}
                  onChange={() => onSelect(device.id)}
                  className="sr-only"
                />
                <span className="flex-1">
                  <span className="block font-medium">{device.name}</span>
                  <span className="block text-xs text-slate-400">
                    {device.type}
                    {device.is_active ? ' · active' : ''}
                  </span>
                </span>
                {selected && (
                  <span aria-hidden className="text-sm text-emerald-400">
                    ✓
                  </span>
                )}
              </label>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-3 text-xs text-slate-400 underline transition hover:text-slate-200"
      >
        Refresh devices
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Don't see your device? Try starting any song on it from the Spotify app, then
        refresh — Spotify only advertises devices that have played something recently.
      </p>
    </div>
  )
}

function RoundView({
  targetIndex,
  durationMs,
  roundNumber,
  totalTracks,
  onSpinNow,
  onSpinComplete,
  partyMode,
  onTogglePartyMode,
}: {
  targetIndex: number | null
  durationMs: number
  roundNumber: number
  totalTracks: number
  onSpinNow: () => void
  onSpinComplete: () => void
  partyMode: boolean
  onTogglePartyMode: () => void
}) {
  const isAwaiting = targetIndex === null
  return (
    <div className="text-center">
      <RoundCounter roundNumber={roundNumber} totalTracks={totalTracks} />
      <div className="mt-6">
        <Wheel
          targetIndex={targetIndex}
          durationMs={durationMs}
          onClick={isAwaiting ? onSpinNow : undefined}
          onSpinComplete={onSpinComplete}
        />
      </div>
      {isAwaiting && (
        <button
          type="button"
          onClick={onTogglePartyMode}
          className={
            'mt-6 rounded-full border px-3 py-1 text-xs font-medium transition ' +
            (partyMode
              ? 'border-pink-200 bg-pink-500/40 text-pink-50'
              : 'border-pink-500/50 bg-pink-500/10 text-pink-300 hover:border-pink-400')
          }
        >
          <span className={partyMode ? 'party-emoji' : ''}>🎉</span>{' '}
          {partyMode ? 'Bop off' : 'Bop it!'}
        </button>
      )}
    </div>
  )
}

function PlayingView({
  categoryIndex,
  roundNumber,
  totalTracks,
  playError,
  onReveal,
}: {
  categoryIndex: number
  roundNumber: number
  totalTracks: number
  playError: string | null
  onReveal: () => void
}) {
  const category = WHEEL_CATEGORIES[categoryIndex]
  const color = category?.color ?? '#10b981'
  return (
    <div className="text-center">
      <RoundCounter roundNumber={roundNumber} totalTracks={totalTracks} />
      <p className="mt-8 text-sm uppercase tracking-wide text-slate-400">
        Guess the
      </p>
      <h2
        className="party-text mt-2 text-5xl font-black"
        style={{ color }}
      >
        {category?.label}
      </h2>
      <p className="mt-8 text-slate-300">
        Listen, ponder, and decide on your guesses
      </p>
      {playError && <PlaybackError error={playError} />}
      <button
        type="button"
        onClick={onReveal}
        style={{ backgroundColor: color }}
        className="mt-10 rounded-full px-10 py-4 text-lg font-semibold text-slate-950 transition hover:brightness-110"
      >
        All guessed — reveal
      </button>
    </div>
  )
}

function PlaybackError({ error }: { error: string }) {
  // Spotify returns reason="PREMIUM_REQUIRED" for free accounts; we also treat
  // a bare 403 as Premium-related since that's overwhelmingly the cause.
  const isPremium =
    error.includes('PREMIUM_REQUIRED') || error === 'play_403'

  if (isPremium) {
    return (
      <p className="mx-auto mt-6 max-w-md rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        Spotify Premium is required to play music through Connect. Sign out
        and back in with a Premium account to use Open Hits.
      </p>
    )
  }
  return <p className="mt-4 text-sm text-rose-300">Playback issue: {error}</p>
}

function RevealingView({
  categoryIndex,
  track,
  roundNumber,
  totalTracks,
  onContinue,
}: {
  categoryIndex: number
  track: GameTrack
  roundNumber: number
  totalTracks: number
  onContinue: () => void
}) {
  const category = WHEEL_CATEGORIES[categoryIndex]
  // Same color the segment shows on the wheel — when bop-it is on the wheel
  // animates, but party mode is auto-cleared on reveal so the static color
  // is always what the player just saw the wheel land on.
  const color = category?.color ?? '#10b981'
  return (
    <div className="text-center">
      <RoundCounter roundNumber={roundNumber} totalTracks={totalTracks} />
      <div className="mt-6">
        <span
          className="inline-block rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-slate-950"
          style={{ backgroundColor: color }}
        >
          The category was: {category?.label}
        </span>
      </div>
      <div className="mt-8">
        <RevealCard track={track} />
      </div>
      <button
        type="button"
        onClick={onContinue}
        style={{ backgroundColor: color }}
        className="mt-10 rounded-full px-10 py-4 text-lg font-semibold text-slate-950 transition hover:brightness-110"
      >
        Continue
      </button>
    </div>
  )
}

function DoneView({
  totalTracks,
  onPlayAgain,
  onExit,
}: {
  totalTracks: number
  onPlayAgain: () => void
  onExit: () => void
}) {
  return (
    <div className="text-center">
      <h2 className="party-text text-4xl font-black">Game over</h2>
      <p className="mt-4 text-slate-300">
        You played all {totalTracks} tracks.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-full bg-emerald-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Play again (re-shuffle)
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-slate-600 px-8 py-3 font-semibold text-slate-200 transition hover:border-slate-400 hover:text-slate-100"
        >
          Pick another playlist
        </button>
      </div>
    </div>
  )
}

function RoundCounter({
  roundNumber,
  totalTracks,
}: {
  roundNumber: number
  totalTracks: number
}) {
  return (
    <p className="text-xs uppercase tracking-wide text-slate-500">
      Round {Math.min(roundNumber, totalTracks)} / {totalTracks}
    </p>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
    >
      Back to playlists
    </button>
  )
}
