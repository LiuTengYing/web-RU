import { PasswordSettings, IPasswordSettings } from '../models/PasswordSettings'

export interface CreatePasswordSettingsData {
  mode: 'default' | 'custom'
  customPassword?: string
  viewerEnabled?: boolean
}

export interface UpdatePasswordSettingsData {
  mode?: 'default' | 'custom'
  customPassword?: string
  viewerEnabled?: boolean
}

/**
 * 获取密码设置
 */
export const getPasswordSettings = async (): Promise<IPasswordSettings | null> => {
  try {
    const settings = await PasswordSettings.findOne()
    return settings
  } catch (error) {
    console.error('获取密码设置失败:', error)
    throw new Error('获取密码设置失败')
  }
}

/**
 * 创建密码设置
 */
export const createPasswordSettings = async (data: CreatePasswordSettingsData): Promise<IPasswordSettings> => {
  try {
    // 检查是否已存在
    const existing = await PasswordSettings.findOne()
    if (existing) {
      throw new Error('密码设置已存在')
    }

    const settings = new PasswordSettings({
      mode: data.mode,
      customPassword: data.customPassword || '',
      viewerEnabled: data.viewerEnabled || false
    })

    const savedSettings = await settings.save()
    return savedSettings
  } catch (error) {
    console.error('创建密码设置失败:', error)
    throw error
  }
}

/**
 * 更新密码设置
 */
export const updatePasswordSettings = async (data: UpdatePasswordSettingsData): Promise<IPasswordSettings> => {
  try {
    const settings = await PasswordSettings.findOne()
    if (!settings) {
      throw new Error('密码设置不存在')
    }

    const updatedSettings = await PasswordSettings.findOneAndUpdate(
      {},
      data,
      { new: true, runValidators: true }
    )

    if (!updatedSettings) {
      throw new Error('更新密码设置失败')
    }

    return updatedSettings
  } catch (error) {
    console.error('更新密码设置失败:', error)
    throw error
  }
}

/**
 * 获取当前密码
 */
export const getCurrentPassword = async (): Promise<string> => {
  try {
    const settings = await PasswordSettings.findOne()
    if (!settings) {
      return 'admin123' // 默认密码
    }

    if (settings.mode === 'custom' && settings.customPassword) {
      return settings.customPassword
    }

    return 'admin123' // 默认密码
  } catch (error) {
    console.error('获取当前密码失败:', error)
    return 'admin123' // 默认密码
  }
}
