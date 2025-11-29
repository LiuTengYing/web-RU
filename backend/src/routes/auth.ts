import express from 'express'
import {
  createAuthSession,
  checkAuthStatus,
  refreshAuth,
  logout,
  migrateFromLocalStorage
} from '../services/authService'
import { verifyAdminPassword } from '../services/adminSettingsService'
import crypto from 'crypto'
import mongoose from 'mongoose'

// 扩展Session接口
declare module 'express-session' {
  interface SessionData {
    sessionId?: string
  }
}

const router = express.Router()

/**
 * 生成会话ID中间件
 */
const generateSessionId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session?.sessionId) {
    if (!req.session) {
      req.session = {} as any
    }
    req.session.sessionId = crypto.randomBytes(32).toString('hex')
  }
  next()
}

/**
 * 登录
 */
router.post('/login', generateSessionId, async (req, res) => {
  try {
    const { password } = req.body
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: '请输入密码'
      })
    }

    console.log('🔐 开始验证密码，数据库状态:', mongoose.connection.readyState)
    
    // 使用数据库中的管理员设置验证密码
    const isValidPassword = await verifyAdminPassword(password)
    console.log('🔐 密码验证结果:', isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '密码错误'
      })
    }

    const sessionId = req.session.sessionId
    if (!sessionId) {
      return res.status(500).json({
        success: false,
        error: '会话ID生成失败'
      })
    }
    
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent')

    console.log('🔐 创建认证会话...')
    const authStatus = await createAuthSession(sessionId, ipAddress, userAgent)
    console.log('🔐 认证会话创建成功:', authStatus)
    
    res.json({
      success: true,
      authStatus
    })
  } catch (error) {
    console.error('❌ 登录失败 - 详细错误:', error)
    console.error('❌ 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')
    // 返回详细的错误信息，便于调试
    const errorMessage = error instanceof Error ? error.message : '登录失败'
    res.status(500).json({
      success: false,
      error: errorMessage
    })
  }
})

/**
 * 检查认证状态
 */
router.get('/status', generateSessionId, async (req, res) => {
  try {
    const sessionId = req.session.sessionId
    if (!sessionId) {
      return res.status(500).json({
        success: false,
        error: '会话ID生成失败'
      })
    }
    const authStatus = await checkAuthStatus(sessionId)
    
    res.json({
      success: true,
      authStatus
    })
  } catch (error) {
    console.error('检查认证状态失败:', error)
    res.status(500).json({
      success: false,
      error: '检查认证状态失败'
    })
  }
})

/**
 * 刷新认证
 */
router.post('/refresh', generateSessionId, async (req, res) => {
  try {
    const sessionId = req.session.sessionId
    if (!sessionId) {
      return res.status(500).json({
        success: false,
        error: '会话ID生成失败'
      })
    }
    const authStatus = await refreshAuth(sessionId)
    
    res.json({
      success: true,
      authStatus
    })
  } catch (error) {
    console.error('刷新认证失败:', error)
    res.status(401).json({
      success: false,
      error: '刷新认证失败'
    })
  }
})

/**
 * 登出
 */
router.post('/logout', generateSessionId, async (req, res) => {
  try {
    const sessionId = req.session.sessionId
    if (!sessionId) {
      return res.status(500).json({
        success: false,
        error: '会话ID生成失败'
      })
    }
    await logout(sessionId)
    
    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    console.error('登出失败:', error)
    res.status(500).json({
      success: false,
      error: '登出失败'
    })
  }
})

/**
 * 从localStorage迁移认证状态
 */
router.post('/migrate', generateSessionId, async (req, res) => {
  try {
    const { isAuthenticated, expiresAt, lastLogin } = req.body
    const sessionId = req.session.sessionId
    
    if (!sessionId) {
      return res.status(500).json({
        success: false,
        error: '会话ID生成失败'
      })
    }
    
    if (!isAuthenticated || !expiresAt) {
      return res.status(400).json({
        success: false,
        error: '无效的认证数据'
      })
    }

    const success = await migrateFromLocalStorage(sessionId, {
      isAuthenticated,
      expiresAt,
      lastLogin
    })
    
    if (success) {
      res.json({
        success: true,
        message: '认证状态迁移成功'
      })
    } else {
      res.status(400).json({
        success: false,
        error: '认证状态已过期或无效'
      })
    }
  } catch (error) {
    console.error('迁移认证状态失败:', error)
    res.status(500).json({
      success: false,
      error: '迁移认证状态失败'
    })
  }
})

export default router
