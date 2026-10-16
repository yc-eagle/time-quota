import { useLanguage } from '../i18n/context.ts'
import { languageNames, type Language } from '../i18n/translations.ts'

const LANGUAGES: Language[] = ['zh', 'en']

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <label className="lang-switcher">
      <span className="sr-only">{t('language')}</span>
      <select
        className="lang-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        title={t('language')}
      >
        {LANGUAGES.map((item) => (
          <option key={item} value={item}>
            {languageNames[item]}
          </option>
        ))}
      </select>
    </label>
  )
}
