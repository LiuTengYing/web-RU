/**
 * 认证配置文件
 * 管理知识库的访问密码
 */

// 访问密码配置
export const AUTH_CONFIG = {
  // 访问密码 - 请修改为您需要的密码
  ACCESS_PASSWORD: 'android123',
  
  // 本地存储键名
  STORAGE_KEY: 'kb_authenticated',
  
  // 会话超时时间（毫秒）- 24小时
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
}

/**
 * 验证密码
 * @param password 用户输入的密码
 * @returns 是否验证成功
 */
export const validatePassword = (password: string): boolean => {
  return password === AUTH_CONFIG.ACCESS_PASSWORD
}
