/** 提示音与系统通知。所有调用都在不支持的环境里静默降级。 */

type AudioContextCtor = new () => AudioContext

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const globalWindow = window as Window & { webkitAudioContext?: AudioContextCtor }
  const Ctor = window.AudioContext ?? globalWindow.webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) {
    try {
      audioContext = new Ctor()
    } catch {
      return null
    }
  }
  return audioContext
}

/** 用 Web Audio 合成一段简短提示音，避免引入音频资源文件 */
export function playChime(kind: 'segment' | 'quota' = 'segment'): void {
  const context = getAudioContext()
  if (!context) return

  try {
    if (context.state === 'suspended') void context.resume()

    const notes = kind === 'quota' ? [880, 660] : [660, 990]
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const startAt = context.currentTime + index * 0.18

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startAt)
      oscillator.stop(startAt + 0.2)
    })
  } catch {
    /* 音频不可用时忽略 */
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export function sendNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: `${import.meta.env.BASE_URL}favicon.svg` })
  } catch {
    /* 部分浏览器（如移动端）构造 Notification 会抛错，忽略 */
  }
}
