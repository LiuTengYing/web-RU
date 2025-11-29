import express from 'express'
import {
  getDocumentFeedback,
  getAllFeedback,
  createFeedback,
  addReply,
  deleteFeedback,
  deleteReply,
  getFeedbackStats,
  getUnrepliedFeedbackCount,
  migrateFromLocalStorage
} from '../services/documentFeedbackService'
import dingtalkService from '../services/dingtalkService'
import { DocumentService } from '../services/documentService'

const router = express.Router()
const documentService = new DocumentService()

/**
 * 获取所有反馈（管理后台使用）
 */
router.get('/all/admin', async (req, res) => {
  try {
    const feedback = await getAllFeedback()
    
    // 获取每个反馈对应的文档信息
    const feedbackWithDocs = await Promise.all(
      feedback.map(async (item) => {
        let documentInfo = {
          title: `文档ID: ${item.documentId}`,
          type: 'unknown'
        }
        
        // 尝试从不同类型的文档中获取信息
        try {
          // 先尝试作为结构化文档
          let doc = await documentService.getDocument(item.documentId, 'structured')
          if (doc) {
            documentInfo.title = doc.title || `文档ID: ${item.documentId}`
            documentInfo.type = 'structured'
            // 如果有车型信息，添加到标题中
            if (doc.basicInfo) {
              const { brand, model, yearRange } = doc.basicInfo
              const vehicleInfo = `${brand || ''} ${model || ''} ${yearRange || ''}`.trim()
              if (vehicleInfo) {
                documentInfo.title = `${vehicleInfo} - ${documentInfo.title}`
              }
            }
            return { ...item, documentInfo }
          }
          
          // 尝试作为视频教程
          doc = await documentService.getDocument(item.documentId, 'video')
          if (doc) {
            documentInfo.title = doc.title || `文档ID: ${item.documentId}`
            documentInfo.type = 'video'
            return { ...item, documentInfo }
          }
          
          // 尝试作为图文教程
          doc = await documentService.getDocument(item.documentId, 'general')
          if (doc) {
            documentInfo.title = doc.title || `文档ID: ${item.documentId}`
            documentInfo.type = 'image-text'
            return { ...item, documentInfo }
          }
        } catch (error) {
          console.log(`获取文档信息失败 (ID: ${item.documentId}):`, error)
        }
        
        return { ...item, documentInfo }
      })
    )
    
    res.json({
      success: true,
      feedback: feedbackWithDocs
    })
  } catch (error) {
    console.error('获取所有反馈失败:', error)
    res.status(500).json({
      success: false,
      error: '获取所有反馈失败'
    })
  }
})

/**
 * 获取文档的所有反馈
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params
    const feedback = await getDocumentFeedback(documentId)
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('获取文档反馈失败:', error)
    res.status(500).json({
      success: false,
      error: '获取文档反馈失败'
    })
  }
})

/**
 * 创建用户反馈
 */
