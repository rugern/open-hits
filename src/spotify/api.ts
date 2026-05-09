import { getAccessToken } from './auth'

export interface SpotifyUser {
  id: string
  display_name: string | null
  product: 'free' | 'premium' | 'open' | string
}

export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

// Fields are tolerant of partial responses — Spotify occasionally returns
// playlist entries missing tracks, images, or owner.display_name.
export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[] | null
  owner: { id: string; display_name: string | null } | null
  tracks: { total: number } | null
  public: boolean | null
  collaborative: boolean
}

interface PlaylistsPage {
  items: (SpotifyPlaylist | null)[]
  next: string | null
  total: number
}

async function authedFetch(url: string): Promise<Response> {
  const token = await getAccessToken()
  if (!token) throw new Error('not_authenticated')
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
}

async function spotifyError(prefix: string, res: Response): Promise<Error> {
  let detail = ''
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    if (body.error?.message) detail = `: ${body.error.message}`
  } catch {
    // Body wasn't JSON; nothing useful to add.
  }
  return new Error(`${prefix}_${res.status}${detail}`)
}

export async function fetchCurrentUser(): Promise<SpotifyUser> {
  const res = await authedFetch('https://api.spotify.com/v1/me')
  if (!res.ok) throw new Error(`user_fetch_${res.status}`)
  return (await res.json()) as SpotifyUser
}

export async function fetchAllPlaylists(): Promise<SpotifyPlaylist[]> {
  const all: SpotifyPlaylist[] = []
  let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50'

  while (url) {
    const res = await authedFetch(url)
    if (!res.ok) throw new Error(`playlists_fetch_${res.status}`)
    const page = (await res.json()) as PlaylistsPage
    for (const item of page.items) {
      if (item) all.push(item)
    }
    url = page.next
  }

  return all
}

// Minimized track shape used by the game loop. We deliberately drop the rest
// of the Spotify track payload at the API boundary so downstream code can
// never accidentally render or log fields the players aren't supposed to see.
export interface GameTrack {
  uri: string
  name: string
  artists: string[]
  year: number
  albumImage: string | null
}

interface TrackPayload {
  uri: string
  name: string
  type: string
  is_local?: boolean
  artists: { name: string }[]
  album: {
    images?: SpotifyImage[]
    release_date?: string | null
    release_date_precision?: 'year' | 'month' | 'day' | null
  }
}

// /items returns playlist entries that may be tracks or episodes. The
// payload lives under `item` on the new endpoint; older clients used `track`
// — we accept either.
interface PlaylistEntry {
  is_local?: boolean
  item?: TrackPayload | null
  track?: TrackPayload | null
}

interface PlaylistItemsPage {
  items: (PlaylistEntry | null)[]
  next: string | null
}

function parseYear(release_date: string | null | undefined): number | null {
  if (!release_date) return null
  const match = /^(\d{4})/.exec(release_date)
  return match ? Number(match[1]) : null
}

export async function fetchPlaylistTracks(playlistId: string): Promise<GameTrack[]> {
  const tracks: GameTrack[] = []
  let url: string | null = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items?limit=100`

  while (url) {
    const res = await authedFetch(url)
    if (!res.ok) throw await spotifyError('tracks_fetch', res)
    const page = (await res.json()) as PlaylistItemsPage

    for (const entry of page.items) {
      if (!entry) continue
      if (entry.is_local) continue

      const t = entry.item ?? entry.track
      if (!t) continue
      if (t.is_local) continue
      if (t.type !== 'track') continue

      const year = parseYear(t.album?.release_date)
      if (year === null) continue

      tracks.push({
        uri: t.uri,
        name: t.name,
        artists: t.artists.map((a) => a.name),
        year,
        albumImage: t.album?.images?.[0]?.url ?? null,
      })
    }

    url = page.next
  }

  return tracks
}
