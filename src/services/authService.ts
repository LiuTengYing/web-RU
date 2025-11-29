/**
 * 认证服务 - 重构版本
 * 使用通用API客户端，消除重复代码
 */

import { apiClient } from './apiClient';

export interface AuthStatus {
  isAuthenticated: boolean;
  expiresAt?: number;
  lastLogin?: number;
}

export interface LoginData {
  password: string;
}

/**
 * 认证服务类
 * 使用通用API客户端，自动处理错误、重试等
 */
class AuthService {
  private baseEndpoint = '/auth';

  /**
   * 验证密码并登录
   */
  async login(password: string): Promise<AuthStatus> {
    const response = await apiClient.post<{ authStatus: AuthStatus }>(
      `${this.baseEndpoint}/login`,
      { password }
    );

    if (!response.success || !(response as any).authStatus) {
      throw new Error(response.error || '登录失败');
    }

    return (response as any).authStatus;
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseEndpoint}/logout`);
    } catch (error) {
      // 登出失败不抛出错误，只记录日志
      console.warn('登出请求失败:', error);
    }
  }

  /**
   * 检查认证状态
   */
  async checkAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await apiClient.get<{ authStatus: AuthStatus }>(
        `${this.baseEndpoint}/status`
      );

      if (response.success && (response as any).authStatus) {
        return (response as any).authStatus;
      }
    } catch (error) {
      // 网络错误或其他异常，返回未认证状态
      console.warn('检查认证状态失败:', error);
    }

    return { isAuthenticated: false };
  }

  /**
   * 刷新认证状态
   */
  async refreshAuth(): Promise<AuthStatus> {
    const response = await apiClient.post<{ authStatus: AuthStatus }>(
      `${this.baseEndpoint}/refresh`
    );

    if (!response.success || !(response as any).authStatus) {
      throw new Error(response.error || '刷新认证失败');
    }

    return (response as any).authStatus;
  }

  /**
   * 验证管理员密码（不登录）
   */
  async verifyPassword(password: string): Promise<boolean> {
    const response = await apiClient.post<{ isValid: boolean }>(
      '/admin/verify',
      { password }
    );

    if (!response.success) {
      throw new Error(response.error || '密码验证失败');
    }

    return response.data?.isValid || false;
  }

  /**
   * 检查是否已认证（同步方法）
   */
  isAuthenticated(): boolean {
    // 这里可以检查本地存储的认证状态
    // 实际实现可能需要检查 localStorage 或其他持久化存储
    return false; // 简化实现
  }

  /**
   * 获取认证令牌（如果使用JWT）
   */
  getToken(): string | null {
    // 如果使用JWT，可以从localStorage获取
    return null; // 当前使用session，不需要token
  }
}

// 创建单例实例
export const authService = new AuthService();

// 导出默认实例
export default authService;

// 兼容旧API的包装函数
export const login = (password: string) => authService.login(password);
export const logout = () => authService.logout();
export const checkAuthStatus = () => authService.checkAuthStatus();
export const refreshAuth = () => authService.refreshAuth();

