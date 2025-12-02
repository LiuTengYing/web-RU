/**
 * 阿里云OSS存储服务实现
 * 遵循接口隔离原则：实现IStorageService接口
 */

import OSS from 'ali-oss';
import { 
  BaseStorageService, 
  IStorageService, 
  IUploadOptions, 
  IUploadResult, 
  IFileInfo, 
  IBatchOperationResult, 
  IStorageStats, 
  IListOptions, 
  IListResult 
} from './IStorageService';
import { IOSSConfig } from '../../models/StorageSettings';

/**
 * OSS存储服务实现
 */
export class OSSStorageService extends BaseStorageService implements IStorageService {
  private client: OSS.Client | null = null;
  private config: IOSSConfig;
  
  constructor(config: IOSSConfig) {
    super();
    this.config = config;
  }
  
  /**
   * 初始化OSS客户端
   */
  async initialize(): Promise<void> {
    try {
      this.client = new OSS({
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        bucket: this.config.bucket,
        region: this.config.region,
        endpoint: this.config.endpoint,
        secure: this.config.secure
      });
      
      // 测试连接
      await this.testConnection();
      this.initialized = true;
      
      console.log('OSS存储服务初始化成功');
    } catch (error) {
      console.error('OSS存储服务初始化失败：', error);
      throw new Error(`OSS初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 上传文件
   */
  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const uploadOptions: any = {
        headers: {}
      };
      
      if (options?.contentType) {
        uploadOptions.headers['Content-Type'] = options.contentType;
      }
      
      if (options?.cacheControl) {
        uploadOptions.headers['Cache-Control'] = options.cacheControl;
      }
      
      if (options?.metadata) {
        Object.keys(options.metadata).forEach(metaKey => {
          uploadOptions.headers[`x-oss-meta-${metaKey}`] = options.metadata![metaKey];
        });
      }
      
      if (options?.tags) {
        const tagString = Object.entries(options.tags)
          .map(([k, v]) => `${k}=${v}`)
          .join('&');
        uploadOptions.headers['x-oss-tagging'] = tagString;
      }
      
      const result = await this.client.put(key, buffer, uploadOptions);
      
      const fileInfo: IFileInfo = {
        key,
        url: this.getPublicUrl(key),
        size: buffer.length,
        contentType: options?.contentType || 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(),
        metadata: options?.metadata,
        tags: options?.tags
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('OSS文件上传失败：', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 上传文件流
   */
  async uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const uploadOptions: any = {
        headers: {}
      };
      
      if (options?.contentType) {
        uploadOptions.headers['Content-Type'] = options.contentType;
      }
      
      const result = await this.client.putStream(key, stream, uploadOptions);
      
      const fileInfo: IFileInfo = {
        key,
        url: this.getPublicUrl(key),
        size: 0, // 流上传时无法预知大小
        contentType: options?.contentType || 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(),
        metadata: options?.metadata,
        tags: options?.tags
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('OSS流上传失败：', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 下载文件
   */
  async downloadFile(key: string): Promise<Buffer> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const result = await this.client.get(key);
      return result.content as Buffer;
    } catch (error) {
      console.error('OSS文件下载失败：', error);
      throw new Error(`文件下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取文件流
   */
  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const result = await this.client.getStream(key);
      return result.stream;
    } catch (error) {
      console.error('OSS文件流获取失败：', error);
      throw new Error(`文件流获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取文件信息
   */
  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const result = await this.client.head(key);
      
      return {
        key,
        url: this.getPublicUrl(key),
        size: parseInt(result.res.headers['content-length'] || '0'),
        contentType: result.res.headers['content-type'] || 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(result.res.headers['last-modified'] || Date.now())
      };
    } catch (error) {
      console.error('OSS文件信息获取失败：', error);
      throw new Error(`文件信息获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取文件访问URL
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      // 如果配置了自定义域名，使用自定义域名
      if (this.config.customDomain) {
        return `${this.config.secure ? 'https' : 'http'}://${this.config.customDomain}/${key}`;
      }
      
      // 生成签名URL
      return this.client.signatureUrl(key, { expires: expiresIn });
    } catch (error) {
      console.error('OSS文件URL生成失败：', error);
      throw new Error(`文件URL生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取签名上传URL
   */
  async getSignedUploadUrl(key: string, expiresIn: number = 3600, options?: IUploadOptions): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const signOptions: any = {
        expires: expiresIn,
        method: 'PUT'
      };
      
      if (options?.contentType) {
        signOptions['Content-Type'] = options.contentType;
      }
      
      return this.client.signatureUrl(key, signOptions);
    } catch (error) {
      console.error('OSS签名上传URL生成失败：', error);
      throw new Error(`签名上传URL生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      await this.client.delete(key);
      return true;
    } catch (error) {
      console.error('OSS文件删除失败：', error);
      return false;
    }
  }
  
  /**
   * 批量删除文件
   */
  async deleteFiles(keys: string[]): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    
    try {
      // OSS支持批量删除，但有数量限制（1000个）
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < keys.length; i += batchSize) {
        batches.push(keys.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        try {
          const result = await this.client.deleteMulti(batch);
          
          batch.forEach(key => {
            const deleted = result.deleted?.includes(key);
            results.push({
              key,
              success: deleted || false,
              error: deleted ? undefined : '删除失败'
            });
            
            if (deleted) {
              successCount++;
            }
          });
        } catch (error) {
          batch.forEach(key => {
            results.push({
              key,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }
      }
    } catch (error) {
      keys.forEach(key => {
        results.push({
          key,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
    
    return {
      success: successCount === keys.length,
      results,
      totalCount: keys.length,
      successCount,
      failureCount: keys.length - successCount
    };
  }
  
  /**
   * 复制文件
   */
  async copyFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(sourceKey);
    this.validateFileKey(targetKey);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const copyOptions: any = {};
      
      if (options?.metadata) {
        copyOptions.headers = {};
        Object.keys(options.metadata).forEach(metaKey => {
          copyOptions.headers[`x-oss-meta-${metaKey}`] = options.metadata![metaKey];
        });
      }
      
      const result = await this.client.copy(targetKey, sourceKey, copyOptions);
      
      const fileInfo: IFileInfo = {
        key: targetKey,
        url: this.getPublicUrl(targetKey),
        size: 0, // 复制时无法直接获取大小
        contentType: 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(),
        metadata: options?.metadata
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('OSS文件复制失败：', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 移动文件
   */
  async moveFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    // 先复制，再删除源文件
    const copyResult = await this.copyFile(sourceKey, targetKey, options);
    
    if (copyResult.success) {
      await this.deleteFile(sourceKey);
    }
    
    return copyResult;
  }
  
  /**
   * 检查文件是否存在
   */
  async fileExists(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      await this.client.head(key);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 列出文件
   */
  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }
    
    try {
      const listOptions: any = {};
      
      if (options?.prefix) {
        listOptions.prefix = options.prefix;
      }
      
      if (options?.delimiter) {
        listOptions.delimiter = options.delimiter;
      }
      
      if (options?.maxKeys) {
        listOptions['max-keys'] = options.maxKeys;
      }
      
      if (options?.continuationToken) {
        listOptions.marker = options.continuationToken;
      }
      
      const result = await this.client.list(listOptions);
      
      const files: IFileInfo[] = (result.objects || []).map(obj => ({
        key: obj.name,
        url: this.getPublicUrl(obj.name),
        size: obj.size,
        contentType: 'application/octet-stream',
        etag: obj.etag,
        lastModified: new Date(obj.lastModified)
      }));
      
      return {
        files,
        isTruncated: result.isTruncated || false,
        continuationToken: result.nextMarker,
        commonPrefixes: result.prefixes
      };
    } catch (error) {
      console.error('OSS文件列表获取失败：', error);
      throw new Error(`文件列表获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<IStorageStats> {
    this.ensureInitialized();
    
    // OSS没有直接的统计API，需要通过列举所有文件来计算
    // 这里提供一个简化的实现
    try {
      const listResult = await this.listFiles({ maxKeys: 1000 });
      
      const totalSize = listResult.files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        totalFiles: listResult.files.length,
        totalSize,
        usedSpace: totalSize,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('OSS存储统计获取失败：', error);
      throw new Error(`存储统计获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      // 尝试列举存储桶内容来测试连接
      await this.client.list({ 'max-keys': 1 });
      return true;
    } catch (error) {
      console.error('OSS连接测试失败：', error);
      return false;
    }
  }
  
  /**
   * 清理临时文件
   */
  async cleanup(olderThan?: Date): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    
    const cutoffDate = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 默认清理24小时前的文件
    
    try {
      // 列出临时文件（假设临时文件有特定前缀）
      const listResult = await this.listFiles({ prefix: 'temp/' });
      
      const filesToDelete = listResult.files.filter(file => 
        file.lastModified && file.lastModified < cutoffDate
      );
      
      if (filesToDelete.length === 0) {
        return {
          success: true,
          results: [],
          totalCount: 0,
          successCount: 0,
          failureCount: 0
        };
      }
      
      const keys = filesToDelete.map(file => file.key);
      return await this.deleteFiles(keys);
    } catch (error) {
      console.error('OSS清理失败：', error);
      throw new Error(`清理失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取存储提供商名称
   */
  getProviderName(): string {
    return 'OSS';
  }
  
  /**
   * 获取存储配置信息（脱敏）
   */
  getConfigInfo(): Record<string, any> {
    return {
      provider: 'OSS',
      bucket: this.config.bucket,
      region: this.config.region,
      endpoint: this.config.endpoint,
      secure: this.config.secure,
      customDomain: this.config.customDomain,
      accessKeyId: this.config.accessKeyId ? `${this.config.accessKeyId.substring(0, 4)}****` : undefined
    };
  }
  
  /**
   * 获取公共访问URL
   */
  private getPublicUrl(key: string): string {
    if (this.config.customDomain) {
      return `${this.config.secure ? 'https' : 'http'}://${this.config.customDomain}/${key}`;
    }
    
    return `${this.config.secure ? 'https' : 'http'}://${this.config.bucket}.${this.config.endpoint}/${key}`;
  }
}
