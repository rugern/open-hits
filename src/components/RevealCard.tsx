import type { GameTrack } from '../spotify/api'
import type { GameModeId } from '../game/modes'
import { formatPlacement } from '../game/eurovision'

export function RevealCard({
  track,
  modeId,
}: {
  track: GameTrack
  modeId: GameModeId
}) {
  const eurovision = modeId === 'eurovision' ? track.eurovision : undefined
  const showNotFound = modeId === 'eurovision' && track.eurovision === null

  return (
    <div className="mx-auto max-w-md text-center">
      {track.albumImage ? (
        <img
          src={track.albumImage}
          alt=""
          className="mx-auto h-48 w-48 rounded-lg object-cover shadow-2xl shadow-black/50"
        />
      ) : (
        <div className="mx-auto h-48 w-48 rounded-lg bg-slate-800" />
      )}
      <p className="mt-6 text-3xl font-bold leading-tight">{track.name}</p>
      <p className="mt-2 text-lg text-slate-300">{track.artists.join(', ')}</p>

      {eurovision ? (
        <>
          <p className="mt-4 text-lg text-slate-200">{eurovision.country}</p>
          <p className="text-lg text-slate-200">
            {formatPlacement(eurovision.placement)}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold">
            {eurovision.year}
          </p>
        </>
      ) : (
        <p className="mt-4 font-mono text-3xl font-semibold">{track.year}</p>
      )}

      {showNotFound && (
        <p className="mx-auto mt-4 max-w-sm rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          This song wasn't found in the Eurovision record. Country and placement
          are unknown; the year above is the Spotify release year.
        </p>
      )}
    </div>
  )
}
