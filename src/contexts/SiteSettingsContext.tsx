import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSiteSettings, SiteSettings } from '../services/siteSettingsService'

interface SiteSettingsContextType {
  siteSettings: SiteSettings
  loading: boolean
  refreshSiteSettings: () => Promise<void>
}

const defaultSiteSettings: SiteSettings = {
  siteName: 'AutomotiveHu',
  siteSubtitle: 'Professional Aftermarket Car Navigation & Compatibility Solutions',
  logoText: 'AutomotiveHu',
  heroTitle: 'AutomotiveHu',
  heroSubtitle: 'Professional Aftermarket Car Navigation & Compatibility Solutions'
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

interface SiteSettingsProviderProps {
  children: ReactNode
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [loading, setLoading] = useState(true)

  const loadSiteSettings = async () => {
    try {
      setLoading(true)
      const settings = await getSiteSettings()
      setSiteSettings(settings)
    } catch (error) {
      console.error('Failed to load site settings:', error)
      // 使用默认设置
      setSiteSettings(defaultSiteSettings)
    } finally {
      setLoading(false)
    }
  }

  const refreshSiteSettings = async () => {
    await loadSiteSettings()
  }

  useEffect(() => {
    loadSiteSettings()
  }, [])

  // 更新页面标题
  useEffect(() => {
    if (!loading && siteSettings.siteName) {
      document.title = siteSettings.siteName
    }
  }, [siteSettings.siteName, loading])

  return (
    <SiteSettingsContext.Provider value={{
      siteSettings,
      loading,
      refreshSiteSettings
    }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}
