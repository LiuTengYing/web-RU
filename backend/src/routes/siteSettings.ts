import express from 'express'
import { getSiteSettings, updateSiteSettings } from '../services/siteSettingsService'

const router = express.Router()

/**
 * GET /api/site-settings
 * 获取网站设置
 */
router.get('/', async (req, res) => {
  try {
    const settings = await getSiteSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('获取网站设置错误:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '服务器错误' 
    })
  }
})

/**
 * PUT /api/site-settings
 * 更新网站设置
 */
router.put('/', async (req, res) => {
  try {
    const { siteName, siteSubtitle, logoText, heroTitle, heroSubtitle } = req.body
    
    const settingsData = {
      siteName,
      siteSubtitle,
      logoText,
      heroTitle,
      heroSubtitle
    }
    
    const updatedSettings = await updateSiteSettings(settingsData)
    res.json({ success: true, data: updatedSettings })
  } catch (error) {
    console.error('更新网站设置错误:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '服务器错误' 
    })
  }
})

export default router
