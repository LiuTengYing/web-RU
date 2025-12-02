/**
 * 认证上下文
 * 遵循SoC原则：专门处理用户认证状态
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/hooks/usePermissions';

/**
 * 认证上下文接口
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

/**
 * 登录凭据接口
 */
interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * 认证上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者属性
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证提供者组件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // 从localStorage获取token
        const token = localStorage.getItem('authToken');
        if (token) {
          // 验证token并获取用户信息
          const userData = await validateToken(token);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // 登录
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      // 调用登录API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        throw new Error('登录失败');
      }
      
      const { token, user: userData } = await response.json();
      
      // 保存token
      localStorage.setItem('authToken', token);
      
      // 设置用户信息
      setUser(userData);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 登出
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };
  
  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };
  
  // 验证token
  const validateToken = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      const { user: userData } = await response.json();
      return userData;
    } catch (error) {
      console.error('验证token失败:', error);
      return null;
    }
  };
  
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用认证上下文Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * 模拟用户数据（开发环境）
 */
export const createMockUser = (role: UserRole = UserRole.USER): User => ({
  id: 'mock-user-id',
  username: 'testuser',
  email: 'test@example.com',
  roles: [role],
  isActive: true
});

export default AuthContext;
