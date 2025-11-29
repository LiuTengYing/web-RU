import express from 'express'
import {
  getAllContactInfo,
  getAllContactInfoForAdmin,
  createContactInfo,
  updateContactInfo,
  deleteContactInfo,
  toggleContactInfoStatus
} from '../services/contactService'

const router = express.Router()

/**
 * 获取所有活跃的联系信息（前端使用）
 */
router.get('/', async (req, res) => {
  try {
    const contactInfo = await getAllContactInfo()
    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    console.error('获取联系信息失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取联系信息失败'
    })
  }
})

/**
 * 获取所有联系信息（管理后台使用）
 */
router.get('/admin', async (req, res) => {
  try {
    const contactInfo = await getAllContactInfoForAdmin()
    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    console.error('获取联系信息失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取联系信息失败'
    })
  }
})

/**
 * 创建联系信息
 */
router.post('/', async (req, res) => {
  try {
    const { type, label, value, icon, isActive, order } = req.body

    // 验证必要字段
    if (!type || !label || !value || !icon) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      })
    }

    const contactInfo = await createContactInfo({
      type,
      label,
      value,
      icon,
      isActive,
      order
    })

    res.status(201).json({
      success: true,
      contactInfo
    })
  } catch (error) {
    console.error('创建联系信息失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建联系信息失败'
    })
  }
})

/**
 * 更新联系信息
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const contactInfo = await updateContactInfo(id, updateData)

    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    console.error('更新联系信息失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新联系信息失败'
    })
  }
})

/**
 * 删除联系信息
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await deleteContactInfo(id)

    res.json({
      success: true,
      message: '联系信息删除成功'
    })
  } catch (error) {
    console.error('删除联系信息失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除联系信息失败'
    })
  }
})

/**
 * 切换联系信息状态
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params

    const contactInfo = await toggleContactInfoStatus(id)

    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    console.error('切换联系信息状态失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '切换联系信息状态失败'
    })
  }
})

export default router
