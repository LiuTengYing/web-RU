/**
 * 本地存储服务实现
 * 遵循接口隔离原则：实现IStorageService接口
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
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
import { ILocalConfig } from '../../models/StorageSettings';

const pipelineAsync = promisify(pipeline);
const fsReaddir = promisify(fs.readdir);
const fsStat = promisify(fs.stat);
const fsUnlink = promisify(fs.unlink);
const fsCopyFile = promisify(fs.copyFile);
const fsRename = promisify(fs.rename);

/**
 * 本地存储服务实现
 */
export class LocalStorageService extends BaseStorageService implements IStorageService {
  private config: ILocalConfig;
  
  constructor(config: ILocalConfig) {
    super();
    this.config = config;
  }
  
  /**
   * 初始化本地存储
   */
  async initialize(): Promise<void> {
    try {
      // 确保上传目录存在
      if (!fs.existsSync(this.config.uploadPath)) {
        fs.mkdirSync(this.config.uploadPath, { recursive: true });
      }
      
      // 创建子目录结构
      const subDirs = ['images', 'documents', 'videos', 'temp'];
      for (const subDir of subDirs) {
        const dirPath = path.join(this.config.uploadPath, subDir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
      
      // 测试写入权限
      const testFile = path.join(this.config.uploadPath, '.write_test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      this.initialized = true;
      console.log('本地存储服务初始化成功');
    } catch (error) {
      console.error('本地存储服务初始化失败：', error);
      throw new Error(`本地存储初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 上传文件
   */
  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    try {
      const filePath = this.getFilePath(key);
      const dirPath = path.dirname(filePath);
      
      // 确保目录存在
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // 检查文件大小
      if (buffer.length > this.config.maxFileSize) {
        return {
          success: false,
          error: `文件大小超过限制 (${this.formatFileSize(this.config.maxFileSize)})`
        };
      }
      
      // 检查文件扩展名
      const extension = path.extname(key).toLowerCase();
      if (this.config.allowedExtensions.length > 0 && !this.config.allowedExtensions.includes(extension)) {
        return {
          success: false,
          error: `不支持的文件类型: ${extension}`
        };
      }
      
      // 写入文件
      fs.writeFileSync(filePath, buffer);
      
      // 写入元数据文件（如果有）
      if (options?.metadata || options?.tags) {
        const metadataPath = filePath + '.meta';
        const metadata = {
          metadata: options?.metadata,
          tags: options?.tags,
          contentType: options?.contentType,
          uploadedAt: new Date().toISOString()
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      }
      
      const stats = fs.statSync(filePath);
      const fileInfo: IFileInfo = {
        key,
        url: this.getPublicUrl(key),
        size: stats.size,
        contentType: options?.contentType || this.getMimeType(extension),
        lastModified: stats.mtime,
        metadata: options?.metadata,
        tags: options?.tags
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('本地文件上传失败：', error);
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
    
    try {
      const filePath = this.getFilePath(key);
      const dirPath = path.dirname(filePath);
      
      // 确保目录存在
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const writeStream = fs.createWriteStream(filePath);
      await pipelineAsync(stream, writeStream);
      
      const stats = fs.statSync(filePath);
      
      // 检查文件大小
      if (stats.size > this.config.maxFileSize) {
        fs.unlinkSync(filePath); // 删除超大文件
        return {
          success: false,
          error: `文件大小超过限制 (${this.formatFileSize(this.config.maxFileSize)})`
        };
      }
      
      const fileInfo: IFileInfo = {
        key,
        url: this.getPublicUrl(key),
        size: stats.size,
        contentType: options?.contentType || this.getMimeType(path.extname(key)),
        lastModified: stats.mtime,
        metadata: options?.metadata,
        tags: options?.tags
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('本地文件流上传失败：', error);
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
    
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    
    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('本地文件下载失败：', error);
      throw new Error(`文件下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取文件流
   */
  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    
    try {
      return fs.createReadStream(filePath);
    } catch (error) {
      console.error('本地文件流获取失败：', error);
      throw new Error(`文件流获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取文件信息
   */
  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    
    try {
      const stats = fs.statSync(filePath);
      const extension = path.extname(key);
      
      // 尝试读取元数据
      let metadata, tags;
      const metadataPath = filePath + '.meta';
      if (fs.existsSync(metadataPath)) {
        try {
          const metaContent = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          metadata = metaContent.metadata;
          tags = metaContent.tags;
        } catch (error) {
          // 忽略元数据读取错误
        }
      }
      
      return {
        key,
        url: this.getPublicUrl(key),
        size: stats.size,
        contentType: this.getMimeType(extension),
        lastModified: stats.mtime,
        metadata,
        tags
      };
    } catch (error) {
      console.error('本地文件信息获取失败：', error);
      throw new Error(`文件信息获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取文件访问URL
   */
  async getFileUrl(key: string, expiresIn?: number): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    // 本地存储不需要签名URL，直接返回公共URL
    return this.getPublicUrl(key);
  }
  
  /**
   * 获取签名上传URL
   */
  async getSignedUploadUrl(key: string, expiresIn?: number, options?: IUploadOptions): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    // 本地存储不支持签名上传URL
    throw new Error('本地存储不支持签名上传URL');
  }
  
  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    try {
      await fsUnlink(filePath);
      
      // 删除元数据文件（如果存在）
      const metadataPath = filePath + '.meta';
      if (fs.existsSync(metadataPath)) {
        await fsUnlink(metadataPath);
      }
      
      return true;
    } catch (error) {
      console.error('本地文件删除失败：', error);
      return false;
    }
  }
  
  /**
   * 批量删除文件
   */
  async deleteFiles(keys: string[]): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    
    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    
    for (const key of keys) {
      try {
        const success = await this.deleteFile(key);
        results.push({ key, success });
        if (success) {
          successCount++;
        }
      } catch (error) {
        results.push({
          key,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
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
    
    const sourcePath = this.getFilePath(sourceKey);
    const targetPath = this.getFilePath(targetKey);
    
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        error: '源文件不存在'
      };
    }
    
    try {
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      await fsCopyFile(sourcePath, targetPath);
      
      // 复制元数据文件（如果存在）
      const sourceMetaPath = sourcePath + '.meta';
      const targetMetaPath = targetPath + '.meta';
      if (fs.existsSync(sourceMetaPath)) {
        await fsCopyFile(sourceMetaPath, targetMetaPath);
      }
      
      const stats = fs.statSync(targetPath);
      const fileInfo: IFileInfo = {
        key: targetKey,
        url: this.getPublicUrl(targetKey),
        size: stats.size,
        contentType: this.getMimeType(path.extname(targetKey)),
        lastModified: stats.mtime,
        metadata: options?.metadata,
        tags: options?.tags
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('本地文件复制失败：', error);
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
    this.ensureInitialized();
    this.validateFileKey(sourceKey);
    this.validateFileKey(targetKey);
    
    const sourcePath = this.getFilePath(sourceKey);
    const targetPath = this.getFilePath(targetKey);
    
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        error: '源文件不存在'
      };
    }
    
    try {
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      await fsRename(sourcePath, targetPath);
      
      // 移动元数据文件（如果存在）
      const sourceMetaPath = sourcePath + '.meta';
      const targetMetaPath = targetPath + '.meta';
      if (fs.existsSync(sourceMetaPath)) {
        await fsRename(sourceMetaPath, targetMetaPath);
      }
      
      const stats = fs.statSync(targetPath);
      const fileInfo: IFileInfo = {
        key: targetKey,
        url: this.getPublicUrl(targetKey),
        size: stats.size,
        contentType: this.getMimeType(path.extname(targetKey)),
        lastModified: stats.mtime,
        metadata: options?.metadata,
        tags: options?.tags
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('本地文件移动失败：', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 检查文件是否存在
   */
  async fileExists(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }
  
  /**
   * 列出文件
   */
  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();
    
    try {
      const searchPath = options?.prefix ? 
        path.join(this.config.uploadPath, options.prefix) : 
        this.config.uploadPath;
      
      if (!fs.existsSync(searchPath)) {
        return {
          files: [],
          isTruncated: false
        };
      }
      
      const files: IFileInfo[] = [];
      const maxKeys = options?.maxKeys || 1000;
      
      await this.walkDirectory(searchPath, files, maxKeys, options?.prefix || '');
      
      // 排序
      files.sort((a, b) => a.key.localeCompare(b.key));
      
      return {
        files: files.slice(0, maxKeys),
        isTruncated: files.length > maxKeys
      };
    } catch (error) {
      console.error('本地文件列表获取失败：', error);
      throw new Error(`文件列表获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<IStorageStats> {
    this.ensureInitialized();
    
    try {
      const stats = await this.calculateDirectoryStats(this.config.uploadPath);
      
      return {
        totalFiles: stats.fileCount,
        totalSize: stats.totalSize,
        usedSpace: stats.totalSize,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('本地存储统计获取失败：', error);
      throw new Error(`存储统计获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 测试目录是否可访问
      if (!fs.existsSync(this.config.uploadPath)) {
        return false;
      }
      
      // 测试写入权限
      const testFile = path.join(this.config.uploadPath, '.connection_test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return true;
    } catch (error) {
      console.error('本地存储连接测试失败：', error);
      return false;
    }
  }
  
  /**
   * 清理临时文件
   */
  async cleanup(olderThan?: Date): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    
    const cutoffDate = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 默认清理24小时前的文件
    const tempPath = path.join(this.config.uploadPath, 'temp');
    
    if (!fs.existsSync(tempPath)) {
      return {
        success: true,
        results: [],
        totalCount: 0,
        successCount: 0,
        failureCount: 0
      };
    }
    
    const filesToDelete: string[] = [];
    await this.findOldFiles(tempPath, cutoffDate, filesToDelete);
    
    if (filesToDelete.length === 0) {
      return {
        success: true,
        results: [],
        totalCount: 0,
        successCount: 0,
        failureCount: 0
      };
    }
    
    // 转换为相对键名
    const keys = filesToDelete.map(filePath => 
      path.relative(this.config.uploadPath, filePath).replace(/\\/g, '/')
    );
    
    return await this.deleteFiles(keys);
  }
  
  /**
   * 获取存储提供商名称
   */
  getProviderName(): string {
    return 'Local';
  }
  
  /**
   * 获取存储配置信息（脱敏）
   */
  getConfigInfo(): Record<string, any> {
    return {
      provider: 'Local',
      uploadPath: this.config.uploadPath,
      baseUrl: this.config.baseUrl,
      maxFileSize: this.formatFileSize(this.config.maxFileSize),
      allowedExtensions: this.config.allowedExtensions
    };
  }
  
  /**
   * 获取文件系统路径
   */
  private getFilePath(key: string): string {
    return path.join(this.config.uploadPath, key);
  }
  
  /**
   * 获取公共访问URL
   */
  private getPublicUrl(key: string): string {
    return `${this.config.baseUrl}/${key}`.replace(/\/+/g, '/');
  }
  
  /**
   * 根据扩展名获取MIME类型
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
  
  /**
   * 递归遍历目录
   */
  private async walkDirectory(dirPath: string, files: IFileInfo[], maxFiles: number, prefix: string): Promise<void> {
    if (files.length >= maxFiles) {
      return;
    }
    
    const items = await fsReaddir(dirPath);
    
    for (const item of items) {
      if (files.length >= maxFiles) {
        break;
      }
      
      const itemPath = path.join(dirPath, item);
      const stats = await fsStat(itemPath);
      
      if (stats.isDirectory()) {
        await this.walkDirectory(itemPath, files, maxFiles, prefix);
      } else if (stats.isFile() && !item.endsWith('.meta')) {
        const relativePath = path.relative(this.config.uploadPath, itemPath);
        const key = relativePath.replace(/\\/g, '/');
        
        files.push({
          key,
          url: this.getPublicUrl(key),
          size: stats.size,
          contentType: this.getMimeType(path.extname(item)),
          lastModified: stats.mtime
        });
      }
    }
  }
  
  /**
   * 计算目录统计信息
   */
  private async calculateDirectoryStats(dirPath: string): Promise<{ fileCount: number; totalSize: number }> {
    let fileCount = 0;
    let totalSize = 0;
    
    const items = await fsReaddir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fsStat(itemPath);
      
      if (stats.isDirectory()) {
        const subStats = await this.calculateDirectoryStats(itemPath);
        fileCount += subStats.fileCount;
        totalSize += subStats.totalSize;
      } else if (stats.isFile() && !item.endsWith('.meta')) {
        fileCount++;
        totalSize += stats.size;
      }
    }
    
    return { fileCount, totalSize };
  }
  
  /**
   * 查找过期文件
   */
  private async findOldFiles(dirPath: string, cutoffDate: Date, filesToDelete: string[]): Promise<void> {
    const items = await fsReaddir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fsStat(itemPath);
      
      if (stats.isDirectory()) {
        await this.findOldFiles(itemPath, cutoffDate, filesToDelete);
      } else if (stats.isFile() && stats.mtime < cutoffDate) {
        filesToDelete.push(itemPath);
      }
    }
  }
}
