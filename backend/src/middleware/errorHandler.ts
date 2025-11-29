/**
 * 通用错误处理中间件
 * 统一处理所有API错误，避免重复的错误处理代码
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 处理Mongoose验证错误
 */
const handleValidationError = (error: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(error.errors).map(err => err.message);
  const message = `数据验证失败: ${errors.join(', ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * 处理Mongoose重复键错误
 */
const handleDuplicateKeyError = (error: any): AppError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `${field} '${value}' 已存在`;
  return new AppError(message, 400, 'DUPLICATE_KEY_ERROR');
};

/**
 * 处理Mongoose转换错误
 */
const handleCastError = (error: mongoose.Error.CastError): AppError => {
  const message = `无效的 ${error.path}: ${error.value}`;
  return new AppError(message, 400, 'CAST_ERROR');
};

/**
 * 处理JWT错误
 */
const handleJWTError = (): AppError => {
  return new AppError('无效的token', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('token已过期', 401, 'TOKEN_EXPIRED');
};

/**
 * 发送错误响应
 */
const sendErrorResponse = (error: AppError, res: Response) => {
  const response: any = {
    success: false,
    error: error.message,
  };

  if (error.code) {
    response.code = error.code;
  }

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * 全局错误处理中间件
 */
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let appError = error;

  // 如果不是AppError，转换为AppError
  if (!(error instanceof AppError)) {
    if (error.name === 'ValidationError') {
      appError = handleValidationError(error);
    } else if (error.code === 11000) {
      appError = handleDuplicateKeyError(error);
    } else if (error.name === 'CastError') {
      appError = handleCastError(error);
    } else if (error.name === 'JsonWebTokenError') {
      appError = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      appError = handleJWTExpiredError();
    } else {
      // 未知错误
      appError = new AppError(
        process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

  // 记录错误日志
  console.error('API Error:', {
    message: appError.message,
    statusCode: appError.statusCode,
    code: appError.code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
  });

  sendErrorResponse(appError, res);
};

/**
 * 处理未捕获的路由
 */
export const handleNotFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`路由 ${req.originalUrl} 不存在`, 404, 'NOT_FOUND');
  next(error);
};

/**
 * 异步错误处理包装器
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 验证中间件工厂
 */
export const validateRequest = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const message = error.details.map((detail: any) => detail.message).join(', ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
    
    next();
  };
};

/**
 * 权限检查中间件工厂
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new AppError('未认证', 401, 'UNAUTHORIZED'));
    }
    
    if (!user.hasPermission || !user.hasPermission(permission)) {
      return next(new AppError('权限不足', 403, 'FORBIDDEN'));
    }
    
    next();
  };
};

/**
 * 速率限制中间件工厂
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  const requests = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 清理过期记录
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter((time: number) => time > windowStart);
      requests.set(key, userRequests);
    }
    
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= max) {
      return next(new AppError(
        message || `请求过于频繁，请稍后再试`,
        429,
        'RATE_LIMIT_EXCEEDED'
      ));
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};
