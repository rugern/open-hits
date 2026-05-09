import {
  SPOTIFY_AUTH_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from './config'
import { deriveCodeChallenge, generateCodeVerifier, generateState } from './pkce'

const STORAGE = {
  accessToken: 'open-hits.spotify.access_token',
  refreshToken: 'open-hits.spotify.refresh_token',
  expiresAt: 'open-hits.spotify.expires_at',
  codeVerifier: 'open-hits.spotify.code_verifier',
  state: 'open-hits.spotify.state',
} as const

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

function readTokens(): StoredTokens | null {
  const accessToken = localStorage.getItem(STORAGE.accessToken)
  const refreshToken = localStorage.getItem(STORAGE.refreshToken)
  const expiresAtRaw = localStorage.getItem(STORAGE.expiresAt)
  if (!accessToken || !refreshToken || !expiresAtRaw) return null
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt)) return null
  return { accessToken, refreshToken, expiresAt }
}

function writeTokens(tokens: StoredTokens) {
  localStorage.setItem(STORAGE.accessToken, tokens.accessToken)
  localStorage.setItem(STORAGE.refreshToken, tokens.refreshToken)
  localStorage.setItem(STORAGE.expiresAt, String(tokens.expiresAt))
}

function clearTokens() {
  localStorage.removeItem(STORAGE.accessToken)
  localStorage.removeItem(STORAGE.refreshToken)
  localStorage.removeItem(STORAGE.expiresAt)
}

function cleanCallbackParamsFromUrl() {
  window.history.replaceState({}, '', import.meta.env.BASE_URL)
}

export async function startLogin(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await deriveCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem(STORAGE.codeVerifier, verifier)
  sessionStorage.setItem(STORAGE.state, state)

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SPOTIFY_SCOPES.join(' '),
  })

  window.location.assign(`${SPOTIFY_AUTH_URL}?${params.toString()}`)
}

export interface CallbackResult {
  ok: boolean
  error?: string
}

// Module-level dedup so that React StrictMode's mount→unmount→remount in dev
// (which calls the auth-init effect twice) doesn't end up with one invocation
// consuming the URL params and the other one seeing nothing. Both calls share
// the same in-flight promise and observe the same result.
let callbackPromise: Promise<CallbackResult | null> | null = null

export function handleAuthCallback(): Promise<CallbackResult | null> {
  if (!callbackPromise) {
    callbackPromise = handleAuthCallbackOnce()
  }
  return callbackPromise
}

async function handleAuthCallbackOnce(): Promise<CallbackResult | null> {
  const url = new URL(window.location.href)
  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')

  if (!error && !code) return null

  const expectedState = sessionStorage.getItem(STORAGE.state)
  const verifier = sessionStorage.getItem(STORAGE.codeVerifier)
  sessionStorage.removeItem(STORAGE.state)
  sessionStorage.removeItem(STORAGE.codeVerifier)
  cleanCallbackParamsFromUrl()

  if (error) return { ok: false, error }
  if (!code) return null
  if (!expectedState || returnedState !== expectedState) {
    return { ok: false, error: 'state_mismatch' }
  }
  if (!verifier) return { ok: false, error: 'missing_verifier' }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  })

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) return { ok: false, error: `token_exchange_${res.status}` }

  const data = (await res.json()) as TokenResponse
  if (!data.refresh_token) return { ok: false, error: 'missing_refresh_token' }

  writeTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })
  return { ok: true }
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = readTokens()
  if (!tokens) return null

  // Refresh 60s before expiry to absorb clock skew + request latency.
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  })

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    clearTokens()
    return null
  }

  const data = (await res.json()) as TokenResponse
  const next: StoredTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  writeTokens(next)
  return next.accessToken
}

export function logout(): void {
  clearTokens()
}

export function hasStoredTokens(): boolean {
  return readTokens() !== null
}
