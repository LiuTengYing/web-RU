import { AdminSettings, IAdminSettings } from '../models/AdminSettings'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

export interface CreateAdminSettingsData {
  password: string
  sessionTimeout?: number
}

export interface UpdateAdminSettingsData {
  password?: string
  sessionTimeout?: number
}

/**
 * 获取管理员设置
 */
export const getAdminSettings = async (): Promise<IAdminSettings | null> => {
  const isDbConnected = mongoose.connection.readyState === 1
  
  // 如果数据库未连接，直接返回null（不抛出错误，允许前端处理）
  if (!isDbConnected) {
    return null
  }
  
  try {
    const settings = await AdminSettings.findOne().maxTimeMS(2000).exec()
    return settings
  } catch (error) {
    // 查询失败，返回null（不抛出错误，允许前端处理）
    console.warn('获取管理员设置失败:', error)
    return null
  }
}

/**
 * 创建管理员设置
 */
export const createAdminSettings = async (data: CreateAdminSettingsData): Promise<IAdminSettings> => {
  try {
    // 检查是否已存在
    const existing = await AdminSettings.findOne()
    if (existing) {
      throw new Error('管理员设置已存在')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const settings = new AdminSettings({
      password: hashedPassword,
      sessionTimeout: data.sessionTimeout || 3600000
    })

    const savedSettings = await settings.save()
    return savedSettings
  } catch (error) {
    console.error('创建管理员设置失败:', error)
    throw error
  }
}

/**
 * 更新管理员设置
 */
export const updateAdminSettings = async (data: UpdateAdminSettingsData): Promise<IAdminSettings> => {
  try {
    const settings = await AdminSettings.findOne()
    if (!settings) {
      throw new Error('管理员设置不存在')
    }

    const updateData: any = {}
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }
    
    if (data.sessionTimeout !== undefined) {
      updateData.sessionTimeout = data.sessionTimeout
    }

    const updatedSettings = await AdminSettings.findOneAndUpdate(
      {},
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedSettings) {
      throw new Error('更新管理员设置失败')
    }

    return updatedSettings
  } catch (error) {
    console.error('更新管理员设置失败:', error)
    throw error
  }
}

/**
 * 验证管理员密码
 */
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  const defaultPassword = 'admin123'
  const isProduction = process.env.NODE_ENV === 'production'
  
  try {
    const readyState = mongoose.connection.readyState
    const isDbConnected = readyState === 1
    
    console.log(`🔍 密码验证 - 环境: ${isProduction ? 'production' : 'development'}, 数据库状态: ${readyState} (${readyState === 0 ? 'disconnected' : readyState === 1 ? 'connected' : readyState === 2 ? 'connecting' : 'disconnecting'})`)
    
    // 生产环境：强制要求数据库连接
    if (isProduction && !isDbConnected) {
      console.error('❌ 生产环境需要数据库连接，密码验证失败')
      throw new Error('生产环境需要数据库连接')
    }
    
    // 开发环境：数据库未连接时使用默认密码
    if (!isDbConnected) {
      const isValid = password === defaultPassword
      if (isValid) {
        console.log('✅ 开发环境：数据库未连接，使用默认密码验证通过')
      } else {
        console.log('❌ 开发环境：密码错误（期望: admin123）')
      }
      return isValid
    }
  } catch (checkError) {
    // 如果检查数据库状态时出错，开发环境允许默认密码
    console.warn('⚠️ 检查数据库状态时出错:', checkError)
    if (!isProduction) {
      return password === defaultPassword
    }
    throw checkError
  }
  
  // 数据库已连接，从数据库验证
  try {
    const settings = await AdminSettings.findOne().maxTimeMS(2000).exec()
    
    console.log('📋 数据库查询结果:', {
      找到设置: !!settings,
      密码哈希前20位: settings?.password?.substring(0, 20),
      输入的密码: password,
      密码长度: password.length
    })
    
    if (settings) {
      // 数据库中有设置，使用bcrypt验证
      console.log('🔑 开始 bcrypt.compare...')
      const isMatch = await bcrypt.compare(password, settings.password)
      console.log('🔑 bcrypt.compare 结果:', isMatch)
      return isMatch
    }
    
    // 数据库中没有设置，首次使用默认密码
    if (password === defaultPassword) {
      try {
        const hashedPassword = await bcrypt.hash(defaultPassword, 12)
        await AdminSettings.create({
          password: hashedPassword,
          sessionTimeout: 3600000
        })
        console.log('✅ 已创建管理员设置，默认密码: admin123')
        return true
      } catch (createError) {
        // 创建失败，开发环境允许默认密码，生产环境不允许
        if (!isProduction) {
          console.warn('⚠️ 创建管理员设置失败，但允许默认密码登录:', createError)
          return true
        }
        throw createError
      }
    }
    
    return false
    
  } catch (error) {
    // 数据库查询失败
    if (isProduction) {
      // 生产环境：不允许降级，抛出错误
      console.error('❌ 生产环境数据库查询失败:', error)
      throw error
    } else {
      // 开发环境：允许默认密码降级
      console.warn('⚠️ 开发环境：数据库查询失败，检查默认密码:', error)
      return password === defaultPassword
    }
  }
}
