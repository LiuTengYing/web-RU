import { Router } from 'express';
import documentService from '../services/documentService';
import { documentViewService } from '../services/documentViewService';
import { validateDocument } from '../middleware/validation';

const router = Router();

/**
 * 通用文档路由
 */

// 创建通用文档
router.post('/general', 
  validateDocument('general'),
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const document = await documentService.createGeneralDocument(req.body, user);
      res.status(201).json({
        success: true,
        data: document,
        message: '通用文档创建成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败'
      });
    }
  }
);

// 获取通用文档列表
router.get('/general', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, author, search } = req.query;
    
    const result = await documentService.getDocuments('general', {
      status: status as string,
      category: category as string,
      author: author as string,
      search: search as string
    }, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 获取单个通用文档（不增加浏览量）
router.get('/general/:id', async (req, res) => {
  try {
    // 获取文档但不增加浏览量（使用单独的API记录浏览）
    const document = await documentService.getDocument(req.params.id, 'general', false);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: '文档不存在'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 更新通用文档
router.put('/general/:id',
  validateDocument('general'),
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const document = await documentService.updateGeneralDocument(
        req.params.id,
        req.body,
        user
      );
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }
      
      res.json({
        success: true,
        data: document,
        message: '文档更新成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      });
    }
  }
);

// 删除通用文档
router.delete('/general/:id',
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const success = await documentService.deleteDocument(
        req.params.id,
        'general',
        user
      );
      
      console.log('🗑️ 删除结果:', { success, documentId: req.params.id });
      
      if (!success) {
        console.log('❌ 文档不存在:', req.params.id);
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }
      
      console.log('✅ 文档删除成功:', req.params.id);
      res.json({
        success: true,
        message: '文档删除成功'
      });
    } catch (error) {
      console.error('❌ 删除通用文档失败:', {
        documentId: req.params.id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }
);

/**
 * 视频教程路由
 */

// 创建视频教程
router.post('/video',
  validateDocument('video'),
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const document = await documentService.createVideoTutorial(req.body, user);
      res.status(201).json({
        success: true,
        data: document,
        message: '视频教程创建成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败'
      });
    }
  }
);

// 获取视频教程列表
router.get('/video', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, author, search } = req.query;
    
    const result = await documentService.getDocuments('video', {
      status: status as string,
      category: category as string,
      author: author as string,
      search: search as string
    }, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 获取单个视频教程
router.get('/video/:id', async (req, res) => {
  try {
    const document = await documentService.getDocument(req.params.id, 'video');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: '视频教程不存在'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 更新视频教程
router.put('/video/:id',
  validateDocument('video'),
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const document = await documentService.updateVideoTutorial(
        req.params.id,
        req.body,
        user
      );
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '视频教程不存在'
        });
      }
      
      res.json({
        success: true,
        data: document,
        message: '视频教程更新成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      });
    }
  }
);

// 删除视频教程
router.delete('/video/:id',
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const success = await documentService.deleteDocument(
        req.params.id,
        'video',
        user
      );
      
      console.log('🗑️ 删除结果:', { success, documentId: req.params.id });
      
      if (!success) {
        console.log('❌ 视频教程不存在:', req.params.id);
        return res.status(404).json({
          success: false,
          error: '视频教程不存在'
        });
      }
      
      console.log('✅ 视频教程删除成功:', req.params.id);
      res.json({
        success: true,
        message: '视频教程删除成功'
      });
    } catch (error) {
      console.error('❌ 删除视频教程失败:', {
        documentId: req.params.id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }
);

/**
 * 结构化文章路由
 */

// 创建结构化文章
router.post('/structured',
  validateDocument('structured'),
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const document = await documentService.createStructuredArticle(req.body, user);
      res.status(201).json({
        success: true,
        data: document,
        message: '结构化文章创建成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败'
      });
    }
  }
);

// 获取结构化文章列表
router.get('/structured', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, brand, model, search } = req.query;
    
    const result = await documentService.getDocuments('structured', {
      status: status as string,
      brand: brand as string,
      model: model as string,
      search: search as string
    }, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 获取单个结构化文章
router.get('/structured/:id', async (req, res) => {
  try {
    const document = await documentService.getDocument(req.params.id, 'structured');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: '结构化文章不存在'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 更新结构化文章
router.put('/structured/:id',
  validateDocument('structured'),
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const document = await documentService.updateStructuredArticle(
        req.params.id,
        req.body,
        user
      );
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '结构化文章不存在'
        });
      }
      
      res.json({
        success: true,
        data: document,
        message: '结构化文章更新成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      });
    }
  }
);

// 删除结构化文章
router.delete('/structured/:id',
  async (req, res) => {
    try {
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      const success = await documentService.deleteDocument(
        req.params.id,
        'structured',
        user
      );
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: '结构化文章不存在'
        });
      }
      
      res.json({
        success: true,
        message: '结构化文章删除成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }
);

/**
 * 通用操作
 */

// 发布文档
router.patch('/:type/:id/publish',
  async (req, res) => {
    try {
      const { type, id } = req.params;
      
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      let document;
      switch (type) {
        case 'general':
          document = await documentService.updateGeneralDocument(id, { status: 'published' }, user);
          break;
        case 'video':
          document = await documentService.updateVideoTutorial(id, { status: 'published' }, user);
          break;
        case 'structured':
          document = await documentService.updateStructuredArticle(id, { status: 'published' }, user);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: '无效的文档类型'
          });
      }
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }
      
      res.json({
        success: true,
        data: document,
        message: '文档发布成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '发布失败'
      });
    }
  }
);

// 归档文档
router.patch('/:type/:id/archive',
  async (req, res) => {
    try {
      const { type, id } = req.params;
      
      const user = {
        _id: new (require('mongoose').Types.ObjectId)(),
        username: 'admin',
        role: 'admin'
      } as any;
      let document;
      switch (type) {
        case 'general':
          document = await documentService.updateGeneralDocument(id, { status: 'archived' }, user);
          break;
        case 'video':
          document = await documentService.updateVideoTutorial(id, { status: 'archived' }, user);
          break;
        case 'structured':
          document = await documentService.updateStructuredArticle(id, { status: 'archived' }, user);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: '无效的文档类型'
          });
      }
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }
      
      res.json({
        success: true,
        data: document,
        message: '文档归档成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '归档失败'
      });
    }
  }
);

