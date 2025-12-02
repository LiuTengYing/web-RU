import { 
  IGeneralDocument, 
  IVideoTutorial, 
  IStructuredArticle,
  GeneralDocument,
  VideoTutorial,
  StructuredArticle
} from '../models/Document';
import { IUser } from '../models/User';
import User from '../models/User'; // 导入User模型，确保在使用populate前已注册
import mongoose from 'mongoose';

export class DocumentService {
  /**
   * 创建通用文档
   */
  async createGeneralDocument(
    documentData: Partial<IGeneralDocument>,
    author: IUser
  ): Promise<IGeneralDocument> {
    try {
      const document = new GeneralDocument({
        ...documentData,
        author: documentData.author || author.username, // 优先使用前端传入的author，如果没有则使用username
        authorId: author._id,
        status: documentData.status || 'draft', // 使用传入的status，如果没有则默认为draft
        documentType: 'general', // 确保设置documentType
        __t: 'general' // 显式设置discriminator字段
      });

      const savedDocument = await document.save();
      
      // 处理图片引用
      if (documentData.images && documentData.images.length > 0) {
        await this.processImageReferences((savedDocument._id as any).toString(), documentData.images, 'general');
      }

      // 更新分类统计
      if (savedDocument.category) {
        const categoryService = require('./categoryService').default;
        await categoryService.updateCategoryDocumentCount(savedDocument.category).catch((err: any) => {
          console.warn('更新分类统计失败:', err);
        });
      }

      return savedDocument;
    } catch (error) {
      console.error('创建通用文档失败:', error);
      throw error;
    }
  }

  /**
   * 创建视频教程
   */
  async createVideoTutorial(
    documentData: Partial<IVideoTutorial>,
    author: IUser
  ): Promise<IVideoTutorial> {
    try {
      const document = new VideoTutorial({
        ...documentData,
        author: documentData.author || author.username, // 优先使用前端传入的author，如果没有则使用username
        authorId: author._id,
        status: documentData.status || 'draft', // 使用传入的status，如果没有则默认为draft
        documentType: 'video', // 确保设置documentType
        __t: 'video' // 显式设置discriminator字段
      });

      const savedDocument = await document.save();
      
      // 处理缩略图引用
      if (documentData.thumbnail) {
        await this.processImageReferences((savedDocument._id as any).toString(), [{
          url: documentData.thumbnail,
          alt: documentData.title,
          order: 0
        }], 'video');
      }

      // 更新分类统计
      if (savedDocument.category) {
        const categoryService = require('./categoryService').default;
        await categoryService.updateCategoryDocumentCount(savedDocument.category).catch((err: any) => {
          console.warn('更新分类统计失败:', err);
        });
      }

      return savedDocument;
    } catch (error) {
      console.error('创建视频教程失败:', error);
      throw error;
    }
  }

  /**
   * 创建结构化文章
   */
  async createStructuredArticle(
    documentData: Partial<IStructuredArticle>,
    author: IUser
  ): Promise<IStructuredArticle> {
    try {
      const document = new StructuredArticle({
        ...documentData,
        author: documentData.author || author.username, // 优先使用前端传入的author，如果没有则使用username
        authorId: author._id,
        status: documentData.status || 'draft', // 使用传入的status，如果没有则默认为draft
        documentType: 'structured', // 确保设置documentType
        __t: 'structured' // 显式设置discriminator字段
      });

      const savedDocument = await document.save();
      
      // 处理所有图片引用
      await this.processStructuredArticleImages(savedDocument);

      return savedDocument;
    } catch (error) {
      console.error('创建结构化文章失败:', error);
      throw error;
    }
  }

