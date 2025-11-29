import express from 'express'
import {
  getAllFeedback,
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getUnreadFeedbackCount,
  exportFeedback,
  clearAllFeedback
} from '../services/feedbackService'
import dingtalkService from '../services/dingtalkService'

const router = express.Router()

/**
 * 获取真实客户端 IP
 */
function getClientIP(req: any): string {
  // 尝试从多个来源获取客户端真实 IP
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.connection.socket?.remoteAddress ||
         'unknown'
}

/**
 * 根据 IP 获取位置信息
 */
async function getLocationFromIP(ip: string): Promise<string> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    return '未知'
  }

  try {
    // 尝试第一个 API：ipapi.co
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await response.json() as any
      if (data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`
      }
      if (data.country_name) {
        return data.country_name
      }
    } catch (e) {
      // 继续尝试下一个 API
    }

    // 尝试第二个 API：ip-api.com
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`)
      const data = await response.json() as any
      if (data.status === 'success') {
        if (data.city && data.country) {
          return `${data.city}, ${data.country}`
        }
        if (data.country) {
          return data.country
        }
      }
    } catch (e) {
      // 继续尝试下一个 API
    }

    // 尝试第三个 API：geoip-db.com
    try {
      const response = await fetch(`https://geoip-db.com/json/${ip}`)
      const data = await response.json() as any
      if (data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`
      }
      if (data.country_name) {
        return data.country_name
      }
    } catch (e) {
      // 所有 API 都失败
    }

    return '未知'
  } catch (error) {
    return '未知'
  }
}

/**
 * 获取所有反馈
 */
router.get('/', async (req, res) => {
  try {
    const feedback = await getAllFeedback()
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('获取反馈失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取反馈失败'
    })
  }
})

/**
 * 创建反馈
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, orderNumber, subject, message, userAgent } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      })
    }

    // 获取真实客户端 IP
    const clientIP = getClientIP(req)

    const feedback = await createFeedback({
      name,
      email,
      orderNumber,
      subject,
      message,
      ip: clientIP,
      userAgent
    })

    // 获取用户位置信息（基于IP）
    const location = await getLocationFromIP(clientIP)

    // 获取用户本地时间（客户端时区）
    // 由客户端在请求时提供客户端时间戳
    const clientTimestamp = req.body.clientTimestamp || Date.now();
    const userTime = new Date(clientTimestamp).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai'
    });

    // 发送钉钉通知（异步，不阻塞主流程）
    dingtalkService.notifyFormSubmission({
      type: 'feedback',
      name,
      title: subject,
      content: message,
      email,
      orderNumber,
      location,
      timestamp: userTime
    }).catch(() => {
      // 静默处理钉钉发送错误
    })

    res.status(201).json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('创建反馈失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建反馈失败'
    })
  }
})

/**
 * 更新反馈状态
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const feedback = await updateFeedbackStatus(id, { status })

    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    console.error('更新反馈状态失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新反馈状态失败'
    })
  }
})

/**
 * 删除反馈
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await deleteFeedback(id)

    res.json({
      success: true,
      message: '反馈删除成功'
    })
  } catch (error) {
    console.error('删除反馈失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除反馈失败'
    })
  }
})

/**
 * 获取未读反馈数量
 */
router.get('/unread/count', async (req, res) => {
  try {
    const count = await getUnreadFeedbackCount()
    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('获取未读反馈数量失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取未读反馈数量失败'
    })
  }
})

/**
 * 导出反馈数据
 */
router.get('/export', async (req, res) => {
  try {
    const data = await exportFeedback()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=feedback-${new Date().toISOString().split('T')[0]}.json`)
    res.send(data)
  } catch (error) {
    console.error('导出反馈失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '导出反馈失败'
    })
  }
})

/**
 * 清空所有反馈
 */
router.delete('/', async (req, res) => {
  try {
    await clearAllFeedback()
    res.json({
      success: true,
      message: '所有反馈已清空'
    })
  } catch (error) {
    console.error('清空反馈失败:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '清空反馈失败'
    })
  }
})

export default router
