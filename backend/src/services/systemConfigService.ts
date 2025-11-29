/**
 * 系统配置服务
 * 管理钉钉机器人、阿里云OSS等第三方服务配置
 */

import SystemConfig, { DingtalkConfig, OSSConfig } from '../models/SystemConfig';
import fs from 'fs';
import path from 'path';

class SystemConfigService {
  private configFilePath = path.resolve(process.cwd(), 'config.env');

  /**
   * 获取钉钉配置（显示用，敏感信息已掩码）
   */
  async getDingtalkConfig(): Promise<DingtalkConfig> {
    try {
      const config = await SystemConfig.getConfig('dingtalk') as DingtalkConfig;
      if (!config) {
        // 返回默认配置
        return {
          webhook: '',
          secret: '',
          enabled: false
        };
      }
      
      // 掩码敏感信息
      return {
        ...config,
        webhook: this.maskSensitiveData(config.webhook),
        secret: this.maskSensitiveData(config.secret)
      };
    } catch (error) {
      console.error('获取钉钉配置失败:', error);
      // 返回默认配置而不是null
      return {
        webhook: '',
        secret: '',
        enabled: false
      };
    }
  }

  /**
   * 获取钉钉配置（编辑用，包含真实数据）
   */
  async getDingtalkConfigForEdit(): Promise<DingtalkConfig> {
    try {
      const config = await SystemConfig.getConfig('dingtalk') as DingtalkConfig;
      if (!config) {
        // 返回默认配置
        return {
          webhook: '',
          secret: '',
          enabled: false
        };
      }
      return config;
    } catch (error) {
      console.error('获取钉钉编辑配置失败:', error);
      // 返回默认配置而不是null
      return {
        webhook: '',
        secret: '',
        enabled: false
      };
    }
  }

