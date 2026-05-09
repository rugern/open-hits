import { useCallback, useEffect, useState } from 'react'
import {
  fetchDevices,
  pausePlayback,
  playTrack,
} from './playback'
import type { SpotifyDevice } from './playback'

export type PlaybackStatus = 'loading' | 'ready' | 'no-device' | 'error'

export interface UsePlayback {
  status: PlaybackStatus
  devices: SpotifyDevice[]
  selectedDeviceId: string | null
  selectDevice: (id: string) => void
  refresh: () => void
  error: string | null
  play: (uri: string) => Promise<void>
  pause: () => Promise<void>
}

export function usePlayback(): UsePlayback {
  const [status, setStatus] = useState<PlaybackStatus>('loading')
  const [devices, setDevices] = useState<SpotifyDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setStatus('loading')
    setError(null)
    fetchDevices()
      .then((list) => {
        setDevices(list)
        if (list.length === 0) {
          setStatus('no-device')
          return
        }
        setSelectedDeviceId((prev) => {
          if (prev && list.some((d) => d.id === prev)) return prev
          const active = list.find((d) => d.is_active)
          return (active ?? list[0])?.id ?? null
        })
        setStatus('ready')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'unknown_error')
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const play = useCallback(
    async (uri: string) => {
      if (!selectedDeviceId) throw new Error('no_device_selected')
      await playTrack(selectedDeviceId, uri)
    },
    [selectedDeviceId],
  )

  const pause = useCallback(async () => {
    await pausePlayback()
  }, [])

  return {
    status,
    devices,
    selectedDeviceId,
    selectDevice: setSelectedDeviceId,
    refresh,
    error,
    play,
    pause,
  }
}
