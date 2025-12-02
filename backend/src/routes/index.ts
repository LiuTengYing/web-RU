/**
 * 路由模块主入口
 * 遵循模块化设计：统一管理所有路由
 */

import { Router } from 'express';
import contentRoutes from './content/contentRoutes';
import configRoutes from './config/configRoutes';
import storageRoutes from './storage/storageRoutes';

// 导入现有路由（保持向后兼容）
import documentRoutes from './documents';
import categoryRoutes from './categoryRoutes';
import vehicleRoutes from './vehicles';
import imageRoutes from './images';
import contactRoutes from './contact';
import siteSettingsRoutes from './siteSettings';
import systemSettingsRoutes from './system';
import adminRoutes from './admin';
import announcementRoutes from './announcement';
import audioPresetRoutes from './audioPresets';
import softwareRoutes from './software';
import aiRoutes from './ai';

const router = Router();

/**
 * API版本信息
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Knowledge Base API',
      version: '2.0.0',
      description: '企业级知识库管理系统API',
      features: [
        '多内容类型支持',
        '统一存储管理',
        '模块化配置',
        'RESTful API设计',
        '向后兼容'
      ],
      endpoints: {
        v1: {
          content: '/api/v1/content',
          config: '/api/v1/config',
          storage: '/api/v1/storage'
        },
        legacy: {
          documents: '/api/documents',
          categories: '/api/categories',
          vehicles: '/api/vehicles',
          images: '/api/images',
          contact: '/api/contact',
          settings: '/api/site-settings',
          system: '/api/system-settings',
          admin: '/api/admin',
          announcements: '/api/announcements',
          audioPresets: '/api/audio-presets',
          software: '/api/software',
          ai: '/api/ai'
        }
      }
    }
  });
});

/**
 * API健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }
  });
});

// ==================== V1 API Routes ====================
// 新版本API，遵循RESTful设计

/**
 * 内容管理API
 * 支持所有内容类型的CRUD操作
 */
router.use('/v1/content', contentRoutes);

/**
 * 配置管理API
 * 模块、存储、内容配置管理
 */
router.use('/v1/config', configRoutes);

/**
 * 存储管理API
 * 文件上传、下载、管理
 */
router.use('/v1/storage', storageRoutes);

// ==================== Legacy API Routes ====================
// 现有API，保持向后兼容

/**
 * 文档管理路由（兼容现有系统）
 */
router.use('/documents', documentRoutes);

/**
 * 分类管理路由
 */
router.use('/categories', categoryRoutes);

/**
 * 车辆管理路由
 */
router.use('/vehicles', vehicleRoutes);

/**
 * 图片管理路由
 */
router.use('/images', imageRoutes);

/**
 * 联系信息路由
 */
router.use('/contact', contactRoutes);

/**
 * 网站设置路由
 */
router.use('/site-settings', siteSettingsRoutes);

/**
 * 系统设置路由
 */
router.use('/system-settings', systemSettingsRoutes);

/**
 * 管理员路由
 */
router.use('/admin', adminRoutes);

/**
 * 公告管理路由
 */
router.use('/announcements', announcementRoutes);

/**
 * 音频预设路由
 */
router.use('/audio-presets', audioPresetRoutes);

/**
 * 软件管理路由
 */
router.use('/software', softwareRoutes);

/**
 * AI服务路由
 */
router.use('/ai', aiRoutes);

// ==================== Error Handling ====================

/**
 * 404处理
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `API端点不存在: ${req.method} ${req.originalUrl}`,
      details: {
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      }
    }
  });
});

export default router;
