import express from 'express'
import { getAnnouncement, updateAnnouncement, toggleAnnouncement } from '../services/announcementService'

const router = express.Router()

/**
 * 获取公告设置
 */
router.get('/', async (req, res) => {
  try {
    const announcement = await getAnnouncement()
    
    res.json({
      success: true,
      announcement
    })
  } catch (error) {
    console.error('获取公告失败:', error)
    res.status(500).json({
      success: false,
      error: '获取公告失败'
    })
  }
})

/**
 * 更新公告设置
 */
router.put('/', async (req, res) => {
  try {
    const announcement = await updateAnnouncement(req.body)
    
    res.json({
      success: true,
      announcement
    })
  } catch (error) {
    console.error('更新公告失败:', error)
    res.status(500).json({
      success: false,
      error: '更新公告失败'
    })
  }
})

/**
 * 切换公告启用状态
 */
router.patch('/toggle', async (req, res) => {
  try {
    const { enabled } = req.body
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: '参数错误'
      })
    }
    
    const announcement = await toggleAnnouncement(enabled)
    
    res.json({
      success: true,
      announcement
    })
  } catch (error) {
    console.error('切换公告状态失败:', error)
    res.status(500).json({
      success: false,
      error: '切换公告状态失败'
    })
  }
})

export default router

