import { useLanguage } from '../i18n/context.ts'
import type { ThemeName } from '../lib/storage.ts'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'
import {
  BellIcon,
  BellOffIcon,
  BoltIcon,
  MoonIcon,
  QuestionIcon,
  SoundOffIcon,
  SoundOnIcon,
  SunIcon,
} from './icons.tsx'

interface HeaderProps {
  theme: ThemeName
  onToggleTheme: () => void
  soundEnabled: boolean
  notifyEnabled: boolean
  onToggleSound: () => void
  onToggleNotify: () => void
  onOpenHelp: () => void
}

export function Header({
  theme,
  onToggleTheme,
  soundEnabled,
  notifyEnabled,
  onToggleSound,
  onToggleNotify,
  onOpenHelp,
}: HeaderProps) {
  const { t } = useLanguage()

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <BoltIcon width={22} height={22} />
        </span>
        <div>
          <h1 className="brand-title">{t('appName')}</h1>
          <p className="brand-tagline">{t('tagline')}</p>
        </div>
      </div>

      <div className="toolbar">
        <LanguageSwitcher />
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? t('toLight') : t('toDark')}
          aria-label={theme === 'dark' ? t('toLight') : t('toDark')}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          type="button"
          className={soundEnabled ? 'icon-btn is-active' : 'icon-btn'}
          onClick={onToggleSound}
          title={soundEnabled ? t('soundOff') : t('soundOn')}
          aria-label={soundEnabled ? t('soundOff') : t('soundOn')}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <button
          type="button"
          className={notifyEnabled ? 'icon-btn is-active' : 'icon-btn'}
          onClick={onToggleNotify}
          title={notifyEnabled ? t('notifyOff') : t('notifyOn')}
          aria-label={notifyEnabled ? t('notifyOff') : t('notifyOn')}
          aria-pressed={notifyEnabled}
        >
          {notifyEnabled ? <BellIcon /> : <BellOffIcon />}
        </button>
        <button type="button" className="icon-btn" onClick={onOpenHelp} title={t('help')} aria-label={t('help')}>
          <QuestionIcon />
        </button>
      </div>
    </header>
  )
}
