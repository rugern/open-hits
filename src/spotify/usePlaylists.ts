import { useEffect, useState } from 'react'
import { fetchAllPlaylists } from './api'
import type { SpotifyPlaylist } from './api'

export type PlaylistsStatus = 'loading' | 'loaded' | 'error'

export interface UsePlaylists {
  status: PlaylistsStatus
  playlists: SpotifyPlaylist[]
  error: string | null
}

export function usePlaylists(): UsePlaylists {
  const [status, setStatus] = useState<PlaylistsStatus>('loading')
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAllPlaylists()
      .then((items) => {
        if (cancelled) return
        setPlaylists(items)
        setStatus('loaded')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'unknown_error')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { status, playlists, error }
}
