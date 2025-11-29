import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme Provider Component
 * Manages application theme state - only supports dark mode
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('dark')

  // Set theme (fixed to dark)
  const setTheme = () => {
    // Do nothing, keep dark theme
  }

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.remove('light', 'dark')
    
    // Add dark theme class
    root.classList.add('dark')
    
    // Set data-theme attribute
    root.setAttribute('data-theme', 'dark')
  }, [])

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark: true
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to use theme
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 