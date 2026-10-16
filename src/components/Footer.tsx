import { useLanguage } from '../i18n/context.ts'

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="app-footer">
      <p>{t('footerNote')}</p>
    </footer>
  )
}
