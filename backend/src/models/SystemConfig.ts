/**
 * 系统配置模型
 * 用于管理钉钉机器人、阿里云OSS等第三方服务配置
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// 钉钉机器人配置
export interface DingtalkConfig {
  webhook: string;
  secret: string;
  enabled: boolean;
}

// 阿里云OSS配置
export interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
  enabled: boolean;
}

// 系统配置接口
export interface ISystemConfig extends Document {
  _id: string;
  configType: 'dingtalk' | 'oss';
  config: DingtalkConfig | OSSConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// 静态方法接口
export interface ISystemConfigModel extends Model<ISystemConfig> {
  getConfig(configType: 'dingtalk' | 'oss'): Promise<DingtalkConfig | OSSConfig | null>;
  updateConfig(
    configType: 'dingtalk' | 'oss',
    newConfig: DingtalkConfig | OSSConfig,
    updatedBy?: string
  ): Promise<ISystemConfig>;
  testConfig(
    configType: 'dingtalk' | 'oss',
    config: DingtalkConfig | OSSConfig
  ): Promise<{ success: boolean; message: string; details?: any }>;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  configType: {
    type: String,
    required: true,
    enum: ['dingtalk', 'oss'],
    unique: true // 每种配置类型只能有一个
  },
  config: {
    type: Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  collection: 'system_configs'
});

// 索引
SystemConfigSchema.index({ configType: 1 }, { unique: true });

// 实例方法：验证配置
SystemConfigSchema.methods.validateConfig = function(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (this.configType === 'dingtalk') {
    const config = this.config as DingtalkConfig;
    if (!config.webhook) errors.push('钉钉Webhook地址不能为空');
    if (!config.secret) errors.push('钉钉Secret不能为空');
    if (config.webhook && !config.webhook.startsWith('https://oapi.dingtalk.com/robot/send')) {
      errors.push('钉钉Webhook地址格式不正确');
    }
  } else if (this.configType === 'oss') {
    const config = this.config as OSSConfig;
    if (!config.accessKeyId) errors.push('OSS AccessKeyId不能为空');
    if (!config.accessKeySecret) errors.push('OSS AccessKeySecret不能为空');
    if (!config.bucket) errors.push('OSS Bucket不能为空');
    if (!config.region) errors.push('OSS Region不能为空');
    if (!config.endpoint) errors.push('OSS Endpoint不能为空');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// 静态方法：获取配置
SystemConfigSchema.statics.getConfig = async function(configType: 'dingtalk' | 'oss') {
  const config = await this.findOne({ configType });
  return config?.config || null;
};

// 静态方法：更新配置
SystemConfigSchema.statics.updateConfig = async function(
  configType: 'dingtalk' | 'oss',
  newConfig: DingtalkConfig | OSSConfig,
  updatedBy: string = 'system'
) {
  const result = await this.findOneAndUpdate(
    { configType },
    { 
      config: newConfig,
      updatedBy
    },
    { 
      new: true, 
      upsert: true,
      runValidators: true
    }
  );
  
  return result;
};

// 静态方法：测试配置连接
SystemConfigSchema.statics.testConfig = async function(
  configType: 'dingtalk' | 'oss',
  config: DingtalkConfig | OSSConfig
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    if (configType === 'dingtalk') {
      const dingtalkConfig = config as DingtalkConfig;
      
      // 测试钉钉机器人连接
      const crypto = require('crypto');
      const timestamp = Date.now();
      const stringToSign = `${timestamp}\n${dingtalkConfig.secret}`;
      const hmac = crypto.createHmac('sha256', dingtalkConfig.secret);
      const sign = encodeURIComponent(hmac.update(stringToSign).digest('base64'));
      const url = `${dingtalkConfig.webhook}&timestamp=${timestamp}&sign=${sign}`;

      const testMessage = {
        msgtype: 'text',
        text: {
          content: '🔧 配置测试消息 - 钉钉机器人连接正常'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });

      const result = await response.json() as { errcode?: number; errmsg?: string };
      
      if (result.errcode === 0) {
        return { success: true, message: '钉钉机器人连接测试成功' };
      } else {
        return { 
          success: false, 
          message: `钉钉机器人连接失败: ${result.errmsg || '未知错误'}`,
          details: result
        };
      }
      
    } else if (configType === 'oss') {
      const ossConfig = config as OSSConfig;
      
      // 测试OSS连接
      const OSS = require('ali-oss');
      const client = new OSS({
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        bucket: ossConfig.bucket,
        region: ossConfig.region,
        endpoint: ossConfig.endpoint
      });

      // 尝试列出存储桶信息来测试连接
      await client.getBucketInfo();
      
      return { success: true, message: 'OSS连接测试成功' };
    }
    
    return { success: false, message: '未知的配置类型' };
    
  } catch (error) {
    console.error(`${configType}配置测试失败:`, error);
    return { 
      success: false, 
      message: `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: error
    };
  }
};

const SystemConfig = mongoose.model<ISystemConfig, ISystemConfigModel>('SystemConfig', SystemConfigSchema);

export default SystemConfig;
