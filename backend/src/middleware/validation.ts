import { Request, Response, NextFunction } from 'express';

/**
 * 文档验证中间件
 */
export const validateDocument = (documentType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { body } = req;
      
      switch (documentType) {
        case 'general':
          if (!validateGeneralDocument(body)) {
            return res.status(400).json({
              success: false,
              error: '通用文档数据验证失败',
              details: getGeneralDocumentValidationErrors(body)
            });
          }
          break;
          
        case 'video':
          if (!validateVideoTutorial(body)) {
            const errors = getVideoTutorialValidationErrors(body);
            console.error('❌ 视频教程验证失败:', errors);
            console.error('📦 接收到的数据:', JSON.stringify(body, null, 2));
            return res.status(400).json({
              success: false,
              error: '视频教程数据验证失败',
              details: errors
            });
          }
          break;
          
        case 'structured':
          if (!validateStructuredArticle(body)) {
            return res.status(400).json({
              success: false,
              error: '结构化文章数据验证失败',
              details: getStructuredArticleValidationErrors(body)
            });
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: '无效的文档类型'
          });
      }
      
      next();
    } catch (error) {
      console.error('文档验证中间件错误:', error);
      return res.status(500).json({
        success: false,
        error: '验证失败'
      });
    }
  };
};

/**
 * 验证通用文档数据
 */
function validateGeneralDocument(data: any): boolean {
  // 必需字段
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return false;
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    return false;
  }
  
  if (!data.summary || typeof data.summary !== 'string' || data.summary.trim().length === 0) {
    return false;
  }
  
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    return false;
  }
  
  // 可选字段验证
  if (data.type && !['article', 'tutorial', 'guide'].includes(data.type)) {
    return false;
  }
  
  if (data.tags && !Array.isArray(data.tags)) {
    return false;
  }
  
  if (data.images && !Array.isArray(data.images)) {
    return false;
  }
  
  if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
    return false;
  }
  
  return true;
}

/**
 * 验证视频教程数据
 */
function validateVideoTutorial(data: any): boolean {
  // 必需字段
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return false;
  }
  
  if (!data.videoUrl || typeof data.videoUrl !== 'string' || data.videoUrl.trim().length === 0) {
    return false;
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    return false;
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    return false;
  }
  
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    return false;
  }
  
  // 平台验证
  if (!data.platform || !['youtube', 'bilibili', 'custom'].includes(data.platform)) {
    return false;
  }
  
  // 可选字段验证
  if (data.tags && !Array.isArray(data.tags)) {
    return false;
  }
  
  if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
    return false;
  }
  
  // URL 格式验证
  if (data.videoUrl) {
    try {
      new URL(data.videoUrl);
    } catch {
      return false;
    }
  }
  
  return true;
}

/**
 * 验证结构化文章数据
 */
function validateStructuredArticle(data: any): boolean {
  // 必需字段
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return false;
  }
  
  // 基本信息验证
  if (!data.basicInfo) {
    return false;
  }
  
  const { basicInfo } = data;
  if (!basicInfo.brand || typeof basicInfo.brand !== 'string' || basicInfo.brand.trim().length === 0) {
    return false;
  }
  
  if (!basicInfo.model || typeof basicInfo.model !== 'string' || basicInfo.model.trim().length === 0) {
    return false;
  }
  
  if (!basicInfo.yearRange || typeof basicInfo.yearRange !== 'string' || basicInfo.yearRange.trim().length === 0) {
    return false;
  }
  
  if (!basicInfo.introduction || typeof basicInfo.introduction !== 'string' || basicInfo.introduction.trim().length === 0) {
    return false;
  }
  
  if (!basicInfo.vehicleImage || typeof basicInfo.vehicleImage !== 'string' || basicInfo.vehicleImage.trim().length === 0) {
    return false;
  }
  
  // 功能特性验证
  if (!data.features) {
    return false;
  }
  
  const { features } = data;
  if (!Array.isArray(features.supported)) {
    return false;
  }
  
  if (!Array.isArray(features.unsupported)) {
    return false;
  }
  
  // 兼容车型验证
  if (!data.compatibleModels || !Array.isArray(data.compatibleModels)) {
    return false;
  }
  
  if (data.compatibleModels.length === 0) {
    return false;
  }
  
  // 验证每个兼容车型
  for (const model of data.compatibleModels) {
    if (!model.name || typeof model.name !== 'string' || model.name.trim().length === 0) {
      return false;
    }
    
    if (!model.description || typeof model.description !== 'string' || model.description.trim().length === 0) {
      return false;
    }
  }
  
  // FAQ 验证
  if (!data.faqs || !Array.isArray(data.faqs)) {
    return false;
  }
  
  if (data.faqs.length === 0) {
    return false;
  }
  
  // 验证每个 FAQ
  for (const faq of data.faqs) {
    if (!faq.title || typeof faq.title !== 'string' || faq.title.trim().length === 0) {
      return false;
    }
    
    if (!faq.description || typeof faq.description !== 'string' || faq.description.trim().length === 0) {
      return false;
    }
  }
  
  // 可选字段验证
  if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
    return false;
  }
  
  return true;
}

