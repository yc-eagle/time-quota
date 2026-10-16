import type { Toast } from '../hooks/useToasts.ts'
import { useLanguage } from '../i18n/context.ts'
import { CloseIcon } from './icons.tsx'

interface ToastStackProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  const { t } = useLanguage()

  if (toasts.length === 0) return null

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <span>{toast.message}</span>
          <button type="button" className="icon-btn icon-btn-sm" onClick={() => onDismiss(toast.id)} aria-label={t('close')}>
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
