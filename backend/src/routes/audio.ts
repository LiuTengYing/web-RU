import express from 'express'
import {
  getAudioPresets,
  createAudioPreset,
  updateAudioPreset,
  deleteAudioPreset
} from '../services/audioPresetService'

const router = express.Router()

/**
 * 获取所有音频预设
 */
router.get('/', async (req, res) => {
  try {
    const presets = await getAudioPresets()
    res.json({
      success: true,
      presets
    })
  } catch (error) {
    console.error('获取音频预设失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取音频预设失败'
    })
  }
})

/**
 * 创建音频预设
 */
router.post('/', async (req, res) => {
  try {
    const { name, settings } = req.body

    if (!name || !settings) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      })
    }

    const preset = await createAudioPreset({
      name,
      settings
    })

    res.status(201).json({
      success: true,
      preset
    })
  } catch (error) {
    console.error('创建音频预设失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建音频预设失败'
    })
  }
})

/**
 * 更新音频预设
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const preset = await updateAudioPreset(id, updateData)

    res.json({
      success: true,
      preset
    })
  } catch (error) {
    console.error('更新音频预设失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新音频预设失败'
    })
  }
})

/**
 * 删除音频预设
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await deleteAudioPreset(id)

    res.json({
      success: true,
      message: '音频预设删除成功'
    })
  } catch (error) {
    console.error('删除音频预设失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除音频预设失败'
    })
  }
})

export default router
