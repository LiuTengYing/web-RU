/**
 * 网站设置服务 - 重构版本
 * 使用通用API客户端，消除重复代码
 */

import { BaseSettingsService } from './apiClient';

export interface SiteSettings {
  _id?: string;
  siteName: string;
  siteSubtitle: string;
  logoText: string;
  heroTitle: string;
  heroSubtitle: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 网站设置服务类
 * 继承BaseSettingsService，自动获得所有基础功能
 */
class SiteSettingsService extends BaseSettingsService<SiteSettings> {
  constructor() {
    super('/site-settings');
  }

  /**
   * 重置为默认设置
   */
  async resetToDefaults(): Promise<SiteSettings> {
    const defaultSettings: Partial<SiteSettings> = {
      siteName: 'AutomotiveHu',
      siteSubtitle: '汽车技术知识库',
      logoText: 'AutomotiveHu',
      heroTitle: '欢迎来到汽车技术知识库',
      heroSubtitle: '专业的汽车技术文档和解决方案'
    };

    const response = await this.updateSettings(defaultSettings);
    if (!response.success) {
      throw new Error(response.error || '重置设置失败');
    }
    return response.data!;
  }

  /**
   * 验证设置数据
   */
  validateSettings(settings: Partial<SiteSettings>): string[] {
    const errors: string[] = [];

    if (settings.siteName !== undefined && (!settings.siteName || settings.siteName.trim().length === 0)) {
      errors.push('网站名称不能为空');
    }

    if (settings.siteName && settings.siteName.length > 100) {
      errors.push('网站名称不能超过100个字符');
    }

    if (settings.logoText && settings.logoText.length > 50) {
      errors.push('Logo文字不能超过50个字符');
    }

    if (settings.heroTitle && settings.heroTitle.length > 200) {
      errors.push('主标题不能超过200个字符');
    }

    if (settings.heroSubtitle && settings.heroSubtitle.length > 300) {
      errors.push('副标题不能超过300个字符');
    }

    return errors;
  }

  /**
   * 安全更新设置（带验证）
   */
  async updateSettingsSafely(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const errors = this.validateSettings(settings);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return this.updateSettings(settings).then(response => {
      if (!response.success) {
        throw new Error(response.error || '更新设置失败');
      }
      return response.data!;
    });
  }
}

// 创建单例实例
export const siteSettingsService = new SiteSettingsService();

// 导出默认实例
export default siteSettingsService;

// 兼容旧API的包装函数
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const response = await siteSettingsService.getSettings();
  if (!response.success) {
    throw new Error(response.error || '获取网站设置失败');
  }
  return response.data!;
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
  return siteSettingsService.updateSettingsSafely(settings);
};
