/**
 * 配置管理路由
 * 遵循RESTful API设计原则
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import configService from '../../services/config/ConfigService';
import { authenticateUser as auth } from '../../middleware/auth';
import { validateConfigData } from '../../middleware/validation';
import { IUser } from '../../models/User';

const router = Router();

/**
 * 扩展Request接口以包含用户信息
 */
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * 检查管理员权限的中间件
 */
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: '需要管理员权限'
      }
    });
  }
  next();
};

/**
 * GET /api/v1/config/modules
 * 获取模块配置
 */
router.get('/modules', auth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await configService.getModuleSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/config/modules
 * 更新模块配置
 */
router.put('/modules', auth, requireAdmin, validateConfigData, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const result = await configService.updateModuleSettings(updates, req.user!.username);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: result.message,
          details: result.errors
        }
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/modules/enabled
 * 获取启用的模块列表
 */
router.get('/modules/enabled', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enabledModules = await configService.getEnabledModules();
    
    res.json({
      success: true,
      data: enabledModules
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/modules/check-permission
 * 检查模块权限
 */
router.post('/modules/check-permission', auth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { moduleName } = req.body;
    
    if (!moduleName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MODULE_NAME',
          message: '模块名称不能为空'
        }
      });
    }
    
    const hasPermission = await configService.checkModulePermission(moduleName, req.user!);
    
    res.json({
      success: true,
      data: {
        moduleName,
        hasPermission
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/storage
 * 获取存储配置
 */
router.get('/storage', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await configService.getStorageSettings();
    
    // 脱敏处理敏感信息
    const sanitizedSettings = { ...settings.toObject() };
    if (sanitizedSettings.providers) {
      Object.keys(sanitizedSettings.providers).forEach(provider => {
        const config = sanitizedSettings.providers[provider];
        if (config.accessKeyId) config.accessKeyId = config.accessKeyId.substring(0, 4) + '****';
        if (config.accessKeySecret) config.accessKeySecret = '****';
        if (config.secretAccessKey) config.secretAccessKey = '****';
        if (config.secretId) config.secretId = config.secretId.substring(0, 4) + '****';
        if (config.secretKey) config.secretKey = '****';
      });
    }
    
    res.json({
      success: true,
      data: sanitizedSettings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/config/storage
 * 更新存储配置
 */
router.put('/storage', auth, requireAdmin, validateConfigData, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const result = await configService.updateStorageSettings(updates, req.user!.username);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: result.message,
          details: result.errors
        }
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/storage/test
 * 测试存储配置
 */
router.post('/storage/test', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { provider, config } = req.body;
    
    if (!provider || !config) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '存储提供商和配置信息不能为空'
        }
      });
    }
    
    const result = await configService.testStorageConfig(provider, config);
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.message,
      error: result.errors ? {
        code: 'TEST_FAILED',
        message: result.message,
        details: result.errors
      } : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/content
 * 获取内容配置
 */
router.get('/content', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await configService.getContentSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/config/content
 * 更新内容配置
 */
router.put('/content', auth, requireAdmin, validateConfigData, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const result = await configService.updateContentSettings(updates, req.user!.username);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: result.message,
          details: result.errors
        }
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/all
 * 获取所有配置
 */
router.get('/all', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configs = await configService.getAllConfigs();
    
    // 脱敏处理存储配置
    const sanitizedConfigs = { ...configs };
    if (sanitizedConfigs.storage.providers) {
      Object.keys(sanitizedConfigs.storage.providers).forEach(provider => {
        const config = sanitizedConfigs.storage.providers[provider];
        if (config.accessKeyId) config.accessKeyId = config.accessKeyId.substring(0, 4) + '****';
        if (config.accessKeySecret) config.accessKeySecret = '****';
        if (config.secretAccessKey) config.secretAccessKey = '****';
        if (config.secretId) config.secretId = config.secretId.substring(0, 4) + '****';
        if (config.secretKey) config.secretKey = '****';
      });
    }
    
    res.json({
      success: true,
      data: sanitizedConfigs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/reset
 * 重置配置到默认值
 */
router.post('/reset', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { configType } = req.body;
    
    if (!configType || !['modules', 'storage', 'content'].includes(configType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_TYPE',
          message: '无效的配置类型，支持: modules, storage, content'
        }
      });
    }
    
    const result = await configService.resetConfig(configType, req.user!.username);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: result.message,
          details: result.errors
        }
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/export
 * 导出配置
 */
router.get('/export', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { types } = req.query;
    
    let configTypes: Array<'modules' | 'storage' | 'content'> = ['modules', 'storage', 'content'];
    if (types && typeof types === 'string') {
      const requestedTypes = types.split(',').filter(type => 
        ['modules', 'storage', 'content'].includes(type)
      ) as Array<'modules' | 'storage' | 'content'>;
      
      if (requestedTypes.length > 0) {
        configTypes = requestedTypes;
      }
    }
    
    const exportData = await configService.exportConfig(configTypes);
    
    // 设置下载响应头
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `config-export-${timestamp}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/import
 * 导入配置
 */
router.post('/import', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configData = req.body;
    
    if (!configData || typeof configData !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_DATA',
          message: '配置数据格式无效'
        }
      });
    }
    
    const result = await configService.importConfig(configData, req.user!.username);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMPORT_FAILED',
          message: result.message,
          details: result.errors
        }
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/history/:type
 * 获取配置历史
 */
router.get('/history/:type', auth, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!['modules', 'storage', 'content'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_TYPE',
          message: '无效的配置类型，支持: modules, storage, content'
        }
      });
    }
    
    const history = await configService.getConfigHistory(type as any, limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

export default router;
