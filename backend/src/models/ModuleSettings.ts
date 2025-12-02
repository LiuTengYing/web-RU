/**
 * 模块设置模型
 * 遵循单一职责原则：专门管理功能模块的开关配置
 */

import { Schema, model, Document } from 'mongoose';

/**
 * 模块配置接口
 */
export interface IModuleConfig {
  enabled: boolean;
  displayOrder: number;
  permissions: string[];
  settings?: Record<string, any>;
}

/**
 * 模块设置接口
 */
export interface IModuleSettings extends Document {
  // 现有模块（保持向后兼容）
  knowledgeBase: IModuleConfig;
  forum: IModuleConfig;
  articles: IModuleConfig;
  categories: IModuleConfig;
  audioEqualizer: IModuleConfig;
  audioGenerator: IModuleConfig;
  contact: IModuleConfig;
  softwareDownloads: IModuleConfig;
  
  // 新增企业官网模块
  products: IModuleConfig;
  cases: IModuleConfig;
  news: IModuleConfig;
  services: IModuleConfig;
  about: IModuleConfig;
  supportCenter: IModuleConfig;
  
  // 系统设置
  siteSettings: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    guestAccess: boolean;
  };
  
  // 元数据
  updatedBy: string;
  updatedAt: Date;
  version: number;
  
  // 方法
  getEnabledModules(): Array<{ name: string; config: IModuleConfig }>;
  hasModulePermission(moduleName: string, userRoles: string[]): boolean;
}

/**
 * 默认模块配置
 */
export const DEFAULT_MODULE_CONFIG: IModuleConfig = {
  enabled: true,
  displayOrder: 999,
  permissions: ['admin'],
  settings: {}
};

/**
 * 模块设置Schema
 */
const ModuleSettingsSchema = new Schema<IModuleSettings>({
  // 现有模块配置
  knowledgeBase: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 1 },
      permissions: [{ type: String, default: ['admin', 'user'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 1, permissions: ['admin', 'user'] })
  },
  
  forum: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 2 },
      permissions: [{ type: String, default: ['admin', 'user'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 2, permissions: ['admin', 'user'] })
  },
  
  articles: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 3 },
      permissions: [{ type: String, default: ['admin', 'editor'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 3, permissions: ['admin', 'editor'] })
  },
  
  categories: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 4 },
      permissions: [{ type: String, default: ['admin', 'editor'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 4, permissions: ['admin', 'editor'] })
  },
  
  audioEqualizer: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 5 },
      permissions: [{ type: String, default: ['admin', 'user'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 5, permissions: ['admin', 'user'] })
  },
  
  audioGenerator: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 6 },
      permissions: [{ type: String, default: ['admin', 'user'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 6, permissions: ['admin', 'user'] })
  },
  
  contact: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 7 },
      permissions: [{ type: String, default: ['admin', 'user'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 7, permissions: ['admin', 'user'] })
  },
  
  softwareDownloads: {
    type: {
      enabled: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 8 },
      permissions: [{ type: String, default: ['admin', 'user'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 8, permissions: ['admin', 'user'] })
  },
  
  // 新增企业官网模块
  products: {
    type: {
      enabled: { type: Boolean, default: false },
      displayOrder: { type: Number, default: 10 },
      permissions: [{ type: String, default: ['admin', 'product_manager'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 10, permissions: ['admin', 'product_manager'], enabled: false })
  },
  
  cases: {
    type: {
      enabled: { type: Boolean, default: false },
      displayOrder: { type: Number, default: 11 },
      permissions: [{ type: String, default: ['admin', 'marketing'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 11, permissions: ['admin', 'marketing'], enabled: false })
  },
  
  news: {
    type: {
      enabled: { type: Boolean, default: false },
      displayOrder: { type: Number, default: 12 },
      permissions: [{ type: String, default: ['admin', 'marketing'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 12, permissions: ['admin', 'marketing'], enabled: false })
  },
  
  services: {
    type: {
      enabled: { type: Boolean, default: false },
      displayOrder: { type: Number, default: 13 },
      permissions: [{ type: String, default: ['admin', 'service_manager'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 13, permissions: ['admin', 'service_manager'], enabled: false })
  },
  
  about: {
    type: {
      enabled: { type: Boolean, default: false },
      displayOrder: { type: Number, default: 14 },
      permissions: [{ type: String, default: ['admin'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 14, permissions: ['admin'], enabled: false })
  },
  
  supportCenter: {
    type: {
      enabled: { type: Boolean, default: false },
      displayOrder: { type: Number, default: 15 },
      permissions: [{ type: String, default: ['admin', 'support'] }],
      settings: { type: Schema.Types.Mixed, default: {} }
    },
    default: () => ({ ...DEFAULT_MODULE_CONFIG, displayOrder: 15, permissions: ['admin', 'support'], enabled: false })
  },
  
  // 系统设置
  siteSettings: {
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    guestAccess: { type: Boolean, default: true }
  },
  
  // 元数据
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  collection: 'module_settings'
});

/**
 * 更新版本号中间件
 */
ModuleSettingsSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.updatedAt = new Date();
  }
  next();
});

/**
 * 获取启用的模块列表
 */
ModuleSettingsSchema.methods.getEnabledModules = function() {
  const enabledModules: Array<{ name: string; config: IModuleConfig }> = [];
  
  Object.keys(this.toObject()).forEach(key => {
    if (key !== '_id' && key !== '__v' && key !== 'siteSettings' && key !== 'updatedBy' && key !== 'updatedAt' && key !== 'version' && key !== 'createdAt') {
      const config = this[key] as IModuleConfig;
      if (config && config.enabled) {
        enabledModules.push({ name: key, config });
      }
    }
  });
  
  return enabledModules.sort((a, b) => a.config.displayOrder - b.config.displayOrder);
};

/**
 * 检查用户是否有模块权限
 */
ModuleSettingsSchema.methods.hasModulePermission = function(moduleName: string, userRoles: string[]) {
  const moduleConfig = this[moduleName] as IModuleConfig;
  if (!moduleConfig || !moduleConfig.enabled) {
    return false;
  }
  
  return moduleConfig.permissions.some(permission => userRoles.includes(permission));
};

export const ModuleSettings = model<IModuleSettings>('ModuleSettings', ModuleSettingsSchema);
