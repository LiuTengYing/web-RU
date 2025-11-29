import express from 'express'
import { imageService } from '../services/imageService'

const router = express.Router()

// 获取所有图片
router.get('/', async (req, res) => {
  try {
    const images = await imageService.getImages()
    res.json({ success: true, images })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取图片失败' })
  }
})

// 更新图片
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const success = await imageService.updateImage(id, updates)
    res.json({ success })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新图片失败' })
  }
})

// 删除图片
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const success = await imageService.deleteImage(id)
    res.json({ success })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除图片失败' })
  }
})

// 添加新图片
router.post('/', async (req, res) => {
  try {
    const imageData = req.body
    const success = await imageService.addImage(imageData)
    res.json({ success })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加图片失败' })
  }
})

// 重置为默认图片
router.post('/reset', async (req, res) => {
  try {
    const success = await imageService.resetToDefault()
    res.json({ success })
  } catch (error) {
    res.status(500).json({ success: false, error: '重置图片失败' })
  }
})

export default router
