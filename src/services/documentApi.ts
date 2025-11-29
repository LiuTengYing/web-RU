/**
 * 文档API服务 - 重构版本
 * 使用通用API客户端和CRUD基类，消除重复代码
 */

import { BaseCrudService } from './apiClient';

export interface DocumentData {
  title: string;
  content: string;
  summary: string;
  description?: string; // 视频教程的描述字段
  category: string;
  // 分类系统已替代标签系统
  author: string;
  documentType: 'general' | 'video' | 'structured';
  status?: 'draft' | 'published' | 'archived';
  
  // 通用文档特有字段
  type?: 'article' | 'tutorial' | 'guide';
  images?: Array<{
    url: string;
    alt?: string;
    order?: number;
  }>;
  sections?: Array<{           // 新增sections字段
    id: string;
    heading: string;
    content: string;
    imageUrl?: string;
    imageAlt?: string;
    layout: 'imageLeft' | 'imageRight';
  }>;
  
  // 视频教程特有字段
  videoUrl?: string;
  videos?: Array<{             // 多个视频链接
    url: string;
    title: string;
    description?: string;
    platform: 'youtube' | 'bilibili' | 'custom';
    duration?: string;
    order: number;
  }>;
  platform?: 'youtube' | 'bilibili' | 'custom';
  duration?: string;
  thumbnail?: string;
  
  // 结构化文章特有字段
  vehicleInfo?: any;
  compatibleModels?: any[];
  incompatibleModels?: any[];
  faqs?: any[];
  vehicleImage?: string;
  introduction?: string;
  importantNotes?: string;
}

