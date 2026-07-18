'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'nex-theme'

// Dark/light theming only applies to logged-in areas (admin, client project
// area, applicant portal) — the public marketing site stays dark-only.
function isAuthedScope(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    /^\/(es|en)\/proyecto(\/|$)/.test(pathname) ||
    /^\/(es|en)\/careers\/portal(\/|$)/.test(pathname)
  )
}

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const inScope = isAuthedScope(pathname)
    if (!inScope) {
      document.documentElement.removeAttribute('data-theme')
      return
    }
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark'
    setTheme(stored)
    if (stored === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [pathname])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
      return next
    })
  }, [])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
