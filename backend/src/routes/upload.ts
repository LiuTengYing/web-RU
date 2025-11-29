import { Router } from 'express';
import multer from 'multer';
import { uploadImageToOSS, deleteImageFromOSS, getImageInfo } from '../services/uploadService';

const router = Router();

// 配置multer，将文件存储在内存中
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件上传'));
    }
  }
});

/**
 * 上传图片
 * POST /api/upload/image
 */
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 获取上传参数
    const folder = req.body.folder as string || 'uploads';
    const customFileName = req.body.fileName as string;

    console.log(`收到图片上传请求: ${req.file.originalname}, 大小: ${req.file.size} bytes, 文件夹: ${folder}`);
    
    // 验证OSS配置
    try {
      const { validateConfig } = require('../config/oss');
      validateConfig();
    } catch (configError) {
      console.error('OSS配置验证失败:', configError);
      return res.status(500).json({
        success: false,
        error: 'OSS配置错误：' + (configError instanceof Error ? configError.message : '配置验证失败')
      });
    }

    // 上传到OSS
    const result = await uploadImageToOSS(req.file, {
      folder: folder as any,
      fileName: customFileName
    });

    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        fileName: result.fileName,
        message: '图片上传成功'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('上传处理错误:', error);
    
    // 更详细的错误信息
    let errorMessage = '服务器错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      // 检查常见的OSS错误
      if (error.message.includes('AccessDenied')) {
        errorMessage = 'OSS访问权限不足，请检查配置';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'OSS存储桶不存在，请检查配置';
      } else if (error.message.includes('InvalidAccessKeyId')) {
        errorMessage = 'OSS访问密钥无效，请检查配置';
      } else if (error.message.includes('RequestTimeout')) {
        errorMessage = '网络超时，请重试';
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

/**
 * 批量上传图片
 * POST /api/upload/images
 */
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    const folder = req.body.folder as string || 'uploads';
    const files = req.files as Express.Multer.File[];

    console.log(`收到批量上传请求: ${files.length} 个文件`);

    const results = [];

    for (const file of files) {
      const result = await uploadImageToOSS(file, {
        folder: folder as any
      });
      results.push({
        originalName: file.originalname,
        ...result
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount
      },
      message: `批量上传完成: ${successCount} 成功, ${failedCount} 失败`
    });

  } catch (error) {
    console.error('批量上传处理错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

/**
 * 删除图片
 * DELETE /api/upload/image
 */
router.delete('/image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: '缺少图片URL'
      });
    }

    const success = await deleteImageFromOSS(imageUrl);

    if (success) {
      res.json({
        success: true,
        message: '图片删除成功'
      });
    } else {
      res.status(400).json({
        success: false,
        error: '图片删除失败'
      });
    }

  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

/**
 * 获取图片信息
 * GET /api/upload/image-info
 */
router.get('/image-info', async (req, res) => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: '缺少图片URL'
      });
    }

    const info = await getImageInfo(imageUrl);

    if (info.success) {
      res.json({
        success: true,
        info
      });
    } else {
      res.status(400).json({
        success: false,
        error: info.error
      });
    }

  } catch (error) {
    console.error('获取图片信息错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

/**
 * 获取已上传的图片列表
 * GET /api/upload/images
 */
router.get('/images', async (req, res) => {
  try {
    const { getUploadedImages } = require('../services/uploadService');
    const images = await getUploadedImages();
    
    res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('获取图片列表错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

export default router;