export interface DocumentResponse {
  _id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  documentType: string;
  status: string;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DocumentListParams {
  documentType?: 'general' | 'video' | 'structured';
  category?: string;
  status?: string;
  brand?: string;
  model?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface DocumentStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface ViewStats {
  uniqueViews: number;
  totalViews: number;
  viewsLast24h: number;
  viewsLast7d: number;
  viewsLast30d: number;
}

/**
 * 文档服务类
 * 继承BaseCrudService，自动获得基础CRUD功能
 * 支持多种文档类型的统一管理
 */
class DocumentService extends BaseCrudService<DocumentResponse, DocumentData, Partial<DocumentData>> {
  constructor() {
    super('/documents');
  }

  /**
   * 根据文档类型获取对应的API端点
   */
  private getDocumentEndpoint(documentType?: string): string {
    if (!documentType) return this.baseEndpoint;
    
    switch (documentType) {
      case 'general':
        return `${this.baseEndpoint}/general`;
      case 'video':
        return `${this.baseEndpoint}/video`;
      case 'structured':
        return `${this.baseEndpoint}/structured`;
      default:
        return this.baseEndpoint;
    }
  }

  /**
   * 创建文档
   */
  async createDocument(documentData: DocumentData): Promise<DocumentResponse> {
    console.log('📝 创建文档:', documentData.title, documentData.documentType);
    
    const endpoint = this.getDocumentEndpoint(documentData.documentType);
    const response = await this.client.post<DocumentResponse>(endpoint, documentData);
    
    if (!response.success) {
      throw new Error(response.error || '创建文档失败');
    }
    
    console.log('✅ 文档创建成功:', response.data!._id);
    return response.data!;
  }

  /**
   * 获取文档列表（通用）
   */
  async getDocuments(params?: DocumentListParams): Promise<DocumentListResponse> {
    console.log('📋 获取文档列表:', params);
    
    const endpoint = this.getDocumentEndpoint(params?.documentType);
    const response = await this.client.get<DocumentListResponse>(endpoint, params);
    
    if (!response.success) {
      throw new Error(response.error || '获取文档列表失败');
    }
    
    const result = response.data!;
    console.log('✅ 获取到文档:', result.documents?.length || 0, '个');
    
    return result;
  }

  /**
   * 获取单个文档
   */
  async getDocument(id: string, documentType?: 'general' | 'video' | 'structured'): Promise<DocumentResponse> {
    console.log('📄 获取文档详情:', id, documentType);
    
    const endpoint = documentType ? `${this.getDocumentEndpoint(documentType)}/${id}` : `${this.baseEndpoint}/${id}`;
    const response = await this.client.get<DocumentResponse>(endpoint);
    
    if (!response.success) {
      throw new Error(response.error || '获取文档失败');
    }
    
    console.log('✅ 文档详情获取成功:', response.data!.title);
    return response.data!;
  }

  /**
   * 更新文档
   */
  async updateDocument(id: string, documentData: Partial<DocumentData>, documentType?: 'general' | 'video' | 'structured'): Promise<DocumentResponse> {
    console.log('📝 更新文档:', id, documentData.title, documentType);
    
    const endpoint = documentType ? `${this.getDocumentEndpoint(documentType)}/${id}` : `${this.baseEndpoint}/${id}`;
    const response = await this.client.put<DocumentResponse>(endpoint, documentData);
    
    if (!response.success) {
      throw new Error(response.error || '更新文档失败');
    }
    
    console.log('✅ 文档更新成功:', response.data!._id);
    return response.data!;
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: string, documentType?: 'general' | 'video' | 'structured'): Promise<void> {
    console.log('🗑️ 删除文档:', id, documentType);
    
    const endpoint = documentType ? `${this.getDocumentEndpoint(documentType)}/${id}` : `${this.baseEndpoint}/${id}`;
    const response = await this.client.delete(endpoint);
    
    if (!response.success) {
      throw new Error(response.error || '删除文档失败');
    }
    
    console.log('✅ 文档删除成功');
  }

  /**
   * 搜索文档
   */
  async searchDocuments(query: string, options?: {
    documentType?: 'general' | 'video' | 'structured';
    category?: string;
    limit?: number;
  }): Promise<DocumentResponse[]> {
    console.log('🔍 搜索文档:', query, options);
    
    const endpoint = this.getDocumentEndpoint(options?.documentType);
    const params = { search: query, ...options };
    const response = await this.client.get<DocumentListResponse>(endpoint, params);
    
    if (!response.success) {
      console.warn('搜索文档失败:', response.error);
      return [];
    }
    
    const documents = response.data?.documents || [];
    console.log('✅ 搜索结果:', documents.length, '个文档');
    return documents;
  }

  /**
   * 发布文档
   */
  async publishDocument(id: string, documentType?: 'general' | 'video' | 'structured'): Promise<DocumentResponse> {
    console.log('📢 发布文档:', id, documentType);
    return await this.updateDocument(id, { status: 'published' }, documentType);
  }

  /**
   * 记录文档浏览
   */
  async recordDocumentView(
    id: string,
    documentType: 'general' | 'video' | 'structured',
    fingerprint: string,
    sessionId: string
  ): Promise<{ uniqueViews: number; totalViews: number; isNewView: boolean }> {
    try {
      const endpoint = `${this.getDocumentEndpoint(documentType)}/${id}/view`;
      const response = await this.client.post<{ uniqueViews: number; totalViews: number; isNewView: boolean }>(
        endpoint,
        { fingerprint, sessionId }
      );
      
      return response.data || { uniqueViews: 0, totalViews: 0, isNewView: false };
    } catch (error) {
      console.error('记录浏览失败:', error);
      // 即使记录失败也不影响用户体验
      return { uniqueViews: 0, totalViews: 0, isNewView: false };
    }
  }

  /**
   * 获取文档浏览统计
   */
  async getDocumentViewStats(
    id: string,
    documentType: 'general' | 'video' | 'structured'
  ): Promise<ViewStats> {
    const endpoint = `${this.getDocumentEndpoint(documentType)}/${id}/view-stats`;
    const response = await this.client.get<ViewStats>(endpoint);
    
    if (!response.success) {
      throw new Error(response.error || '获取浏览统计失败');
    }
    
    return response.data!;
  }

  /**
   * 获取文档统计信息
   */
  async getDocumentStats(): Promise<DocumentStats> {
    const response = await this.client.get<DocumentStats>(`${this.baseEndpoint}/stats`);
    
    if (!response.success) {
      console.warn('获取文档统计失败:', response.error);
      return {
        total: 0,
        byType: {},
        byStatus: {},
        byCategory: {}
      };
    }
    
    return response.data!;
  }

  /**
   * 验证文档密码
   */
  async validateDocumentPassword(documentId: string, password: string, documentType?: 'general' | 'video' | 'structured'): Promise<boolean> {
    try {
      const endpoint = documentType 
        ? `${this.getDocumentEndpoint(documentType)}/${documentId}/verify-password`
        : `${this.baseEndpoint}/${documentId}/verify-password`;
      
      const response = await this.client.post<{ isValid: boolean }>(endpoint, { password });
      
      return response.data?.isValid || false;
    } catch (error) {
      console.error('验证文档密码失败:', error);
      return false;
    }
  }

  /**
   * 批量删除文档
   */
  async batchDeleteDocuments(ids: string[], documentType?: 'general' | 'video' | 'structured'): Promise<void> {
    const endpoint = documentType 
      ? `${this.getDocumentEndpoint(documentType)}/batch`
      : `${this.baseEndpoint}/batch`;
    
    const response = await this.client.post<void>(endpoint, { ids });
    
    if (!response.success) {
      throw new Error(response.error || '批量删除失败');
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * 数据迁移（已废弃）
   */
  async migrateFromLocalStorage(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    console.warn('⚠️ migrateFromLocalStorage 已废弃，不再使用localStorage');
    return {
      success: 0,
      failed: 0,
      errors: []
    };
  }
}

// 创建单例实例
export const documentService = new DocumentService();

// 导出默认实例
export default documentService;

// 兼容旧API的包装函数
export const createDocument = (documentData: DocumentData) => documentService.createDocument(documentData);
export const getDocuments = (params?: DocumentListParams) => documentService.getDocuments(params);
export const getDocument = (id: string, documentType?: 'general' | 'video' | 'structured') => 
  documentService.getDocument(id, documentType);
export const updateDocument = (id: string, documentData: Partial<DocumentData>, documentType?: 'general' | 'video' | 'structured') => 
  documentService.updateDocument(id, documentData, documentType);
export const deleteDocument = (id: string, documentType?: 'general' | 'video' | 'structured') => 
  documentService.deleteDocument(id, documentType);
export const searchDocuments = (query: string, options?: { documentType?: 'general' | 'video' | 'structured'; category?: string; limit?: number; }) => 
  documentService.searchDocuments(query, options);
export const publishDocument = (id: string, documentType?: 'general' | 'video' | 'structured') => 
  documentService.publishDocument(id, documentType);
export const recordDocumentView = (id: string, documentType: 'general' | 'video' | 'structured', fingerprint: string, sessionId: string) => 
  documentService.recordDocumentView(id, documentType, fingerprint, sessionId);
export const getDocumentViewStats = (id: string, documentType: 'general' | 'video' | 'structured') => 
  documentService.getDocumentViewStats(id, documentType);
export const getDocumentStats = () => documentService.getDocumentStats();
export const validateDocumentPassword = (documentId: string, password: string, documentType?: 'general' | 'video' | 'structured') => 
  documentService.validateDocumentPassword(documentId, password, documentType);
export const healthCheck = () => documentService.healthCheck();
export const migrateFromLocalStorage = () => documentService.migrateFromLocalStorage();