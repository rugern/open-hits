export const SPOTIFY_CLIENT_ID = 'fb3d8f36f9074ead917f1b1c44fc014c'

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
] as const

// Must match a redirect URI registered in the Spotify dashboard exactly,
// including the trailing slash. Computed from BASE_URL so dev and prod work
// from the same code path.
export const SPOTIFY_REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`

export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