  /**
   * 更新钉钉配置
   */
  async updateDingtalkConfig(config: DingtalkConfig, updatedBy: string = 'admin'): Promise<DingtalkConfig> {
    try {
      // 验证配置
      const validation = this.validateDingtalkConfig(config);
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }

      // 保存到数据库
      const result = await SystemConfig.updateConfig('dingtalk', config, updatedBy);
      
      // 同步更新环境变量文件
      await this.updateEnvFile({
        DINGTALK_WEBHOOK: config.webhook,
        DINGTALK_SECRET: config.secret
      });

      // 更新运行时环境变量
      process.env.DINGTALK_WEBHOOK = config.webhook;
      process.env.DINGTALK_SECRET = config.secret;

      return result.config as DingtalkConfig;
    } catch (error) {
      console.error('更新钉钉配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取OSS配置（显示用，敏感信息已掩码）
   */
  async getOSSConfig(): Promise<OSSConfig> {
    try {
      const config = await SystemConfig.getConfig('oss') as OSSConfig;
      if (!config) {
        // 返回默认配置
        return {
          accessKeyId: '',
          accessKeySecret: '',
          bucket: '',
          region: '',
          endpoint: '',
          enabled: false
        };
      }
      
      // 掩码敏感信息
      return {
        ...config,
        accessKeyId: this.maskSensitiveData(config.accessKeyId),
        accessKeySecret: this.maskSensitiveData(config.accessKeySecret)
      };
    } catch (error) {
      console.error('获取OSS配置失败:', error);
      // 返回默认配置而不是null
      return {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: '',
        endpoint: '',
        enabled: false
      };
    }
  }

  /**
   * 获取OSS配置（编辑用，包含真实数据）
   */
  async getOSSConfigForEdit(): Promise<OSSConfig> {
    try {
      const config = await SystemConfig.getConfig('oss') as OSSConfig;
      if (!config) {
        // 返回默认配置
        return {
          accessKeyId: '',
          accessKeySecret: '',
          bucket: '',
          region: '',
          endpoint: '',
          enabled: false
        };
      }
      return config;
    } catch (error) {
      console.error('获取OSS编辑配置失败:', error);
      // 返回默认配置而不是null
      return {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: '',
        endpoint: '',
        enabled: false
      };
    }
  }

  /**
   * 更新OSS配置
   */
  async updateOSSConfig(config: OSSConfig, updatedBy: string = 'admin'): Promise<OSSConfig> {
    try {
      // 验证配置
      const validation = this.validateOSSConfig(config);
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }

      // 保存到数据库
      const result = await SystemConfig.updateConfig('oss', config, updatedBy);
      
      // 同步更新环境变量文件
      await this.updateEnvFile({
        OSS_ACCESS_KEY_ID: config.accessKeyId,
        OSS_ACCESS_KEY_SECRET: config.accessKeySecret,
        OSS_BUCKET: config.bucket,
        OSS_REGION: config.region,
        OSS_ENDPOINT: config.endpoint
      });

      // 更新运行时环境变量
      process.env.OSS_ACCESS_KEY_ID = config.accessKeyId;
      process.env.OSS_ACCESS_KEY_SECRET = config.accessKeySecret;
      process.env.OSS_BUCKET = config.bucket;
      process.env.OSS_REGION = config.region;
      process.env.OSS_ENDPOINT = config.endpoint;

      return result.config as OSSConfig;
    } catch (error) {
      console.error('更新OSS配置失败:', error);
      throw error;
    }
  }


  /**
   * 验证钉钉配置
   */
  private validateDingtalkConfig(config: DingtalkConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.webhook) {
      errors.push('Webhook地址不能为空');
    } else if (!config.webhook.startsWith('https://oapi.dingtalk.com/robot/send')) {
      errors.push('Webhook地址格式不正确');
    }
    
    if (!config.secret) {
      errors.push('Secret不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证OSS配置
   */
  private validateOSSConfig(config: OSSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.accessKeyId) errors.push('AccessKeyId不能为空');
    if (!config.accessKeySecret) errors.push('AccessKeySecret不能为空');
    if (!config.bucket) errors.push('Bucket不能为空');
    if (!config.region) errors.push('Region不能为空');
    if (!config.endpoint) errors.push('Endpoint不能为空');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 更新环境变量文件
   */
  private async updateEnvFile(updates: Record<string, string>): Promise<void> {
    try {
      let envContent = '';
      
      // 读取现有的环境变量文件
      if (fs.existsSync(this.configFilePath)) {
        envContent = fs.readFileSync(this.configFilePath, 'utf8');
      }

      // 解析现有的环境变量
      const envVars: Record<string, string> = {};
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      }

      // 更新环境变量
      Object.assign(envVars, updates);

      // 重新构建环境变量文件内容
      const newContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // 写入文件
      fs.writeFileSync(this.configFilePath, newContent, 'utf8');
      
      console.log('环境变量文件更新成功');
    } catch (error) {
      console.error('更新环境变量文件失败:', error);
      throw new Error('环境变量文件更新失败');
    }
  }

  /**
   * 初始化配置（从环境变量加载到数据库）
   */
  async initializeConfigs(): Promise<void> {
    try {
      // 初始化钉钉配置
      if (process.env.DINGTALK_WEBHOOK && process.env.DINGTALK_SECRET) {
        const existingDingtalk = await this.getDingtalkConfig();
        if (!existingDingtalk) {
          const dingtalkConfig: DingtalkConfig = {
            webhook: process.env.DINGTALK_WEBHOOK,
            secret: process.env.DINGTALK_SECRET,
            enabled: true
          };
          await SystemConfig.updateConfig('dingtalk', dingtalkConfig, 'system');
          console.log('✅ 钉钉配置初始化完成');
        }
      }

      // 初始化OSS配置
      if (process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET) {
        const existingOSS = await this.getOSSConfig();
        if (!existingOSS.accessKeyId) {
          const ossConfig: OSSConfig = {
            accessKeyId: process.env.OSS_ACCESS_KEY_ID,
            accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
            bucket: process.env.OSS_BUCKET || '',
            region: process.env.OSS_REGION || '',
            endpoint: process.env.OSS_ENDPOINT || '',
            enabled: true
          };
          await SystemConfig.updateConfig('oss', ossConfig, 'system');
          console.log('✅ OSS配置初始化完成');
        }
      }
    } catch (error) {
      console.error('配置初始化失败:', error);
    }
  }

  /**
   * 获取配置状态概览
   */
  async getConfigStatus(): Promise<{
    dingtalk: { configured: boolean; enabled: boolean };
    oss: { configured: boolean; enabled: boolean };
  }> {
    try {
      const dingtalkConfig = await this.getDingtalkConfig();
      const ossConfig = await this.getOSSConfig();

      return {
        dingtalk: {
          configured: !!(dingtalkConfig.webhook && dingtalkConfig.secret),
          enabled: dingtalkConfig.enabled || false
        },
        oss: {
          configured: !!(ossConfig.accessKeyId && ossConfig.accessKeySecret && ossConfig.bucket),
          enabled: ossConfig.enabled || false
        }
      };
    } catch (error) {
      console.error('获取配置状态失败:', error);
      return {
        dingtalk: { configured: false, enabled: false },
        oss: { configured: false, enabled: false }
      };
    }
  }

  /**
   * 掩码敏感数据
   */
  private maskSensitiveData(data: string): string {
    if (!data || data.length <= 4) {
      return '****';
    }
    
    // 显示前2个和后2个字符，中间用*替代
    const start = data.substring(0, 2);
    const end = data.substring(data.length - 2);
    const middle = '*'.repeat(Math.max(4, data.length - 4));
    
    return start + middle + end;
  }

  /**
   * 测试钉钉机器人配置
   */
  async testDingtalkConfig(config: DingtalkConfig): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.webhook || !config.secret) {
        return {
          success: false,
          message: '钉钉配置不完整，请检查 Webhook 和 Secret'
        };
      }

      // 验证 webhook 格式
      if (!config.webhook.startsWith('https://oapi.dingtalk.com/robot/send')) {
        return {
          success: false,
          message: 'Webhook 地址格式不正确，应以 https://oapi.dingtalk.com/robot/send 开头'
        };
      }

      // 创建测试消息
      const timestamp = Date.now();
      const secret = config.secret;
      const stringToSign = `${timestamp}\n${secret}`;
      const sign = require('crypto')
        .createHmac('sha256', secret)
        .update(stringToSign)
        .digest('base64');

      const testMessage = {
        msgtype: 'text',
        text: {
          content: `🤖 知识库系统测试消息\n时间: ${new Date().toLocaleString()}\n这是一条测试消息，用于验证钉钉机器人配置是否正确。`
        }
      };

      // 发送测试消息
      const response = await fetch(`${config.webhook}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      });

      const result = await response.json() as any;

      if (response.ok && result.errcode === 0) {
        return {
          success: true,
          message: '钉钉机器人测试成功！测试消息已发送到群聊。'
        };
      } else {
        return {
          success: false,
          message: `钉钉机器人测试失败: ${result.errmsg || '未知错误'}`
        };
      }
    } catch (error) {
      console.error('测试钉钉配置失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '测试钉钉配置时发生未知错误'
      };
    }
  }

  /**
   * 测试阿里云OSS配置
   */
  async testOSSConfig(config: OSSConfig): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!config.accessKeyId || !config.accessKeySecret || !config.bucket) {
        return {
          success: false,
          message: 'OSS配置不完整，请检查 AccessKey、Secret 和 Bucket'
        };
      }

      // 检查 ali-oss 模块是否可用
      let OSS;
      try {
        OSS = require('ali-oss');
      } catch (requireError) {
        console.error('ali-oss 模块未安装:', requireError);
        return {
          success: false,
          message: 'OSS功能不可用：ali-oss 模块未安装。请联系管理员安装依赖。'
        };
      }
      
      // 创建OSS客户端
      const client = new OSS({
        region: config.region || 'oss-cn-hangzhou',
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        bucket: config.bucket,
        endpoint: config.endpoint
      });

      // 测试连接 - 尝试获取存储桶信息
      const bucketInfo = await client.getBucketInfo();
      
      if (bucketInfo && bucketInfo.res && bucketInfo.res.status === 200) {
        // 获取存储桶统计信息
        let storageDetails = '';
        let storageData = null;
        
        try {
          const bucketStat = await client.getBucketStat();
          if (bucketStat && bucketStat.data) {
            const sizeInMB = Math.round(bucketStat.data.Storage / (1024 * 1024) * 100) / 100;
            const objectCount = bucketStat.data.ObjectCount || 0;
            storageDetails = `存储大小: ${sizeInMB} MB, 文件数量: ${objectCount}`;
            
            storageData = {
              bucket: config.bucket,
              region: config.region || 'oss-cn-hangzhou',
              endpoint: config.endpoint,
              storageSize: sizeInMB,
              objectCount: objectCount,
              creationDate: bucketInfo.bucket?.CreationDate || 'Unknown',
              storageClass: bucketInfo.bucket?.StorageClass || 'Standard'
            };
          }
        } catch (statError) {
          console.warn('获取存储桶统计信息失败:', statError);
          storageDetails = '连接成功，但无法获取详细统计信息';
          
          storageData = {
            bucket: config.bucket,
            region: config.region || 'oss-cn-hangzhou',
            endpoint: config.endpoint,
            storageSize: 0,
            objectCount: 0,
            creationDate: bucketInfo.bucket?.CreationDate || 'Unknown',
            storageClass: bucketInfo.bucket?.StorageClass || 'Standard'
          };
        }

        return {
          success: true,
          message: `OSS连接测试成功！\n存储桶: ${config.bucket}\n区域: ${config.region || 'oss-cn-hangzhou'}\n${storageDetails}`,
          details: storageData
        };
      } else {
        return {
          success: false,
          message: 'OSS连接测试失败，请检查配置信息'
        };
      }
    } catch (error) {
      console.error('测试OSS配置失败:', error);
      
      // 根据错误类型提供更具体的错误信息
      let errorMessage = '测试OSS配置时发生未知错误';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('invalidaccesskeyid')) {
          errorMessage = 'AccessKey ID 无效，请检查配置';
        } else if (errorMsg.includes('signaturedoesnotmatch')) {
          errorMessage = 'AccessKey Secret 无效，请检查配置';
        } else if (errorMsg.includes('nosuchbucket')) {
          errorMessage = '指定的存储桶不存在，请检查 Bucket 名称';
        } else if (errorMsg.includes('invalidbucketname')) {
          errorMessage = '存储桶名称无效，请检查 Bucket 名称格式';
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          errorMessage = '网络连接失败，请检查网络设置和 Endpoint 配置';
        } else if (errorMsg.includes('forbidden')) {
          errorMessage = '访问被拒绝，请检查 AccessKey 权限';
        } else {
          errorMessage = `连接失败: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * 获取OSS存储详情（用于显示在存储详情区域）
   */
  async getOSSStorageDetails(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const config = await SystemConfig.getConfig('oss') as OSSConfig;
      if (!config) {
        return {
          success: false,
          message: 'OSS配置不存在'
        };
      }

      if (!config.enabled) {
        return {
          success: false,
          message: 'OSS服务未启用'
        };
      }

      // 使用测试连接功能获取详细信息
      const testResult = await this.testOSSConfig(config);
      
      if (testResult.success && testResult.details) {
        return {
          success: true,
          data: testResult.details
        };
      } else {
        return {
          success: false,
          message: testResult.message || '无法获取存储详情'
        };
      }
    } catch (error) {
      console.error('获取OSS存储详情失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取存储详情失败'
      };
    }
  }
}

// 单例导出
export default new SystemConfigService();
