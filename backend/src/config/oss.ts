import OSS from 'ali-oss';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量 - 使用绝对路径确保PM2能正确加载
dotenv.config({ path: path.join(__dirname, '../../config.env') });

// OSS配置
export const ossConfig = {
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
  region: process.env.OSS_REGION!,
  endpoint: process.env.OSS_ENDPOINT!,
};

// 创建OSS客户端（延迟初始化）
let _ossClient: any | null = null;

export const getOSSClient = (): any => {
  if (!_ossClient) {
    // 验证配置
    if (!ossConfig.accessKeyId || !ossConfig.accessKeySecret) {
      throw new Error('OSS credentials not configured. Please set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET in environment variables.');
    }
    
    _ossClient = new OSS({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      region: ossConfig.region,
      endpoint: ossConfig.endpoint,
      // 增加超时时间，适应大文件上传
      timeout: 3600000, // 1小时超时
      // 启用重试机制
      retryMax: 3,
      retryDelay: 1000,
      // 禁用代理以避免网络问题
      // enableProxy: false, // 移除此配置，使用默认值
      // 使用HTTPS以获得更好的性能
      secure: true
    });
  }
  return _ossClient;
};

// 兼容性：保持原有的导出名称，但改为函数调用
export const ossClient = getOSSClient;

// 文件夹路径配置
export const uploadPaths = {
  homepage: 'knowledge-base/images/homepage/',
  vehicles: 'knowledge-base/images/vehicles/',
  documents: 'knowledge-base/images/documents/',
  uploads: 'knowledge-base/images/uploads/',
  temp: 'knowledge-base/temp/',
};

// 验证配置
export const validateConfig = () => {
  const requiredFields = [
    'OSS_ACCESS_KEY_ID',
    'OSS_ACCESS_KEY_SECRET', 
    'OSS_BUCKET',
    'OSS_REGION',
    'OSS_ENDPOINT'
  ];

  for (const field of requiredFields) {
    if (!process.env[field]) {
      throw new Error(`Missing required environment variable: ${field}`);
    }
  }

  console.log('✅ OSS配置验证通过');
  console.log(`Bucket: ${ossConfig.bucket}`);
  console.log(`Region: ${ossConfig.region}`);
};
