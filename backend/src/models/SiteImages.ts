/**
 * 网站图片配置模型
 * 用于管理网站首页的 Hero 图片和 Install 图片
 */

import mongoose, { Schema, Document } from 'mongoose';

// 网站图片配置接口
export interface ISiteImages extends Document {
  _id: string;
  heroImage: string;        // Hero 图片 URL
  installImage: string;     // Install 图片 URL
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

const SiteImagesSchema = new Schema<ISiteImages>({
  heroImage: {
    type: String,
    required: false,
    default: ''
  },
  installImage: {
    type: String,
    required: false,
    default: ''
  },
  updatedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true,
  collection: 'site_images'
});

// 确保只有一条配置记录
SiteImagesSchema.index({}, { unique: false });

// 静态方法：获取网站图片配置
SiteImagesSchema.statics.getImages = async function() {
  let config = await this.findOne();
  
  // 如果不存在配置，创建默认配置
  if (!config) {
    config = await this.create({
      heroImage: '',
      installImage: '',
      updatedBy: 'system'
    });
  }
  
  return config;
};

// 静态方法：更新网站图片配置
SiteImagesSchema.statics.updateImages = async function(
  updates: { heroImage?: string; installImage?: string },
  updatedBy: string = 'admin'
) {
  let config = await this.findOne();
  
  if (!config) {
    // 如果不存在，创建新配置
    config = await this.create({
      heroImage: updates.heroImage || '',
      installImage: updates.installImage || '',
      updatedBy
    });
  } else {
    // 更新现有配置
    if (updates.heroImage !== undefined) {
      config.heroImage = updates.heroImage;
    }
    if (updates.installImage !== undefined) {
      config.installImage = updates.installImage;
    }
    config.updatedBy = updatedBy;
    
    await config.save();
  }
  
  return config;
};

// 实例方法：验证图片 URL
SiteImagesSchema.methods.validateUrls = function(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 验证 URL 格式（如果不为空）
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  
  if (this.heroImage && !urlPattern.test(this.heroImage)) {
    errors.push('Hero 图片 URL 格式不正确');
  }
  
  if (this.installImage && !urlPattern.test(this.installImage)) {
    errors.push('Install 图片 URL 格式不正确');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

const SiteImages = mongoose.model<ISiteImages>('SiteImages', SiteImagesSchema);

export default SiteImages;

