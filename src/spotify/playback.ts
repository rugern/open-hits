import { getAccessToken } from './auth'

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  is_active: boolean
  is_restricted: boolean
  volume_percent: number | null
}

interface DevicesResponse {
  devices: SpotifyDevice[]
}

async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken()
  if (!token) throw new Error('not_authenticated')
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchDevices(): Promise<SpotifyDevice[]> {
  const res = await authedFetch('https://api.spotify.com/v1/me/player/devices')
  if (!res.ok) throw new Error(`devices_fetch_${res.status}`)
  const body = (await res.json()) as DevicesResponse
  // Restricted devices can't accept playback commands.
  return body.devices.filter((d) => !d.is_restricted)
}

export async function playTrack(deviceId: string, uri: string): Promise<void> {
  const res = await authedFetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [uri] }),
    },
  )
  if (!res.ok) {
    let reason = ''
    try {
      const body = (await res.json()) as {
        error?: { reason?: string; message?: string }
      }
      reason = body.error?.reason ?? body.error?.message ?? ''
    } catch {
      // Body wasn't JSON; nothing useful to add.
    }
    throw new Error(`play_${res.status}${reason ? `:${reason}` : ''}`)
  }
}

export async function pausePlayback(): Promise<void> {
  const res = await authedFetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
  })
  // 404 just means nothing was playing — that's fine for our purposes.
  if (!res.ok && res.status !== 404) throw new Error(`pause_${res.status}`)
}
