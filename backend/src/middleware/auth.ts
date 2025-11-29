import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: any;
      resource?: any;
    }
  }
}

/**
 * Session-based 用户认证中间件
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 认证中间件开始:', {
      url: req.url,
      method: req.method,
      sessionId: (req as any).session?.sessionId,
      hasSession: !!(req as any).session
    });
    
    // 检查session中的sessionId
    const sessionId = (req as any).session?.sessionId;
    
    if (!sessionId) {
      console.log('❌ 缺少认证会话');
      return res.status(401).json({
        success: false,
        error: '缺少认证会话'
      });
    }
    
    // 导入认证服务
    const { checkAuthStatus } = await import('../services/authService');
    
    // 验证session认证状态
    const authStatus = await checkAuthStatus(sessionId);
    console.log('🔐 认证状态检查结果:', authStatus);
    
    if (!authStatus.isAuthenticated) {
      console.log('❌ 认证会话已过期');
      return res.status(401).json({
        success: false,
        error: '认证会话已过期'
      });
    }
    
    // 创建管理员用户对象
    req.user = {
      _id: 'admin',
      username: 'admin',
      role: 'admin',
      isActive: true
    };
    
    console.log('✅ 认证成功，用户对象:', req.user);
    next();
  } catch (error) {
    console.error('❌ 认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      error: '认证失败'
    });
  }
};

/**
 * 权限控制中间件
 */
export const authorizeUser = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '用户未认证'
        });
      }
      
      // 检查用户是否有所需权限
      const hasPermission = requiredPermissions.every(permission => 
        req.user.hasPermission(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: '权限不足'
        });
      }
      
      next();
    } catch (error) {
      console.error('权限控制中间件错误:', error);
      return res.status(500).json({
        success: false,
        error: '权限验证失败'
      });
    }
  };
};

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
          const user = await User.findById(decoded.userId).select('-password');
          
          if (user && user.isActive) {
            req.user = user;
            await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
          }
        } catch (error) {
          // 令牌无效，但不阻止请求继续
          console.log('可选认证失败，继续匿名访问');
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next(); // 继续执行，不阻止请求
  }
};

/**
 * 管理员权限中间件
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '需要管理员权限'
      });
    }
    
    next();
  } catch (error) {
    console.error('管理员权限中间件错误:', error);
    return res.status(500).json({
      success: false,
      error: '权限验证失败'
    });
  }
};

/**
 * 资源所有者权限中间件
 */
export const requireOwnership = (resourceModel: any, resourceIdField: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '用户未认证'
        });
      }
      
      const resourceId = req.params[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: '缺少资源ID'
        });
      }
      
      // 查找资源
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: '资源不存在'
        });
      }
      
      // 检查是否为资源所有者或管理员
      const isOwner = resource.authorId?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: '没有权限操作此资源'
        });
      }
      
      // 将资源添加到请求对象
      req.resource = resource;
      
      next();
    } catch (error) {
      console.error('资源所有权验证中间件错误:', error);
      return res.status(500).json({
        success: false,
        error: '权限验证失败'
      });
    }
  };
};
