import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// 创建缓存实例
const cache = new NodeCache({
  stdTTL: 600, // 默认10分钟过期
  checkperiod: 120, // 每2分钟检查过期项
  useClones: false // 提高性能，但需要注意对象引用
});

// 缓存配置
const CACHE_DURATIONS = {
  documents: 300, // 5分钟
  documentList: 180, // 3分钟
  images: 1800, // 30分钟
  userProfile: 600, // 10分钟
  systemConfig: 3600, // 1小时
  search: 120 // 2分钟
};

/**
 * 生成缓存键
 */
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `${prefix}:${parts.join(':')}`;
};

/**
 * 缓存中间件
 */
export const cacheMiddleware = (
  keyPrefix: string,
  duration?: number,
  keyGenerator?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 生成缓存键
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : generateCacheKey(keyPrefix, req.originalUrl, JSON.stringify(req.query));
    
    // 尝试从缓存获取数据
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`🎯 缓存命中: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    // 劫持原始的json方法
    const originalJson = res.json.bind(res);
    
    res.json = (data: any) => {
      // 只缓存成功的响应
      if (res.statusCode === 200) {
        const ttl = duration || CACHE_DURATIONS[keyPrefix as keyof typeof CACHE_DURATIONS] || 300;
        cache.set(cacheKey, data, ttl);
        console.log(`💾 缓存存储: ${cacheKey} (TTL: ${ttl}s)`);
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * 文档列表缓存
 */
export const documentListCache = cacheMiddleware(
  'documentList',
  CACHE_DURATIONS.documentList,
  (req) => {
    const { category, status, page = 1, limit = 10, search } = req.query;
    return generateCacheKey(
      'documentList',
      category as string || 'all',
      status as string || 'all',
      page as string,
      limit as string,
      search as string || 'none'
    );
  }
);

/**
 * 单个文档缓存
 */
export const documentCache = cacheMiddleware(
  'documents',
  CACHE_DURATIONS.documents,
  (req) => generateCacheKey('document', req.params.id)
);

/**
 * 图片资源缓存
 */
export const imageCache = cacheMiddleware(
  'images',
  CACHE_DURATIONS.images,
  (req) => generateCacheKey('image', req.params.id || req.query.url as string)
);

/**
 * 搜索结果缓存
 */
export const searchCache = cacheMiddleware(
  'search',
  CACHE_DURATIONS.search,
  (req) => {
    const { q, category, type } = req.query;
    return generateCacheKey(
      'search',
      q as string || '',
      category as string || 'all',
      type as string || 'all'
    );
  }
);

/**
 * 手动清除缓存
 */
export const clearCache = (pattern?: string): number => {
  if (!pattern) {
    cache.flushAll();
    console.log('🗑️ 清空所有缓存');
    return cache.getStats().keys;
  }
  
  const keys = cache.keys();
  const matchedKeys = keys.filter(key => key.includes(pattern));
  
  matchedKeys.forEach(key => cache.del(key));
  console.log(`🗑️ 清除缓存: ${pattern} (${matchedKeys.length}个)`);
  
  return matchedKeys.length;
};

/**
 * 清除特定文档相关缓存
 */
export const clearDocumentCache = (documentId?: string): void => {
  if (documentId) {
    clearCache(`document:${documentId}`);
  }
  // 清除文档列表缓存
  clearCache('documentList');
  clearCache('search');
};

/**
 * 清除图片相关缓存
 */
export const clearImageCache = (imageId?: string): void => {
  if (imageId) {
    clearCache(`image:${imageId}`);
  }
  clearCache('images');
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = () => {
  const stats = cache.getStats();
  const keys = cache.keys();
  
  // 按前缀分组统计
  const keysByPrefix: Record<string, number> = {};
  keys.forEach(key => {
    const prefix = key.split(':')[0];
    keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
  });
  
  return {
    ...stats,
    keysByPrefix,
    totalKeys: keys.length
  };
};

/**
 * 预热缓存
 */
export const warmupCache = async (warmupData: Array<{ key: string; data: any; ttl?: number }>) => {
  console.log('🔥 开始预热缓存...');
  
  for (const item of warmupData) {
    cache.set(item.key, item.data, item.ttl || 300);
  }
  
  console.log(`🔥 缓存预热完成: ${warmupData.length}个项目`);
};

/**
 * 缓存健康检查
 */
export const cacheHealthCheck = () => {
  const stats = getCacheStats();
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    cache: {
      keys: stats.totalKeys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      keysByPrefix: stats.keysByPrefix
    },
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
    }
  };
};

export default cache;