/**
 * 获取通用文档验证错误详情
 */
function getGeneralDocumentValidationErrors(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('标题不能为空');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('内容不能为空');
  }
  
  if (!data.summary || typeof data.summary !== 'string' || data.summary.trim().length === 0) {
    errors.push('摘要不能为空');
  }
  
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.push('分类不能为空');
  }
  
  if (data.type && !['article', 'tutorial', 'guide'].includes(data.type)) {
    errors.push('无效的文档类型');
  }
  
  if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
    errors.push('无效的状态值');
  }
  
  return errors;
}

/**
 * 获取视频教程验证错误详情
 */
function getVideoTutorialValidationErrors(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('标题不能为空');
  }
  
  if (!data.videoUrl || typeof data.videoUrl !== 'string' || data.videoUrl.trim().length === 0) {
    errors.push('视频链接不能为空');
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('视频描述不能为空');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('详细说明不能为空');
  }
  
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.push('分类不能为空');
  }
  
  if (!data.platform || !['youtube', 'bilibili', 'custom'].includes(data.platform)) {
    errors.push('无效的视频平台');
  }
  
  if (data.videoUrl) {
    try {
      new URL(data.videoUrl);
    } catch {
      errors.push('视频链接格式无效');
    }
  }
  
  return errors;
}

/**
 * 获取结构化文章验证错误详情
 */
function getStructuredArticleValidationErrors(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('标题不能为空');
  }
  
  if (!data.basicInfo) {
    errors.push('基本信息不能为空');
  } else {
    const { basicInfo } = data;
    
    if (!basicInfo.brand || typeof basicInfo.brand !== 'string' || basicInfo.brand.trim().length === 0) {
      errors.push('品牌不能为空');
    }
    
    if (!basicInfo.model || typeof basicInfo.model !== 'string' || basicInfo.model.trim().length === 0) {
      errors.push('型号不能为空');
    }
    
    if (!basicInfo.yearRange || typeof basicInfo.yearRange !== 'string' || basicInfo.yearRange.trim().length === 0) {
      errors.push('年份范围不能为空');
    }
    
    if (!basicInfo.introduction || typeof basicInfo.introduction !== 'string' || basicInfo.introduction.trim().length === 0) {
      errors.push('介绍不能为空');
    }
    
    if (!basicInfo.vehicleImage || typeof basicInfo.vehicleImage !== 'string' || basicInfo.vehicleImage.trim().length === 0) {
      errors.push('车辆图片不能为空');
    }
  }
  
  if (!data.features) {
    errors.push('功能特性不能为空');
  } else {
    const { features } = data;
    
    if (!Array.isArray(features.supported)) {
      errors.push('支持的功能必须是数组');
    }
    
    if (!Array.isArray(features.unsupported)) {
      errors.push('不支持的功能必须是数组');
    }
  }
  
  if (!data.compatibleModels || !Array.isArray(data.compatibleModels)) {
    errors.push('兼容车型不能为空');
  } else if (data.compatibleModels.length === 0) {
    errors.push('至少需要一个兼容车型');
  } else {
    for (let i = 0; i < data.compatibleModels.length; i++) {
      const model = data.compatibleModels[i];
      
      if (!model.name || typeof model.name !== 'string' || model.name.trim().length === 0) {
        errors.push(`第 ${i + 1} 个兼容车型的名称不能为空`);
      }
      
      if (!model.description || typeof model.description !== 'string' || model.description.trim().length === 0) {
        errors.push(`第 ${i + 1} 个兼容车型的描述不能为空`);
      }
    }
  }
  
  if (!data.faqs || !Array.isArray(data.faqs)) {
    errors.push('FAQ 不能为空');
  } else if (data.faqs.length === 0) {
    errors.push('至少需要一个 FAQ');
  } else {
    for (let i = 0; i < data.faqs.length; i++) {
      const faq = data.faqs[i];
      
      if (!faq.title || typeof faq.title !== 'string' || faq.title.trim().length === 0) {
        errors.push(`第 ${i + 1} 个 FAQ 的标题不能为空`);
      }
      
      if (!faq.description || typeof faq.description !== 'string' || faq.description.trim().length === 0) {
        errors.push(`第 ${i + 1} 个 FAQ 的描述不能为空`);
      }
    }
  }
  
  return errors;
}

/**
 * 通用字段验证
 */
export const validateCommonFields = (data: any): boolean => {
  // 标题长度验证
  if (data.title && (data.title.length < 3 || data.title.length > 200)) {
    return false;
  }
  
  // 内容长度验证
  if (data.content && data.content.length > 10000) {
    return false;
  }
  
  // 摘要长度验证
  if (data.summary && (data.summary.length < 10 || data.summary.length > 500)) {
    return false;
  }
  
  // 标签数量验证
  if (data.tags && data.tags.length > 20) {
    return false;
  }
  
  return true;
};

/**
 * 图片 URL 验证
 */
export const validateImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('aliyuncs.com');
  } catch {
    return false;
  }
};
