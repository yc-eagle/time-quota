import { useCallback, useState } from 'react'
import { NOTIFY_KEY, SOUND_KEY, readFlag, writeFlag } from '../lib/storage.ts'
import { notificationPermission, requestNotificationPermission } from '../lib/notify.ts'

export type NotifyToggleResult = 'on' | 'off' | 'denied'

export interface UsePreferencesResult {
  soundEnabled: boolean
  notifyEnabled: boolean
  toggleSound: () => void
  toggleNotify: () => Promise<NotifyToggleResult>
}

/** 提示音与系统通知开关，持久化在 localStorage */
export function usePreferences(): UsePreferencesResult {
  const [soundEnabled, setSoundEnabled] = useState(() => readFlag(SOUND_KEY, true))
  const [notifyEnabled, setNotifyEnabled] = useState(
    () => readFlag(NOTIFY_KEY, false) && notificationPermission() === 'granted',
  )

  const toggleSound = useCallback(() => {
    setSoundEnabled((previous) => {
      const next = !previous
      writeFlag(SOUND_KEY, next)
      return next
    })
  }, [])

  const toggleNotify = useCallback(async (): Promise<NotifyToggleResult> => {
    if (notifyEnabled) {
      setNotifyEnabled(false)
      writeFlag(NOTIFY_KEY, false)
      return 'off'
    }

    const granted = await requestNotificationPermission()
    if (!granted) return 'denied'

    setNotifyEnabled(true)
    writeFlag(NOTIFY_KEY, true)
    return 'on'
  }, [notifyEnabled])

  return { soundEnabled, notifyEnabled, toggleSound, toggleNotify }
}
