import { useEffect, useState } from 'react'
import { fetchCurrentUser } from './api'
import type { SpotifyUser } from './api'
import {
  handleAuthCallback,
  hasStoredTokens,
  logout as doLogout,
  startLogin,
} from './auth'

export type AuthStatus = 'loading' | 'idle' | 'authenticated' | 'error'

export interface SpotifyAuth {
  status: AuthStatus
  user: SpotifyUser | null
  error: string | null
  login: () => void
  logout: () => void
}

export function useSpotifyAuth(): SpotifyAuth {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const callback = await handleAuthCallback()
      if (cancelled) return

      if (callback && !callback.ok) {
        setError(callback.error ?? 'unknown_error')
        setStatus('error')
        return
      }

      if (!hasStoredTokens()) {
        setStatus('idle')
        return
      }

      try {
        const me = await fetchCurrentUser()
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'unknown_error')
        setStatus('error')
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [])

  return {
    status,
    user,
    error,
    login: () => {
      void startLogin()
    },
    logout: () => {
      doLogout()
      setUser(null)
      setError(null)
      setStatus('idle')
    },
  }
}
