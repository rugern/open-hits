import { useEffect } from 'react'

// Browsers auto-release the lock when the tab is hidden, so we re-acquire on
// visibilitychange. Acquire can also reject if the page isn't visible at the
// moment of mount — same handler covers that.
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (cancelled || sentinel !== null) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null
        })
        sentinel = lock
      } catch {
        // Re-tried on next visibilitychange.
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (sentinel) {
        void sentinel.release()
        sentinel = null
      }
    }
  }, [])
}