router.post('/', async (req, res) => {
  try {
    const { documentId, author, content } = req.body
    
    if (!documentId || !author || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
    }

    const feedback = await createFeedback({
      documentId,
      author,
      content
    })

    // 获取文档信息以改善钉钉通知内容
    let documentTitle = `文档ID: ${documentId}` // 使用documentId作为后备标识
    let vehicleInfo = ''
    let documentType = 'unknown'
    try {
      // 尝试从不同类型的文档中获取信息
      let document = null
      
      // 先尝试作为结构化文档
      try {
        document = await documentService.getDocument(documentId, 'structured')
        if (document) {
          documentType = 'structured'
          documentTitle = document.title || `文档ID: ${documentId}`
          // 尝试从文档中提取车型信息
          if (document.basicInfo) {
            const { brand, model, yearRange } = document.basicInfo
            vehicleInfo = `${brand || ''} ${model || ''} ${yearRange || ''}`.trim()
          }
        }
      } catch (e) {
        // 继续尝试其他类型
      }
      
      // 如果不是结构化文档，尝试视频教程
      if (!document) {
        try {
          document = await documentService.getDocument(documentId, 'video')
          if (document) {
            documentType = 'video'
            documentTitle = document.title || `文档ID: ${documentId}`
          }
        } catch (e) {
          // 继续尝试其他类型
        }
      }
      
      // 如果不是视频教程，尝试图文教程
      if (!document) {
        try {
          document = await documentService.getDocument(documentId, 'general')
          if (document) {
            documentType = 'image-text'
            documentTitle = document.title || `文档ID: ${documentId}`
          }
        } catch (e) {
          console.log('无法识别文档类型，使用documentId作为标识')
        }
      }
    } catch (error) {
      console.log('获取文档信息失败，使用documentId作为标识:', error)
      // 如果获取失败，documentTitle已经设置为documentId，无需额外处理
    }

    // 发送钉钉通知（异步，不阻塞主流程）
    dingtalkService.notifyFormSubmission({
      type: 'document-feedback',
      documentType: documentType as 'structured' | 'video' | 'image-text' | 'unknown',
      name: author,
      title: vehicleInfo ? `${vehicleInfo} - ${documentTitle}` : documentTitle,
      content: content,
      timestamp: new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai'
      })
    }).catch((error) => {
      console.error('发送钉钉通知失败:', error)
      // 静默处理钉钉发送错误，不影响主流程
    })
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('创建反馈失败:', error)
    res.status(500).json({
      success: false,
      error: '创建反馈失败'
    })
  }
})

/**
 * 添加管理员回复
 */
router.post('/:feedbackId/reply', async (req, res) => {
  try {
    const { feedbackId } = req.params
    const { author, content, isAdmin } = req.body
    
    if (!author || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
    }

    const feedback = await addReply({
      feedbackId,
      author,
      content,
      isAdmin
    })
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('添加回复失败:', error)
    res.status(500).json({
      success: false,
      error: '添加回复失败'
    })
  }
})

/**
 * 删除反馈
 */
router.delete('/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params
    const success = await deleteFeedback(feedbackId)
    
    if (success) {
      res.json({
        success: true,
        message: '反馈删除成功'
      })
    } else {
      res.status(404).json({
        success: false,
        error: '反馈不存在'
      })
    }
  } catch (error) {
    console.error('删除反馈失败:', error)
    res.status(500).json({
      success: false,
      error: '删除反馈失败'
    })
  }
})

/**
 * 删除回复
 */
router.delete('/:feedbackId/reply/:replyId', async (req, res) => {
  try {
    const { feedbackId, replyId } = req.params
    const feedback = await deleteReply(feedbackId, replyId)
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('删除回复失败:', error)
    res.status(500).json({
      success: false,
      error: '删除回复失败'
    })
  }
})

/**
 * 获取反馈统计
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await getFeedbackStats()
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取反馈统计失败'
    })
  }
})

/**
 * 获取未回复的留言数量
 */
router.get('/stats/unreplied', async (req, res) => {
  try {
    const count = await getUnrepliedFeedbackCount()
    
    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('获取未回复留言数量失败:', error)
    res.status(500).json({
      success: false,
      error: '获取未回复留言数量失败'
    })
  }
})

/**
 * 从localStorage迁移数据
 */
router.post('/migrate/localStorage', async (req, res) => {
  try {
    const { localData } = req.body
    
    if (!Array.isArray(localData)) {
      return res.status(400).json({
        success: false,
        error: 'localData必须是数组'
      })
    }

    const migratedCount = await migrateFromLocalStorage(localData)
    
    res.json({
      success: true,
      migratedCount,
      message: `成功迁移 ${migratedCount} 条反馈数据`
    })
  } catch (error) {
    console.error('迁移数据失败:', error)
    res.status(500).json({
      success: false,
      error: '迁移数据失败'
    })
  }
})

export default router
