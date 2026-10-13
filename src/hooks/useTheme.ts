import { useEffect, useState } from 'react'
import { applyTheme, getSavedTheme, saveTheme, type Theme } from '../lib/theme'

/** Light by default; the header toggle switches to dark and remembers the choice. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() ?? 'light')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}
