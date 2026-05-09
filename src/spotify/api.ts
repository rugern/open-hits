import { getAccessToken } from './auth'

export interface SpotifyUser {
  id: string
  display_name: string | null
  email: string
  product: 'free' | 'premium' | 'open' | string
}

export async function fetchCurrentUser(): Promise<SpotifyUser> {
  const token = await getAccessToken()
  if (!token) throw new Error('not_authenticated')

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`user_fetch_${res.status}`)
  return (await res.json()) as SpotifyUser
}
