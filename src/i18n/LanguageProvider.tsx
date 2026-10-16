import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readLanguage, writeLanguage } from '../lib/storage.ts'
import { LanguageContext, type LanguageContextValue } from './context.ts'
import { interpolate, translations, type Language, type TranslationKey } from './translations.ts'

/**
 * 语言状态集中在这里，所有组件通过 useLanguage() 读取同一份 Context。
 * （旧版本把状态放在 useLanguage 这个普通 hook 里，每个组件各持一份，切换语言不会同步。）
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readLanguage())

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    writeLanguage(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      interpolate(translations[language][key] ?? key, params),
    [language],
  )

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
