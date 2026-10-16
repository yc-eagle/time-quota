import { useCallback, useEffect, useState } from 'react'
import { readTheme, writeTheme, type ThemeName } from '../lib/storage.ts'

export interface UseThemeResult {
  theme: ThemeName
  toggleTheme: () => void
}

/** 主题挂在 <html data-theme> 上，CSS 变量负责具体配色 */
export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<ThemeName>(() => readTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
