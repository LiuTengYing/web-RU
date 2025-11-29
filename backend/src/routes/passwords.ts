import express from 'express'
import {
  getPasswordSettings,
  createPasswordSettings,
  updatePasswordSettings,
  getCurrentPassword
} from '../services/passwordSettingsService'

const router = express.Router()

/**
 * 获取密码设置
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await getPasswordSettings()
    res.json({
      success: true,
      settings: settings ? {
        mode: settings.mode,
        viewerEnabled: settings.viewerEnabled
      } : {
        mode: 'default',
        viewerEnabled: false
      }
    })
  } catch (error) {
    console.error('获取密码设置失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取密码设置失败'
    })
  }
})

/**
 * 创建密码设置
 */
router.post('/settings', async (req, res) => {
  try {
    const { mode, customPassword, viewerEnabled } = req.body

    if (!mode) {
      return res.status(400).json({
        success: false,
        error: '模式是必需的'
      })
    }

    const settings = await createPasswordSettings({
      mode,
      customPassword,
      viewerEnabled
    })

    res.status(201).json({
      success: true,
      settings: {
        mode: settings.mode,
        viewerEnabled: settings.viewerEnabled
      }
    })
  } catch (error) {
    console.error('创建密码设置失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建密码设置失败'
    })
  }
})

/**
 * 更新密码设置
 */
router.put('/settings', async (req, res) => {
  try {
    const { mode, customPassword, viewerEnabled } = req.body

    const updateData: any = {}
    if (mode) updateData.mode = mode
    if (customPassword !== undefined) updateData.customPassword = customPassword
    if (viewerEnabled !== undefined) updateData.viewerEnabled = viewerEnabled

    const settings = await updatePasswordSettings(updateData)

    res.json({
      success: true,
      settings: {
        mode: settings.mode,
        viewerEnabled: settings.viewerEnabled
      }
    })
  } catch (error) {
    console.error('更新密码设置失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新密码设置失败'
    })
  }
})

/**
 * 获取当前密码
 */
router.get('/current', async (req, res) => {
  try {
    const password = await getCurrentPassword()
    res.json({
      success: true,
      password
    })
  } catch (error) {
    console.error('获取当前密码失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取当前密码失败'
    })
  }
})

export default router
