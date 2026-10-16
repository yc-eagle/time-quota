import { useEffect } from 'react'
import { useLanguage } from '../i18n/context.ts'
import { CloseIcon } from './icons.tsx'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/** 通用二次确认弹窗，Esc 与点击遮罩都能关闭 */
export function ConfirmDialog({ open, title, message, tone = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useLanguage()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal modal-sm"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label={t('close')}>
            <CloseIcon />
          </button>
        </div>
        <p className="modal-text">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            autoFocus
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
