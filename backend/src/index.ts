import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { validateConfig } from './config/oss';
import uploadRouter from './routes/upload';
import aiRouter from './routes/ai';
import documentsRouter from './routes/documents';
import imagesRouter from './routes/images';
import softwareRouter from './routes/software';
import contactRouter from './routes/contact';
import adminRouter from './routes/admin';
import passwordsRouter from './routes/passwords';
import audioRouter from './routes/audio';
import feedbackRouter from './routes/feedback';
import documentFeedbackRouter from './routes/documentFeedback';
import authRouter from './routes/auth';
import draftsRouter from './routes/drafts';
import audioPresetsRouter from './routes/audioPresets';
import systemRouter from './routes/system';
import siteSettingsRouter from './routes/siteSettings';
// 标签路由已被分类路由替代
import categoryRouter from './routes/categoryRoutes';
// 导入Category模型以确保其被注册
import './models/Category';
// 导入SystemConfig模型以确保其被注册
import './models/SystemConfig';
import announcementRouter from './routes/announcement';
import vehiclesRouter from './routes/vehicles';
import systemConfigRouter from './routes/systemConfig';
import siteImagesRouter from './routes/siteImages';
import apiRoutes from './routes/index';
import systemConfigService from './services/systemConfigService';
import cleanupJob from './jobs/cleanupJob';
import { globalErrorHandler, handleNotFound } from './middleware/errorHandler';
// 确保User模型在应用启动时被注册（必须在连接MongoDB之前导入）
import User from './models/User';
// 强制引用User模型，防止被TypeScript优化掉
// 通过访问模型的构造函数来确保模型被注册
const _userModelRef = User;

// 加载环境变量 - 使用绝对路径确保PM2能正确加载
dotenv.config({ path: path.join(__dirname, '../config.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

// 连接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB 连接成功');
    
    // 初始化系统配置
    try {
      await systemConfigService.initializeConfigs();
      console.log('✅ 系统配置初始化完成');
    } catch (error) {
      console.error('⚠️ 系统配置初始化失败:', error);
    }
  })
  .catch((error: unknown) => {
    console.error('⚠️ MongoDB 连接失败:', error);
    console.warn('⚠️ 服务器将继续运行，但数据库相关功能将不可用');
    // 开发环境不退出，允许前端测试
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// 中间件 - 为OSS上传路由设置更大的限制
app.use('/api/oss-files/upload', express.json({ limit: '500mb' }));
app.use('/api/oss-files/upload', express.urlencoded({ extended: true, limit: '500mb' }));

// 其他路由使用较小的限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 会话中间件
import session from 'express-session';
app.use(session({
  secret: process.env.SESSION_SECRET || 'knowledge-base-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 暂时设置为false，等HTTPS配置完成后再改为true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    sameSite: 'lax'
  }
}));

// 基础请求日志（便于定位500）
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CORS配置
// CORS配置：支持逗号分隔的多个来源
app.use(cors({
  origin: (origin, callback) => {
    const env = process.env.CORS_ORIGIN || 'http://localhost:3003';
    const allowList = env.split(',').map(s => s.trim()).filter(Boolean);
    if (!origin) return callback(null, true); // 允许非浏览器客户端/同源请求
    const allowed = allowList.includes(origin);
    if (allowed) return callback(null, true);
    console.warn('CORS 拒绝的来源:', origin, '允许列表:', allowList);
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 验证OSS配置（可选，不阻止服务器启动）
try {
  validateConfig();
} catch (error) {
  console.warn('⚠️ OSS环境变量配置未找到，将使用数据库中的系统配置:', error.message);
}

// 健康检查 - 移到API路由之前
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 根路径 - 移到API路由之前
app.get('/', (req, res) => {
  res.json({
    message: 'Knowledge Base Backend API',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      upload: '/api/upload',
      ai: '/api/ai',
      documents: '/api/documents'
    }
  });
});

// 旧版API路由（向后兼容） - 必须在 app.use('/api', apiRoutes) 之前
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/software', softwareRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/passwords', passwordsRouter);
app.use('/api/audio', audioRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/document-feedback', documentFeedbackRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/auth', authRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/audio-presets', audioPresetsRouter);
app.use('/api/system', systemRouter);
app.use('/api/site-settings', siteSettingsRouter);
// app.use('/api/tags', tagRouter); // 标签路由已被分类路由替代
app.use('/api/categories', categoryRouter);
app.use('/api/announcement', announcementRouter);
app.use('/api/system-config', systemConfigRouter);
app.use('/api', siteImagesRouter);

// API路由 - V1版本路由（作为fallback，在所有其他路由之后）
app.use('/api', apiRoutes);

// 404处理 - 必须在所有路由之后，错误处理之前
app.use(handleNotFound);

// 全局错误处理中间件 - 必须在最后
app.use(globalErrorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功!`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 OSS Bucket: ${process.env.OSS_BUCKET}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  
  // 设置服务器超时时间为2小时（用于大文件上传）
  server.timeout = 7200000; // 2小时
  server.keepAliveTimeout = 7200000;
  server.headersTimeout = 7200000;
  console.log(`🗄️ 数据库: ${mongoose.connection.readyState === 1 ? '已连接' : '未连接'}`);
  console.log('─'.repeat(50));
  
  // 启动清理任务
  try {
    cleanupJob.startAllJobs();
  } catch (error) {
    console.error('❌ 启动清理任务失败:', error);
  }
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n收到SIGINT信号，正在关闭服务器...');
  
  try {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭');
    
    // 停止清理任务
    // cleanupJob.stopAllJobs();
    
    console.log('✅ 服务器已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时发生错误:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n收到SIGTERM信号，正在关闭服务器...');
  
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