import SiteSettings, { ISiteSettings } from '../models/SiteSettings'

/**
 * 获取网站设置
 */
export const getSiteSettings = async (): Promise<ISiteSettings> => {
  try {
    let settings = await SiteSettings.findOne()
    
    // 如果没有设置记录，创建默认设置
    if (!settings) {
      settings = new SiteSettings({
        siteName: 'AutomotiveHu',
        siteSubtitle: 'Professional Aftermarket Car Navigation & Compatibility Solutions',
        logoText: 'AutomotiveHu',
        heroTitle: 'AutomotiveHu',
        heroSubtitle: 'Professional Aftermarket Car Navigation & Compatibility Solutions'
      })
      await settings.save()
    }
    
    return settings
  } catch (error) {
    console.error('获取网站设置失败:', error)
    throw error
  }
}

/**
 * 更新网站设置
 */
export const updateSiteSettings = async (settingsData: Partial<ISiteSettings>): Promise<ISiteSettings> => {
  try {
    let settings = await SiteSettings.findOne()
    
    if (!settings) {
      // 如果没有设置记录，创建新的
      settings = new SiteSettings(settingsData)
    } else {
      // 更新现有设置
      Object.assign(settings, settingsData)
    }
    
    await settings.save()
    console.log('网站设置更新成功:', settings)
    return settings
  } catch (error) {
    console.error('更新网站设置失败:', error)
    throw error
  }
}
