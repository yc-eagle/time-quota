import { useEffect } from 'react'
import { useLanguage } from '../i18n/context.ts'
import type { TranslationKey } from '../i18n/translations.ts'
import { CloseIcon } from './icons.tsx'

interface HelpGuideProps {
  open: boolean
  onClose: () => void
}

const STEP_KEYS: TranslationKey[] = [
  'helpStep1',
  'helpStep2',
  'helpStep3',
  'helpStep4',
  'helpStep5',
  'helpStep6',
]

export function HelpGuide({ open, onClose }: HelpGuideProps) {
  const { t } = useLanguage()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('helpTitle')} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('helpTitle')}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}>
            <CloseIcon />
          </button>
        </div>

        <ol className="help-steps">
          {STEP_KEYS.map((key) => (
            <li key={key} className="help-step">
              <span className="step-dot" aria-hidden="true" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ol>

        <div className="help-shortcuts">
          <h4>{t('shortcuts')}</h4>
          <ul>
            <li>
              <kbd>Space</kbd>
              <span>{t('shortcutToggle')}</span>
            </li>
            <li>
              <kbd>Esc</kbd>
              <span>{t('shortcutClose')}</span>
            </li>
          </ul>
          <p className="help-note">{t('shortcutHint')}</p>
        </div>
      </div>
    </div>
  )
}
