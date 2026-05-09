import type { GameTrack } from '../spotify/api'

export function RevealCard({
  track,
}: {
  track: GameTrack
}) {
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
      <p
        className="mt-4 font-mono text-3xl font-semibold"
      >
        {track.year}
      </p>
    </div>
  )
}