  /**
   * 更新通用文档
   */
  async updateGeneralDocument(
    id: string,
    updates: Partial<IGeneralDocument>,
    author: IUser
  ): Promise<IGeneralDocument | null> {
    try {
      console.log('🔧 updateGeneralDocument 开始:', {
        id,
        updatesKeys: Object.keys(updates),
        imagesLength: updates.images ? updates.images.length : 0,
        images: updates.images,
        sectionsLength: updates.sections ? updates.sections.length : 0,
        sections: updates.sections?.map(s => ({ id: s.id, heading: s.heading, hasContent: !!s.content })) || []
      });

      const document = await GeneralDocument.findById(id);
      if (!document) return null;

      // 管理员权限检查（已通过路由层验证，这里不再检查）
      console.log('🔐 更新文档 - 用户角色:', author.role);

      // 记录旧分类，用于后续更新统计
      const oldCategory = document.category;

      // 处理图片更新
      if (updates.images) {
        console.log('🖼️ 处理图片更新:', {
          oldImages: document.images,
          newImages: updates.images
        });
        await this.updateDocumentImages(id, document.images, updates.images, 'general');
      } else {
        console.log('⚠️ updates.images 为空或未定义');
      }

      console.log('💾 准备更新文档:', {
        id,
        updateFields: Object.keys(updates)
      });

      const updatedDocument = await GeneralDocument.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      console.log('✅ 文档更新完成:', {
        id: updatedDocument?._id,
        imagesLength: updatedDocument?.images?.length || 0,
        images: updatedDocument?.images,
        sectionsLength: updatedDocument?.sections?.length || 0,
        sections: updatedDocument?.sections?.map(s => ({ id: s.id, heading: s.heading, hasContent: !!s.content })) || []
      });

      // 如果分类或状态发生变化，更新相关分类的文档统计
      const newCategory = updates.category || oldCategory;
      if (oldCategory !== newCategory || updates.status) {
        const categoryService = require('./categoryService').default;
        
        // 更新旧分类的统计
        if (oldCategory) {
          await categoryService.updateCategoryDocumentCount(oldCategory).catch((err: any) => {
            console.warn('更新旧分类统计失败:', err);
          });
        }
        
        // 更新新分类的统计（如果分类改变了）
        if (newCategory && newCategory !== oldCategory) {
          await categoryService.updateCategoryDocumentCount(newCategory).catch((err: any) => {
            console.warn('更新新分类统计失败:', err);
          });
        }
      }

      return updatedDocument;
    } catch (error) {
      console.error('更新通用文档失败:', error);
      throw error;
    }
  }

  /**
   * 更新视频教程
   */
  async updateVideoTutorial(
    id: string,
    updates: Partial<IVideoTutorial>,
    author: IUser
  ): Promise<IVideoTutorial | null> {
    try {
      const document = await VideoTutorial.findById(id);
      if (!document) return null;

      // 管理员权限检查（已通过路由层验证，这里不再检查）
      console.log('🔐 更新视频教程 - 用户角色:', author.role);

      // 记录旧分类，用于后续更新统计
      const oldCategory = document.category;

      // 处理缩略图更新
      if (updates.thumbnail && updates.thumbnail !== document.thumbnail) {
        const oldImages = document.thumbnail ? [{ url: document.thumbnail, alt: '', order: 0 }] : [];
        const newImages = updates.thumbnail ? [{ url: updates.thumbnail, alt: '', order: 0 }] : [];
        await this.updateDocumentImages(id, oldImages, newImages, 'video');
      }

      const updatedDocument = await VideoTutorial.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      // 如果分类或状态发生变化，更新相关分类的文档统计
      const newCategory = updates.category || oldCategory;
      if (oldCategory !== newCategory || updates.status) {
        const categoryService = require('./categoryService').default;
        
        // 更新旧分类的统计
        if (oldCategory) {
          await categoryService.updateCategoryDocumentCount(oldCategory).catch((err: any) => {
            console.warn('更新旧分类统计失败:', err);
          });
        }
        
        // 更新新分类的统计（如果分类改变了）
        if (newCategory && newCategory !== oldCategory) {
          await categoryService.updateCategoryDocumentCount(newCategory).catch((err: any) => {
            console.warn('更新新分类统计失败:', err);
          });
        }
      }

      return updatedDocument;
    } catch (error) {
      console.error('更新视频教程失败:', error);
      throw error;
    }
  }

