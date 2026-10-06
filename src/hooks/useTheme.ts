import { useEffect, useState } from 'react'
import { applyTheme, getSavedTheme, saveTheme, systemTheme, type Theme } from '../lib/theme'

/** Follows the system setting until the user flips the toggle, then remembers their choice. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() ?? systemTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!getSavedTheme()) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}
