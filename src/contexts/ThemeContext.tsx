'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lock to dark mode for premium sports aesthetic
  const [theme] = useState<Theme>('dark')

  useEffect(() => {
    // Force dark class on document element
    document.documentElement.classList.add('dark')
    // Remove any legacy theme settings
    localStorage.removeItem('theme')
  }, [])

  const toggleTheme = () => {
    // No-op to prevent changes if called
    console.warn('Theme is locked to Dark Mode for this application.')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
