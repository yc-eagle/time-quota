import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastTone = 'info' | 'success' | 'warning'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

let toastCounter = 0

export interface UseToastsResult {
  toasts: Toast[]
  push: (message: string, tone?: ToastTone) => void
  dismiss: (id: string) => void
}

/** 轻量提示条：最多同时显示 4 条，自动消失 */
export function useToasts(duration = 4200): UseToastsResult {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      toastCounter += 1
      const id = `toast_${Date.now().toString(36)}_${toastCounter}`
      setToasts((previous) => [...previous.slice(-3), { id, message, tone }])
      timersRef.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration),
      )
    },
    [dismiss, duration],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return { toasts, push, dismiss }
}