// 搜索文档
router.get('/search', async (req, res) => {
  try {
    const { q, type, category, status } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      });
    }
    
    // 根据类型搜索不同集合
    const searchPromises = [];
    
    if (!type || type === 'general') {
      searchPromises.push(
        documentService.getDocuments('general', { search: q as string, category: category as string, status: status as string })
      );
    }
    
    if (!type || type === 'video') {
      searchPromises.push(
        documentService.getDocuments('video', { search: q as string, category: category as string, status: status as string })
      );
    }
    
    if (!type || type === 'structured') {
      searchPromises.push(
        documentService.getDocuments('structured', { search: q as string, category: category as string, status: status as string })
      );
    }
    
    const results = await Promise.all(searchPromises);
    
    // 合并搜索结果
    const allDocuments = results.flatMap(result => result.documents);
    
    res.json({
      success: true,
      data: {
        documents: allDocuments,
        total: allDocuments.length,
        query: q,
        type: type || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '搜索失败'
    });
  }
});

/**
 * 记录文档浏览
 */
router.post('/:type/:id/view', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { fingerprint, sessionId } = req.body;

    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        error: '缺少浏览器指纹'
      });
    }

    // 验证文档类型
    if (!['general', 'video', 'structured'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '无效的文档类型'
      });
    }

    // 获取IP地址
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) || 
                      req.socket.remoteAddress || 
                      'unknown';

    // 获取User-Agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 记录浏览
    const result = await documentViewService.recordView(
      id,
      type as 'general' | 'video' | 'structured',
      fingerprint,
      ipAddress,
      userAgent,
      sessionId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('记录浏览失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '记录浏览失败'
    });
  }
});

/**
 * 获取文档浏览统计
 */
router.get('/:type/:id/view-stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await documentViewService.getViewStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取浏览统计失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取浏览统计失败'
    });
  }
});

export default router;
