/**
 * 开发环境启动脚本
 * 简化版本，避免TypeScript编译问题
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS配置
app.use(cors({
  origin: (origin, callback) => {
    const env = process.env.CORS_ORIGIN || 'http://localhost:3003,http://localhost:5173';
    const allowList = env.split(',').map(s => s.trim()).filter(Boolean);
    if (!origin) return callback(null, true);
    const allowed = allowList.includes(origin);
    if (allowed) return callback(null, true);
    console.warn('CORS 拒绝的来源:', origin, '允许列表:', allowList);
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 连接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB 连接成功');
  })
  .catch((error) => {
    console.error('⚠️ MongoDB 连接失败:', error);
    console.warn('⚠️ 服务器将继续运行，但数据库相关功能将不可用');
  });

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Knowledge Base Backend API',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      'system-config': '/api/system-config'
    }
  });
});

// 认证API
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  
  // 简单的密码验证（开发环境）
  if (password === 'admin123' || password === 'admin') {
    res.json({
      success: true,
      data: {
      authStatus: {
        isAuthenticated: true,
        token: 'dev-token-' + Date.now(),
        user: { role: 'admin' }
      }
      },
      message: '登录成功'
    });
  } else {
    res.status(401).json({
      success: false,
      error: '密码错误'
    });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({
    success: true,
    data: {
      authStatus: {
        isAuthenticated: true,
        user: { role: 'admin' }
      }
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: '退出成功'
  });
});

// 管理员设置API
app.get('/api/admin/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      sessionTimeout: 3600000,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
});

app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  
  if (password === 'admin123' || password === 'admin') {
    res.json({
      success: true,
      data: { isValid: true }
    });
  } else {
    res.json({
      success: true,
      data: { isValid: false }
    });
  }
});

// 网站设置API
app.get('/api/site-settings', (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: '知识库管理系统',
      siteDescription: '现代化知识库管理系统',
      language: 'zh',
      theme: 'dark'
    }
  });
});

// 软件下载相关的模拟API
app.get('/api/software/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { _id: '1', name: '系统工具', description: '系统相关工具软件' },
      { _id: '2', name: '开发工具', description: '开发相关工具软件' }
    ]
  });
});

app.get('/api/software', (req, res) => {
  res.json({
    success: true,
    software: [
      {
        _id: '1',
        name: '示例软件1',
        categoryId: '1',
        description: '这是一个示例软件',
        downloadUrl: 'https://example.com/download1',
        importantNote: '重要提示信息'
      }
    ]
  });
});

app.post('/api/software/categories', (req, res) => {
  res.json({
    success: true,
    category: { _id: Date.now().toString(), ...req.body }
  });
});

app.post('/api/software', (req, res) => {
  res.json({
    success: true,
    software: { _id: Date.now().toString(), ...req.body }
  });
});

app.put('/api/software/categories/:id', (req, res) => {
  res.json({
    success: true,
    category: { _id: req.params.id, ...req.body }
  });
});

app.put('/api/software/:id', (req, res) => {
  res.json({
    success: true,
    software: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/software/categories/:id', (req, res) => {
  res.json({
    success: true,
    message: '分类删除成功'
  });
});

app.delete('/api/software/:id', (req, res) => {
  res.json({
    success: true,
    message: '软件删除成功'
  });
});

// 简单的内存存储（开发环境用）
let feedbackStorage = [];

// 联系表单和反馈相关的模拟API
app.get('/api/feedback', (req, res) => {
  res.json({
    success: true,
    data: feedbackStorage
  });
});

app.post('/api/feedback', (req, res) => {
  const feedback = {
    _id: Date.now().toString(),
    ...req.body,
    submitTime: new Date().toISOString(),
    status: 'pending'
  };
  
  // 保存到内存存储
  feedbackStorage.unshift(feedback); // 新的放在前面
  
  console.log('📝 新的联系表单提交:', {
    name: feedback.name,
    email: feedback.email,
    subject: feedback.subject,
    time: feedback.submitTime
  });
  
  res.json({
    success: true,
    feedback,
    message: '表单提交成功'
  });
});

app.get('/api/feedback/unread/count', (req, res) => {
  const unreadCount = feedbackStorage.filter(f => f.status === 'pending').length;
  res.json({
    success: true,
    count: unreadCount
  });
});

app.get('/api/feedback/export', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.delete('/api/feedback', (req, res) => {
  res.json({
    success: true,
    message: '删除成功'
  });
});

// 联系信息相关API
app.get('/api/contact', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: '1',
        type: 'email',
        label: '邮箱',
        value: 'contact@example.com',
        icon: 'mail',
        isActive: true,
        order: 1
      },
      {
        _id: '2',
        type: 'phone',
        label: '电话',
        value: '+86 138-0000-0000',
        icon: 'phone',
        isActive: true,
        order: 2
      }
    ]
  });
});

app.post('/api/contact', (req, res) => {
  res.json({
    success: true,
    contactInfo: { _id: Date.now().toString(), ...req.body }
  });
});

// 文档反馈相关API
app.get('/api/document-feedback/all/admin', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/document-feedback/stats/unreplied', (req, res) => {
  res.json({
    success: true,
    count: 0
  });
});

app.post('/api/document-feedback', (req, res) => {
  res.json({
    success: true,
    feedback: { _id: Date.now().toString(), ...req.body }
  });
});

app.get('/api/document-feedback/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 0,
      pending: 0,
      replied: 0
    }
  });
});

// 公告相关API
app.get('/api/announcement', (req, res) => {
  res.json({
    success: true,
    data: {
      _id: '1',
      content: '欢迎使用知识库管理系统',
      isActive: false,
      type: 'info',
      showCloseButton: true,
      autoHide: false,
      hideDelay: 5000
    }
  });
});

app.put('/api/announcement', (req, res) => {
  res.json({
    success: true,
    data: { _id: '1', ...req.body }
  });
});

app.post('/api/announcement/toggle', (req, res) => {
  res.json({
    success: true,
    data: { _id: '1', isActive: req.body.isActive }
  });
});

// 系统设置相关API
app.get('/api/system/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: '知识库管理系统',
      siteDescription: '现代化知识库管理系统',
      language: 'zh',
      theme: 'dark'
    }
  });
});

app.put('/api/system/settings', (req, res) => {
  res.json({
    success: true,
    data: { ...req.body }
  });
});

// 系统监控API
app.get('/api/system/monitor', (req, res) => {
  res.json({
    success: true,
    data: {
      cpu: { usage: 45.2, cores: 8 },
      memory: { used: 2.1, total: 8.0, percentage: 26.25 },
      disk: { used: 120.5, total: 500.0, percentage: 24.1 },
      uptime: 86400000,
      processes: 156,
      connections: 23
    }
  });
});

app.get('/api/system/dashboard-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalVehicles: 0,
      totalDocuments: 0,
      totalFeedback: 0,
      systemHealth: 'good'
    }
  });
});

// 图片管理相关API
app.get('/api/images', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/images', (req, res) => {
  res.json({
    success: true,
    data: { _id: Date.now().toString(), ...req.body }
  });
});

app.post('/api/images/reset', (req, res) => {
  res.json({
    success: true,
    message: '重置成功'
  });
});

// 文件上传相关API
app.post('/api/upload/image', (req, res) => {
  res.json({
    success: true,
    url: '/placeholder-image.jpg',
    filename: 'uploaded-image.jpg'
  });
});

app.get('/api/upload/images', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// AI相关API
app.get('/api/ai/knowledge-base-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalDocuments: 0,
      indexedDocuments: 0,
      lastIndexUpdate: new Date().toISOString()
    }
  });
});

app.get('/api/ai/advanced-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      queryCount: 0,
      averageResponseTime: 0,
      successRate: 100
    }
  });
});

app.post('/api/ai/rebuild-index', (req, res) => {
  res.json({
    success: true,
    message: '索引重建完成'
  });
});

app.post('/api/ai/validate-key', (req, res) => {
  res.json({
    success: true,
    valid: true,
    message: 'API密钥验证成功'
  });
});

// 车辆相关API
app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: { _id: Date.now().toString(), ...req.body }
  });
});

app.get('/api/vehicles/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalVehicles: 0,
      totalDocuments: 0,
      averageDocumentsPerVehicle: 0
    }
  });
});

app.get('/api/vehicles/search', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/vehicles/verify-password', (req, res) => {
  res.json({
    success: true,
    valid: true
  });
});

app.get('/api/vehicles/:id/document-count', (req, res) => {
  res.json({
    success: true,
    count: 0
  });
});

// 文档相关API
app.get('/api/documents/general', (req, res) => {
  res.json({
    success: true,
    documents: [],
    total: 0,
    page: 1,
    totalPages: 0
  });
});

app.post('/api/documents/general', (req, res) => {
  res.json({
    success: true,
    data: { _id: Date.now().toString(), ...req.body }
  });
});

app.get('/api/documents/video', (req, res) => {
  res.json({
    success: true,
    documents: [],
    total: 0,
    page: 1,
    totalPages: 0
  });
});

app.post('/api/documents/video', (req, res) => {
  res.json({
    success: true,
    data: { _id: Date.now().toString(), ...req.body }
  });
});

app.get('/api/documents/structured', (req, res) => {
  res.json({
    success: true,
    documents: [],
    total: 0,
    page: 1,
    totalPages: 0
  });
});

app.post('/api/documents/structured', (req, res) => {
  res.json({
    success: true,
    data: { _id: Date.now().toString(), ...req.body }
  });
});

app.get('/api/documents/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 0,
      byType: {},
      byStatus: {},
      byCategory: {}
    }
  });
});

app.post('/api/documents/validate-password', (req, res) => {
  res.json({
    success: true,
    valid: true
  });
});

// 标签相关API
app.get('/api/tags', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/tags', (req, res) => {
  res.json({
    success: true,
    data: { _id: Date.now().toString(), ...req.body }
  });
});

app.get('/api/tags/tree', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/tags/flat', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/tags/primary', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/tags/secondary', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/tags/reorder', (req, res) => {
  res.json({
    success: true,
    message: '标签排序成功'
  });
});

app.get('/api/tags/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 0,
      primary: 0,
      secondary: 0
    }
  });
});

app.post('/api/tags/resolve-names', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/tags/validate-name', (req, res) => {
  res.json({
    success: true,
    valid: true
  });
});

// 通用的PUT和DELETE支持
app.put('/api/vehicles/:id', (req, res) => {
  res.json({
    success: true,
    data: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/vehicles/:id', (req, res) => {
  res.json({
    success: true,
    message: '车辆删除成功'
  });
});

app.put('/api/documents/general/:id', (req, res) => {
  res.json({
    success: true,
    data: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/documents/general/:id', (req, res) => {
  res.json({
    success: true,
    message: '文档删除成功'
  });
});

app.put('/api/documents/video/:id', (req, res) => {
  res.json({
    success: true,
    data: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/documents/video/:id', (req, res) => {
  res.json({
    success: true,
    message: '文档删除成功'
  });
});

app.put('/api/documents/structured/:id', (req, res) => {
  res.json({
    success: true,
    data: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/documents/structured/:id', (req, res) => {
  res.json({
    success: true,
    message: '文档删除成功'
  });
});

app.put('/api/tags/:id', (req, res) => {
  res.json({
    success: true,
    data: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/tags/:id', (req, res) => {
  res.json({
    success: true,
    message: '标签删除成功'
  });
});

app.put('/api/contact/:id', (req, res) => {
  res.json({
    success: true,
    contactInfo: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/contact/:id', (req, res) => {
  res.json({
    success: true,
    message: '联系信息删除成功'
  });
});

app.put('/api/feedback/:id', (req, res) => {
  res.json({
    success: true,
    feedback: { _id: req.params.id, ...req.body }
  });
});

app.delete('/api/feedback/:id', (req, res) => {
  res.json({
    success: true,
    message: '反馈删除成功'
  });
});

// 简单的系统配置API
app.get('/api/system-config/status', (req, res) => {
  res.json({
    success: true,
    data: {
      dingtalk: { configured: false, enabled: false },
      oss: { configured: false, enabled: false }
    }
  });
});

// 钉钉配置API
app.get('/api/system-config/dingtalk', (req, res) => {
  res.json({
    success: true,
    data: {
      webhook: '',
      secret: '',
      enabled: false
    }
  });
});

app.get('/api/system-config/dingtalk/edit', (req, res) => {
  res.json({
    success: true,
    data: {
      webhook: '',
      secret: '',
      enabled: false
    }
  });
});

app.put('/api/system-config/dingtalk', (req, res) => {
  const { webhook, secret, enabled } = req.body;
  
  res.json({
    success: true,
    data: {
      webhook: webhook ? '***已配置***' : '',
      secret: secret ? '***已配置***' : '',
      enabled: enabled || false
    },
    message: '钉钉配置保存成功'
  });
});

app.post('/api/system-config/dingtalk/test', (req, res) => {
  const { webhook, secret } = req.body;
  
  if (webhook && secret) {
    res.json({
      success: true,
      data: {
        success: true,
        message: '钉钉配置测试成功（开发环境模拟）'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Webhook和Secret不能为空'
    });
  }
});

// OSS配置API
app.get('/api/system-config/oss', (req, res) => {
  res.json({
    success: true,
    data: {
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      region: '',
      endpoint: '',
      enabled: false
    }
  });
});

app.get('/api/system-config/oss/edit', (req, res) => {
  res.json({
    success: true,
    data: {
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      region: '',
      endpoint: '',
      enabled: false
    }
  });
});

app.put('/api/system-config/oss', (req, res) => {
  const { accessKeyId, accessKeySecret, bucket, region, endpoint, enabled } = req.body;
  
  res.json({
    success: true,
    data: {
      accessKeyId: accessKeyId ? accessKeyId.substring(0, 4) + '***' + accessKeyId.substring(accessKeyId.length - 4) : '',
      accessKeySecret: accessKeySecret ? '***已配置***' : '',
      bucket,
      region,
      endpoint,
      enabled: enabled || false
    },
    message: 'OSS配置保存成功'
  });
});

app.post('/api/system-config/oss/test', (req, res) => {
  const { accessKeyId, accessKeySecret, bucket, region, endpoint } = req.body;
  
  if (accessKeyId && accessKeySecret && bucket && region && endpoint) {
    res.json({
      success: true,
      data: {
        success: true,
        message: 'OSS配置测试成功（开发环境模拟）'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: '所有OSS配置项都不能为空'
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: error.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('─'.repeat(50));
  console.log('🚀 Knowledge Base Backend 开发服务器已启动');
  console.log(`📡 服务器地址: http://localhost:${PORT}`);
  console.log(`🗄️ 数据库: ${mongoose.connection.readyState === 1 ? '已连接' : '未连接'}`);
  console.log('─'.repeat(50));
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('📡 收到 SIGTERM 信号，开始优雅关闭...');
  try {
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭');
    console.log('✅ 服务器已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时发生错误:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('📡 收到 SIGINT 信号，开始优雅关闭...');
  try {
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭');
    console.log('✅ 服务器已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时发生错误:', error);
    process.exit(1);
  }
});
