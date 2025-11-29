import { Auth, IAuth } from '../models/Auth'
import crypto from 'crypto'
import mongoose from 'mongoose'

// 访问密码配置
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'android123'
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24小时

export interface AuthStatus {
  isAuthenticated: boolean
  expiresAt?: number
  lastLogin?: number
}

export interface LoginData {
  password: string
}

/**
 * 生成会话ID
 */
const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 验证密码
 */
export const validatePassword = (password: string): boolean => {
  return password === ACCESS_PASSWORD
}

/**
 * 创建或更新认证会话
 */
export const createAuthSession = async (sessionId: string, ipAddress?: string, userAgent?: string): Promise<AuthStatus> => {
  const expiresAt = Date.now() + SESSION_TIMEOUT
  const isProduction = process.env.NODE_ENV === 'production'
  const isDbConnected = mongoose.connection.readyState === 1
  
  // 生产环境：强制要求数据库连接
  if (isProduction && !isDbConnected) {
    throw new Error('生产环境需要数据库连接')
  }
  
  // 开发环境：数据库未连接时使用内存会话
  if (!isDbConnected) {
    return {
      isAuthenticated: true,
      expiresAt,
      lastLogin: Date.now()
    }
  }
  
  // 数据库已连接，保存到数据库
  try {
    const authSession = await Auth.findOneAndUpdate(
      { sessionId },
      {
        isAuthenticated: true,
        expiresAt: new Date(expiresAt),
        lastLogin: new Date(),
        ipAddress,
        userAgent
      },
      { upsert: true, new: true }
    ).maxTimeMS(2000).exec()

    return {
      isAuthenticated: true,
      expiresAt: authSession.expiresAt.getTime(),
      lastLogin: authSession.lastLogin.getTime()
    }
  } catch (error) {
    // 数据库操作失败
    if (isProduction) {
      // 生产环境：不允许降级，抛出错误
      console.error('❌ 生产环境数据库操作失败:', error)
      throw error
    } else {
      // 开发环境：使用内存会话降级
      console.warn('⚠️ 开发环境：数据库操作失败，使用内存会话:', error)
      return {
        isAuthenticated: true,
        expiresAt,
        lastLogin: Date.now()
      }
    }
  }
}

/**
 * 检查认证状态
 */
export const checkAuthStatus = async (sessionId: string): Promise<AuthStatus> => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDbConnected = mongoose.connection.readyState === 1
  
  // 生产环境：强制要求数据库连接
  if (isProduction && !isDbConnected) {
    // 生产环境数据库未连接，返回未认证
    return { isAuthenticated: false }
  }
  
  // 开发环境：数据库未连接时返回未认证（让用户重新登录）
  if (!isDbConnected) {
    return { isAuthenticated: false }
  }
  
  try {
    const authSession = await Auth.findOne({ sessionId }).maxTimeMS(2000).exec()
    
    if (!authSession || !authSession.isAuthenticated) {
      return { isAuthenticated: false }
    }

    // 检查是否过期
    if (new Date() > authSession.expiresAt) {
      await Auth.deleteOne({ sessionId })
      return { isAuthenticated: false }
    }

    return {
      isAuthenticated: true,
      expiresAt: authSession.expiresAt.getTime(),
      lastLogin: authSession.lastLogin.getTime()
    }
  } catch (error) {
    // 数据库操作失败
    console.warn('⚠️ 检查认证状态失败:', error)
    // 开发和生产环境都返回未认证，让用户重新登录
    return { isAuthenticated: false }
  }
}

/**
 * 刷新认证状态
 */
export const refreshAuth = async (sessionId: string): Promise<AuthStatus> => {
  try {
    const authSession = await Auth.findOne({ sessionId })
    
    if (!authSession || !authSession.isAuthenticated) {
      throw new Error('会话不存在或未认证')
    }

    // 检查是否过期
    if (new Date() > authSession.expiresAt) {
      await Auth.deleteOne({ sessionId })
      throw new Error('会话已过期')
    }

    // 延长过期时间
    const newExpiresAt = new Date(Date.now() + SESSION_TIMEOUT)
    authSession.expiresAt = newExpiresAt
    authSession.lastLogin = new Date()
    await authSession.save()

    return {
      isAuthenticated: true,
      expiresAt: newExpiresAt.getTime(),
      lastLogin: authSession.lastLogin.getTime()
    }
  } catch (error) {
    console.error('刷新认证失败:', error)
    throw error
  }
}

/**
 * 登出
 */
export const logout = async (sessionId: string): Promise<void> => {
  try {
    await Auth.deleteOne({ sessionId })
  } catch (error) {
    console.error('登出失败:', error)
    throw error
  }
}

/**
 * 清理过期会话
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const result = await Auth.deleteMany({
      expiresAt: { $lt: new Date() }
    })
    return result.deletedCount || 0
  } catch (error) {
    console.error('清理过期会话失败:', error)
    return 0
  }
}

/**
 * 从localStorage迁移认证状态
 */
export const migrateFromLocalStorage = async (sessionId: string, localData: any): Promise<boolean> => {
  try {
    if (!localData.isAuthenticated || !localData.expiresAt) {
      return false
    }

    // 检查是否过期
    if (Date.now() > localData.expiresAt) {
      return false
    }

    const expiresAt = new Date(localData.expiresAt)
    const lastLogin = new Date(localData.lastLogin || localData.expiresAt)

    await Auth.findOneAndUpdate(
      { sessionId },
      {
        isAuthenticated: true,
        expiresAt,
        lastLogin
      },
      { upsert: true }
    )

    return true
  } catch (error) {
    console.error('迁移认证状态失败:', error)
    return false
  }
}
