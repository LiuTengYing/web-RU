/**
 * 管理员服务
 * 管理管理员密码和系统设置
 */

// 默认管理员密码
const DEFAULT_PASSWORD = 'admin123'

// 管理员设置接口
export interface AdminSettings {
  sessionTimeout: number // 会话超时时间（毫秒）
}

// 管理员设置更新接口（包含密码）
export interface AdminSettingsUpdate {
  password?: string
  sessionTimeout?: number
}

/**
 * 获取管理员设置
 */
export const getAdminSettings = async (): Promise<AdminSettings> => {
  try {
    const response = await fetch('/api/admin/settings', {
      credentials: 'include' // 确保发送cookie和session信息
    })
    
    // 先检查响应状态
    if (!response.ok) {
      // 响应失败，返回默认值
      console.warn('获取管理员设置失败，状态码:', response.status)
      return { sessionTimeout: 3600000 } // 默认1小时
    }
    
    // 响应成功，解析JSON
    const data = await response.json()
    
    if (data.success && data.settings) {
      return data.settings
    }
    return { sessionTimeout: 3600000 } // 默认1小时
  } catch (error) {
    // 网络错误或JSON解析失败
    console.error('获取管理员设置失败:', error)
    return { sessionTimeout: 3600000 }
  }
}

/**
 * 更新管理员设置
 */
export const updateAdminSettings = async (updates: AdminSettingsUpdate): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 确保发送cookie和session信息
      body: JSON.stringify(updates)
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('更新管理员设置失败:', error)
    return false
  }
}

/**
 * 验证管理员密码
 */
export const validateAdminPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 确保发送cookie和session信息
      body: JSON.stringify({ password })
    })
    
    const data = await response.json()
    return data.success && data.isValid
  } catch (error) {
    console.error('验证管理员密码失败:', error)
    return false
  }
}

/**
 * 更新管理员密码和设置
 */
export const updateAdminPasswordAndSettings = async (updates: any): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 确保发送cookie和session信息
      body: JSON.stringify(updates)
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('更新管理员密码和设置失败:', error)
    return false
  }
}

/**
 * 创建管理员设置（初始化）
 */
export const createAdminSettings = async (password: string, sessionTimeout?: number): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 确保发送cookie和session信息
      body: JSON.stringify({ password, sessionTimeout })
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('创建管理员设置失败:', error)
    return false
  }
}

/**
 * 获取管理员密码（兼容性函数，返回默认密码）
 */
export const getAdminPassword = (): string => {
  return DEFAULT_PASSWORD
}

/**
 * 设置管理员密码（兼容性函数）
 */
export const setAdminPassword = async (newPassword: string): Promise<boolean> => {
  try {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('密码长度至少6位')
    }
    
    return await updateAdminPasswordAndSettings({ password: newPassword.trim() })
  } catch (error) {
    console.error('设置管理员密码失败:', error)
    return false
  }
}

/**
 * 保存管理员设置（兼容性函数）
 */
export const saveAdminSettings = async (settings: AdminSettings): Promise<boolean> => {
  return await updateAdminSettings(settings)
}

/**
 * 重置管理员密码为默认密码
 */
export const resetAdminPassword = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 确保发送cookie和session信息
      body: JSON.stringify({ password: DEFAULT_PASSWORD })
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('重置管理员密码失败:', error)
    return false
  }
}

/**
 * 获取会话超时时间（毫秒）
 */
export const getSessionTimeout = async (): Promise<number> => {
  const settings = await getAdminSettings()
  return settings.sessionTimeout
}

/**
 * 检查密码强度
 */
export const checkPasswordStrength = (password: string): {
  isValid: boolean
  message: string
  strength: 'weak' | 'medium' | 'strong'
} => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: '密码长度至少6位',
      strength: 'weak'
    }
  }
  
  if (password.length < 8) {
    return {
      isValid: true,
      message: '密码强度：弱',
      strength: 'weak'
    }
  }
  
  // 检查是否包含数字和字母
  const hasNumber = /\d/.test(password)
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (hasNumber && hasLetter && hasSpecial && password.length >= 10) {
    return {
      isValid: true,
      message: '密码强度：强',
      strength: 'strong'
    }
  } else if (hasNumber && hasLetter) {
    return {
      isValid: true,
      message: '密码强度：中等',
      strength: 'medium'
    }
  } else {
    return {
      isValid: true,
      message: '密码强度：弱',
      strength: 'weak'
    }
  }
}

/**
 * 初始化管理员设置
 */
export const initializeAdminSettings = async (): Promise<void> => {
  try {
    // 尝试获取设置，如果失败则创建默认设置
    const settings = await getAdminSettings()
    if (!settings) {
      // 首次初始化
      await createAdminSettings(DEFAULT_PASSWORD, 3600000)
    }
  } catch (error) {
    console.error('初始化管理员设置失败:', error)
  }
} 