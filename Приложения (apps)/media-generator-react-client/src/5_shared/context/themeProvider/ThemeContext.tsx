import React, { useState, useEffect, createContext } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: (event?: React.MouseEvent) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  // return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' // ---  system theme
  return 'dark' // --- default dark theme
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = (event?: React.MouseEvent) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    if (event) {
      const x = event.clientX
      const y = event.clientY
      document.documentElement.style.setProperty('--vt-x', `${x}px`)
      document.documentElement.style.setProperty('--vt-y', `${y}px`)
    }

    document.startViewTransition(() => {
      setTheme(next)
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
