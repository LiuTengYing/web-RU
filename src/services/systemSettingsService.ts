/**
 * 系统设置服务
 * 管理系统级别的设置，如语言、主题等
 */

export interface SystemSettings {
  language: string
  theme?: string
}

/**
 * 获取系统设置
 */
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const response = await fetch('/api/system/settings')
    const data = await response.json()
    
    if (data.success && data.settings) {
      return data.settings
    }
    return {
      language: 'en',
      theme: 'dark'
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return {
      language: 'en',
      theme: 'dark'
    }
  }
}

/**
 * 更新系统设置
 */
export const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
  try {
    const response = await fetch('/api/system/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('更新系统设置失败:', error)
    return false
  }
}

/**
 * 创建系统设置
 */
export const createSystemSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    const response = await fetch('/api/system/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('创建系统设置失败:', error)
    return false
  }
}

/**
 * 获取或创建默认系统设置
 */
export const getOrCreateSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const settings = await getSystemSettings()
    if (!settings) {
      const defaultSettings: SystemSettings = {
        language: 'en',
        theme: 'dark'
      }
      await createSystemSettings(defaultSettings)
      return defaultSettings
    }
    return settings
  } catch (error) {
    console.error('获取或创建系统设置失败:', error)
    return {
      language: 'en',
      theme: 'dark'
    }
  }
}

/**
 * 设置语言
 */
export const setLanguage = async (language: string): Promise<boolean> => {
  try {
    return await updateSystemSettings({ language })
  } catch (error) {
    console.error('设置语言失败:', error)
    return false
  }
}

/**
 * 设置主题
 */
export const setTheme = async (theme: string): Promise<boolean> => {
  try {
    return await updateSystemSettings({ theme })
  } catch (error) {
    console.error('设置主题失败:', error)
    return false
  }
}

/**
 * 获取当前语言
 */
export const getCurrentLanguage = async (): Promise<string> => {
  try {
    const settings = await getSystemSettings()
    return settings.language
  } catch (error) {
    console.error('获取当前语言失败:', error)
    return 'en'
  }
}

/**
 * 获取当前主题
 */
export const getCurrentTheme = async (): Promise<string> => {
  try {
    const settings = await getSystemSettings()
    return settings.theme || 'dark'
  } catch (error) {
    console.error('获取当前主题失败:', error)
    return 'dark'
  }
}
