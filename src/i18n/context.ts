import { createContext, useContext } from 'react'
import type { Language, TranslationKey } from './translations.ts'

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  /** 取文案，支持 {name} 形式的占位符 */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage 必须在 <LanguageProvider> 内使用')
  return value
}