  /**
   * 更新结构化文章
   */
  async updateStructuredArticle(
    id: string,
    updates: Partial<IStructuredArticle>,
    author: IUser
  ): Promise<IStructuredArticle | null> {
    try {
      const document = await StructuredArticle.findById(id);
      if (!document) return null;

      // 管理员权限检查（已通过路由层验证，这里不再检查）
      console.log('🔐 更新结构化文章 - 用户角色:', author.role);

      // 处理图片更新
      await this.updateStructuredArticleImages(id, document, updates);

      const updatedDocument = await StructuredArticle.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      // 注意：StructuredArticle 不使用分类系统，所以不需要更新分类统计

      return updatedDocument;
    } catch (error) {
      console.error('更新结构化文章失败:', error);
      throw error;
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(
    id: string,
    documentType: string,
    author: IUser
  ): Promise<boolean> {
    try {
      let document;
      
      switch (documentType) {
        case 'general':
          document = await GeneralDocument.findById(id);
          break;
        case 'video':
          document = await VideoTutorial.findById(id);
          break;
        case 'structured':
          document = await StructuredArticle.findById(id);
          break;
        default:
          throw new Error('无效的文档类型');
      }

      if (!document) return false;

      // 后台管理员有删除权限

      // 删除相关图片
      await this.deleteDocumentImages(id, documentType);

      // 保存分类信息用于更新统计
      const categoryName = document.category;

      // 删除文档
      await document.deleteOne();

      // 更新分类统计
      if (categoryName) {
        const categoryService = require('./categoryService').default;
        await categoryService.updateCategoryDocumentCount(categoryName).catch((err: any) => {
          console.warn('更新分类统计失败:', err);
        });
      }

      return true;
    } catch (error) {
      console.error('删除文档失败:', error);
      throw error;
    }
  }

  /**
   * 获取文档列表
   */
  async getDocuments(
    documentType: string,
    filters: {
      status?: string;
      category?: string;
      author?: string;
      search?: string;
      brand?: string;
      model?: string;
    } = {},
    pagination: {
      page: number;
      limit: number;
    } = { page: 1, limit: 10 }
  ) {
    try {
      console.log('📄 getDocuments 调用参数:', { documentType, filters, pagination });
      
      let model;
      
      switch (documentType) {
        case 'general':
          model = GeneralDocument;
          console.log('📄 使用 GeneralDocument 模型');
          break;
        case 'video':
          model = VideoTutorial;
          console.log('📄 使用 VideoTutorial 模型');
          break;
        case 'structured':
          model = StructuredArticle;
          console.log('📄 使用 StructuredArticle 模型');
          break;
        default:
          throw new Error('无效的文档类型: ' + documentType);
      }

      // 构建查询条件
      const query: any = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.category) query.category = filters.category;
      if (filters.author) query.author = filters.author;
      
      // 对于结构化文章，brand和model存储在basicInfo中
      if (documentType === 'structured') {
        if (filters.brand) query['basicInfo.brand'] = filters.brand;
        if (filters.model) query['basicInfo.model'] = filters.model;
      } else {
        if (filters.brand) query.brand = filters.brand;
        if (filters.model) query.model = filters.model;
      }
      
      if (filters.search) {
        // 转义特殊字符以避免正则表达式错误
        const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: escapedSearch, $options: 'i' };
        if (documentType === 'structured') {
          query.$or = [
            { title: searchRegex },
            { content: searchRegex },
            { summary: searchRegex },
            { 'basicInfo.introduction': searchRegex },
            { 'basicInfo.brand': searchRegex },
            { 'basicInfo.model': searchRegex },
            { 'basicInfo.yearRange': searchRegex }
          ];
        } else {
          query.$or = [
            { title: searchRegex },
            { content: searchRegex },
            { summary: searchRegex }
          ];
        }
      }

      // 执行查询
      console.log('📄 查询条件:', query);
      const total = await model.countDocuments(query);
      console.log('📄 文档总数:', total);
      
      let documentsQuery = (model as any)
        .find(query)
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .populate({ path: 'authorId', select: 'username avatar', model: User });

      // 只对通用文档 populate images 字段，因为其他类型没有这个字段
      if (documentType === 'general') {
        documentsQuery = documentsQuery.populate('images');
      }

      const documents = await documentsQuery;

      console.log('📄 查询结果:', {
        找到文档数: documents.length,
        文档标题: documents.map((d: any) => d.title),
        文档ID: documents.map((d: any) => d._id),
        文档__t: documents.map((d: any) => d.__t)
      });

      // 详细检查通用文档的数据结构
      if (documentType === 'general' && documents.length > 0) {
        const firstDoc = documents[0];
        console.log('🔍 第一个通用文档详细信息:', {
          title: firstDoc.title,
          author: firstDoc.author,
          images: firstDoc.images,
          imagesLength: firstDoc.images ? firstDoc.images.length : 0,
          heroImageUrl: firstDoc.heroImageUrl,
          sections: firstDoc.sections,
          sectionsLength: firstDoc.sections ? firstDoc.sections.length : 0,
          sectionsData: firstDoc.sections ? JSON.stringify(firstDoc.sections, null, 2) : null,
          content: firstDoc.content ? firstDoc.content.substring(0, 100) + '...' : null,
          allFields: Object.keys(firstDoc.toObject ? firstDoc.toObject() : firstDoc)
        });
      }

      return {
        documents,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      console.error('获取文档列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个文档
   * @param id 文档ID
   * @param documentType 文档类型
   * @param incrementViews 是否增加浏览量（默认false，使用独立的浏览记录API）
   */
  async getDocument(id: string, documentType: string, incrementViews: boolean = false) {
    try {
      let model;
      
      switch (documentType) {
        case 'general':
          model = GeneralDocument;
          break;
        case 'video':
          model = VideoTutorial;
          break;
        case 'structured':
          model = StructuredArticle;
          break;
        default:
          throw new Error('无效的文档类型');
      }

      const document = await (model as any).findById(id).populate({ path: 'authorId', select: 'username avatar', model: User });
      
      console.log('🔍 getDocument查询结果:', {
        id,
        documentType,
        found: !!document,
        title: document?.title,
        hasImages: !!document?.images,
        imagesLength: document?.images?.length || 0,
        hasSections: !!document?.sections,
        sectionsLength: document?.sections?.length || 0,
        sections: document?.sections?.map((s: any) => ({ id: s.id, heading: s.heading, hasContent: !!s.content })) || []
      });
      
      // 如果明确要求增加浏览量（向后兼容）
      if (document && incrementViews) {
        await (model as any).findByIdAndUpdate(id, { $inc: { views: 1 } });
      }

      return document;
    } catch (error) {
      console.error('获取文档失败:', error);
      throw error;
    }
  }

  /**
   * 处理图片引用
   */
  private async processImageReferences(
    documentId: string,
    images: Array<{ url: string; alt?: string; order?: number }>,
    documentType: string
  ) {
    for (const image of images) {
      if (image.url) {
        await this.addImageReference(documentId, image.url, documentType, 'content');
      }
    }
  }

  /**
   * 处理结构化文章图片
   */
  private async processStructuredArticleImages(document: IStructuredArticle) {
    const documentId = (document._id as any).toString();
    
    // 处理基本信息图片
    if (document.basicInfo?.vehicleImage) {
      await this.addImageReference(documentId, document.basicInfo.vehicleImage, 'structured', 'vehicleImage');
    }

    // 处理兼容车型图片
    if (document.compatibleModels) {
      for (const model of document.compatibleModels) {
        if (model.dashboardImage) {
          await this.addImageReference(documentId, model.dashboardImage, 'structured', 'dashboardImage');
        }
        if (model.originalHost) {
          const { frontImage, backImage, pinDefinitionImage, wiringDiagram } = model.originalHost;
          if (frontImage) await this.addImageReference(documentId, frontImage, 'structured', 'frontImage');
          if (backImage) await this.addImageReference(documentId, backImage, 'structured', 'backImage');
          if (pinDefinitionImage) await this.addImageReference(documentId, pinDefinitionImage, 'structured', 'pinDefinitionImage');
          if (wiringDiagram) await this.addImageReference(documentId, wiringDiagram, 'structured', 'wiringDiagram');
        }
      }
    }
  }

  /**
   * 添加图片引用
   */
  private async addImageReference(
    documentId: string,
    imageUrl: string,
    documentType: string,
    fieldName: string
  ) {
    try {
      const ImageResource = mongoose.model('ImageResource');
      
      await ImageResource.findOneAndUpdate(
        { url: imageUrl },
        { 
          $inc: { usageCount: 1 },
          lastUsed: new Date(),
          status: 'active',
          $push: {
            references: {
              documentId: new mongoose.Types.ObjectId(documentId),
              documentType,
              fieldName
            }
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('添加图片引用失败:', error);
    }
  }

  /**
   * 更新文档图片
   */
  private async updateDocumentImages(
    documentId: string,
    oldImages: Array<{ url: string; alt?: string; order?: number }>,
    newImages: Array<{ url: string; alt?: string; order?: number }>,
    documentType: string
  ) {
    const oldUrls = oldImages.map(img => img.url).filter(Boolean);
    const newUrls = newImages.map(img => img.url).filter(Boolean);
    
    // 找出需要删除的图片
    const urlsToDelete = oldUrls.filter(url => !newUrls.includes(url));
    
    // 找出需要添加的图片
    const urlsToAdd = newUrls.filter(url => !oldUrls.includes(url));
    
    // 删除旧图片引用
    for (const url of urlsToDelete) {
      await this.removeImageReference(documentId, url);
    }
    
    // 添加新图片引用
    for (const image of newImages) {
      if (image.url && urlsToAdd.includes(image.url)) {
        await this.addImageReference(documentId, image.url, documentType, 'content');
      }
    }
  }

  /**
   * 更新结构化文章图片
   */
  private async updateStructuredArticleImages(
    documentId: string,
    oldDocument: IStructuredArticle,
    updates: Partial<IStructuredArticle>
  ) {
    // 处理基本信息图片更新
    if (updates.basicInfo?.vehicleImage && updates.basicInfo.vehicleImage !== oldDocument.basicInfo?.vehicleImage) {
      if (oldDocument.basicInfo?.vehicleImage) {
        await this.removeImageReference(documentId, oldDocument.basicInfo.vehicleImage);
      }
      if (updates.basicInfo.vehicleImage) {
        await this.addImageReference(documentId, updates.basicInfo.vehicleImage, 'structured', 'vehicleImage');
      }
    }

    // 处理兼容车型图片更新
    if (updates.compatibleModels) {
      // 这里需要更复杂的逻辑来处理数组的差异
      // 暂时简化处理
      for (const model of updates.compatibleModels) {
        if (model.dashboardImage) {
          await this.addImageReference(documentId, model.dashboardImage, 'structured', 'dashboardImage');
        }
      }
    }
  }

  /**
   * 移除图片引用
   */
  private async removeImageReference(documentId: string, imageUrl: string) {
    try {
      const ImageResource = mongoose.model('ImageResource');
      
      await ImageResource.findOneAndUpdate(
        { url: imageUrl },
        { 
          $pull: {
            references: {
              documentId: new mongoose.Types.ObjectId(documentId)
            }
          }
        }
      );
      
      // 检查是否还有其他引用
      const image = await ImageResource.findOne({ url: imageUrl });
      if (image && image.references.length === 0) {
        await ImageResource.findOneAndUpdate(
          { url: imageUrl },
          { 
            status: 'orphaned',
            orphanedAt: new Date()
          }
        );
      }
    } catch (error) {
      console.error('移除图片引用失败:', error);
    }
  }

  /**
   * 删除文档相关图片
   */
  private async deleteDocumentImages(documentId: string, documentType: string) {
    try {
      const ImageResource = mongoose.model('ImageResource');
      
      // 查找所有引用此文档的图片
      const images = await ImageResource.find({
        'references.documentId': new mongoose.Types.ObjectId(documentId)
      });
      
    } catch (error) {
      console.error('删除文档图片失败:', error);
    }
  }
}

export default new DocumentService();
