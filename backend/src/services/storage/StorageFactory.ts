/**
 * 存储服务工厂
 * 遵循工厂模式：根据配置创建相应的存储服务实例
 */

import { IStorageService } from './IStorageService';
import { OSSStorageService } from './OSSStorageService';
import { LocalStorageService } from './LocalStorageService';
import { IStorageSettings, STORAGE_PROVIDERS, StorageProvider } from '../../models/StorageSettings';

/**
 * 存储服务工厂类
 */
export class StorageFactory {
  private static instance: StorageFactory;
  private currentService: IStorageService | null = null;
  private currentProvider: StorageProvider | null = null;
  
  /**
   * 获取工厂单例
   */
  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }
  
  /**
   * 创建存储服务实例
   * @param settings 存储设置
   */
  async createStorageService(settings: IStorageSettings): Promise<IStorageService> {
    const provider = settings.currentProvider;
    
    // 如果当前服务已存在且提供商未变化，直接返回
    if (this.currentService && this.currentProvider === provider) {
      return this.currentService;
    }
    
    let service: IStorageService;
    
    switch (provider) {
      case STORAGE_PROVIDERS.OSS:
        service = new OSSStorageService(settings.providers.oss);
        break;
        
      case STORAGE_PROVIDERS.LOCAL:
        service = new LocalStorageService(settings.providers.local);
        break;
        
      case STORAGE_PROVIDERS.AWS_S3:
        // TODO: 实现AWS S3存储服务
        throw new Error('AWS S3存储服务尚未实现');
        
      case STORAGE_PROVIDERS.QCLOUD_COS:
        // TODO: 实现腾讯云COS存储服务
        throw new Error('腾讯云COS存储服务尚未实现');
        
      default:
        throw new Error(`不支持的存储提供商: ${provider}`);
    }
    
    // 初始化服务
    await service.initialize();
    
    // 缓存当前服务
    this.currentService = service;
    this.currentProvider = provider;
    
    console.log(`存储服务已切换到: ${service.getProviderName()}`);
    
    return service;
  }
  
  /**
   * 获取当前存储服务
   */
  getCurrentService(): IStorageService | null {
    return this.currentService;
  }
  
  /**
   * 获取当前存储提供商
   */
  getCurrentProvider(): StorageProvider | null {
    return this.currentProvider;
  }
  
  /**
   * 测试存储配置
   * @param provider 存储提供商
   * @param config 存储配置
   */
  async testStorageConfig(provider: StorageProvider, config: any): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      let service: IStorageService;
      
      switch (provider) {
        case STORAGE_PROVIDERS.OSS:
          service = new OSSStorageService(config);
          break;
          
        case STORAGE_PROVIDERS.LOCAL:
          service = new LocalStorageService(config);
          break;
          
        case STORAGE_PROVIDERS.AWS_S3:
          throw new Error('AWS S3存储服务尚未实现');
          
        case STORAGE_PROVIDERS.QCLOUD_COS:
          throw new Error('腾讯云COS存储服务尚未实现');
          
        default:
          throw new Error(`不支持的存储提供商: ${provider}`);
      }
      
      // 初始化并测试连接
      await service.initialize();
      const isConnected = await service.testConnection();
      
      if (!isConnected) {
        throw new Error('存储服务连接失败');
      }
      
      return {
        success: true,
        info: service.getConfigInfo()
      };
    } catch (error) {
      console.error(`存储配置测试失败 (${provider}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 获取所有支持的存储提供商
   */
  getSupportedProviders(): Array<{ provider: StorageProvider; name: string; description: string; implemented: boolean }> {
    return [
      {
        provider: STORAGE_PROVIDERS.LOCAL,
        name: '本地存储',
        description: '将文件存储在服务器本地磁盘',
        implemented: true
      },
      {
        provider: STORAGE_PROVIDERS.OSS,
        name: '阿里云OSS',
        description: '阿里云对象存储服务',
        implemented: true
      },
      {
        provider: STORAGE_PROVIDERS.AWS_S3,
        name: 'AWS S3',
        description: 'Amazon Simple Storage Service',
        implemented: false
      },
      {
        provider: STORAGE_PROVIDERS.QCLOUD_COS,
        name: '腾讯云COS',
        description: '腾讯云对象存储',
        implemented: false
      }
    ];
  }
  
  /**
   * 重置工厂状态
   */
  reset(): void {
    this.currentService = null;
    this.currentProvider = null;
  }
  
  /**
   * 获取存储服务统计信息
   */
  async getStorageStats(): Promise<any> {
    if (!this.currentService) {
      throw new Error('没有可用的存储服务');
    }
    
    try {
      const stats = await this.currentService.getStorageStats();
      return {
        ...stats,
        provider: this.currentService.getProviderName(),
        config: this.currentService.getConfigInfo()
      };
    } catch (error) {
      console.error('获取存储统计失败：', error);
      throw error;
    }
  }
  
  /**
   * 执行存储清理
   */
  async performCleanup(olderThan?: Date): Promise<any> {
    if (!this.currentService) {
      throw new Error('没有可用的存储服务');
    }
    
    try {
      const result = await this.currentService.cleanup(olderThan);
      console.log(`存储清理完成: 删除了 ${result.successCount} 个文件`);
      return result;
    } catch (error) {
      console.error('存储清理失败：', error);
      throw error;
    }
  }
}

/**
 * 导出默认工厂实例
 */
export const storageFactory = StorageFactory.getInstance();
