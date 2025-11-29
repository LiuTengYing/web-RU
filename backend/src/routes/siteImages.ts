/**
 * 网站图片配置路由
 * 提供获取和更新网站 Hero 图片和 Install 图片的 API
 */

import express from 'express';
import SiteImages from '../models/SiteImages';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/site-images
 * 获取网站图片配置
 * 不需要认证 - 前端需要公开访问
 */
router.get('/site-images', async (req, res) => {
  try {
    const images = await (SiteImages as any).getImages();
    
    res.json({
      success: true,
      data: {
        heroImage: images.heroImage,
        installImage: images.installImage,
        updatedAt: images.updatedAt
      }
    });
  } catch (error) {
    console.error('获取网站图片配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取网站图片配置失败',
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error)) 
        : '内部服务器错误'
    });
  }
});

/**
 * PUT /api/site-images
 * 更新网站图片配置
 * 需要管理员认证
 */
router.put('/site-images', authenticateUser, async (req, res) => {
  try {
    const { heroImage, installImage } = req.body;
    
    // 验证至少提供一个字段
    if (heroImage === undefined && installImage === undefined) {
      return res.status(400).json({
        success: false,
        message: '请至少提供一个图片 URL'
      });
    }
    
    // 验证 URL 格式
    const urlPattern = /^https?:\/\/.+/;
    if (heroImage !== undefined && heroImage !== '' && !urlPattern.test(heroImage)) {
      return res.status(400).json({
        success: false,
        message: 'Hero 图片 URL 格式不正确，必须以 http:// 或 https:// 开头'
      });
    }
    
    if (installImage !== undefined && installImage !== '' && !urlPattern.test(installImage)) {
      return res.status(400).json({
        success: false,
        message: 'Install 图片 URL 格式不正确，必须以 http:// 或 https:// 开头'
      });
    }
    
    // 更新配置
    const updates: { heroImage?: string; installImage?: string } = {};
    if (heroImage !== undefined) updates.heroImage = heroImage;
    if (installImage !== undefined) updates.installImage = installImage;
    
    const updatedConfig = await (SiteImages as any).updateImages(
      updates,
      'admin' // 可以从 req.user 获取实际管理员信息
    );
    
    console.log('✅ 网站图片配置已更新:', {
      heroImage: updates.heroImage !== undefined ? '已更新' : '未变更',
      installImage: updates.installImage !== undefined ? '已更新' : '未变更'
    });
    
    res.json({
      success: true,
      message: '网站图片配置更新成功',
      data: {
        heroImage: updatedConfig.heroImage,
        installImage: updatedConfig.installImage,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ 更新网站图片配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新网站图片配置失败',
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error)) 
        : '内部服务器错误'
    });
  }
});

/**
 * POST /api/site-images/reset
 * 重置网站图片配置为默认值
 * 需要管理员认证
 */
router.post('/site-images/reset', authenticateUser, async (req, res) => {
  try {
    const updatedConfig = await (SiteImages as any).updateImages(
      {
        heroImage: '',
        installImage: ''
      },
      'admin'
    );
    
    console.log('✅ 网站图片配置已重置为默认值');
    
    res.json({
      success: true,
      message: '网站图片配置已重置',
      data: {
        heroImage: updatedConfig.heroImage,
        installImage: updatedConfig.installImage,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ 重置网站图片配置失败:', error);
    res.status(500).json({
      success: false,
      message: '重置网站图片配置失败',
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error)) 
        : '内部服务器错误'
    });
  }
});

export default router;

