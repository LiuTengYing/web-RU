/**
 * 车型服务 - 重构版本
 * 使用通用API客户端和CRUD基类，消除重复代码
 */

import { BaseCrudService } from './apiClient';

export interface Vehicle {
  _id?: string;
  id: number;
  brand: string;
  model: string;
  year: string;
  password: string;
  documents: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateVehicleData {
  brand: string;
  model: string;
  year: string;
  password: string;
}

export interface UpdateVehicleData {
  brand?: string;
  model?: string;
  year?: string;
  password?: string;
  documents?: number;
}

export interface VehicleStats {
  totalVehicles: number;
  totalDocuments: number;
  averageDocumentsPerVehicle: number;
}

/**
 * 车型服务类
 * 继承BaseCrudService，自动获得基础CRUD功能
 * 处理前后端字段映射（model <-> modelName）
 */
class VehicleService extends BaseCrudService<Vehicle, CreateVehicleData, UpdateVehicleData> {
  constructor() {
    super('/vehicles');
  }

  /**
   * 字段映射：前端 model <-> 后端 modelName
   */
  private mapToBackend(data: any): any {
    if (!data) return data;
    const mapped = { ...data };
    if (mapped.model) {
      mapped.modelName = mapped.model;
      delete mapped.model;
    }
    return mapped;
  }

  /**
   * 字段映射：后端 modelName <-> 前端 model
   */
  private mapFromBackend(data: any): any {
    if (!data) return data;
    const mapped = { ...data };
    if (mapped.modelName) {
      mapped.model = mapped.modelName;
      delete mapped.modelName;
    }
    // 确保有id字段
    if (!mapped.id && mapped._id) {
      mapped.id = mapped._id;
    }
    return mapped;
  }

  /**
   * 获取所有车型
   */
  async getVehicles(): Promise<Vehicle[]> {
    const response = await this.getList({ limit: 10000 });
    
    if (!response.success || !response.data) {
      console.warn('获取车型失败:', response.error);
      return [];
    }
    
    // response.data 是 PaginatedResponse<Vehicle>，包含 items 数组
    const vehicles = response.data.items || [];
    return vehicles.map((vehicle: any) => this.mapFromBackend(vehicle));
  }

  /**
   * 创建新车型
   */
  async createVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {
    const mappedData = this.mapToBackend(vehicleData);
    const response = await this.create(mappedData);
    
    if (!response.success) {
      throw new Error(response.error || '创建车型失败');
    }
    
    return this.mapFromBackend(response.data!);
  }

  /**
   * 更新车型
   */
  async updateVehicle(id: string, updates: UpdateVehicleData): Promise<Vehicle> {
    const mappedUpdates = this.mapToBackend(updates);
    const response = await this.update(id, mappedUpdates);
    
    if (!response.success) {
      throw new Error(response.error || '更新车型失败');
    }
    
    return this.mapFromBackend(response.data!);
  }

  /**
   * 删除车型
   */
  async deleteVehicle(id: string): Promise<boolean> {
    const response = await this.delete(id);
    return response.success;
  }

  /**
   * 获取车型统计
   */
  async getVehicleStats(): Promise<VehicleStats> {
    const response = await this.client.get<VehicleStats>(`${this.baseEndpoint}/stats`);
    
    if (!response.success) {
      console.warn('获取车型统计失败:', response.error);
      return {
        totalVehicles: 0,
        totalDocuments: 0,
        averageDocumentsPerVehicle: 0
      };
    }
    
    return response.data || {
      totalVehicles: 0,
      totalDocuments: 0,
      averageDocumentsPerVehicle: 0
    };
  }

  /**
   * 根据品牌、型号、年份查找车型
   */
  async findVehicleByBrandModelYear(brand: string, model: string, year: string): Promise<Vehicle | null> {
    try {
      const vehicles = await this.getVehicles();
      return vehicles.find(v => 
        v.brand === brand && 
        v.model === model && 
        v.year === year
      ) || null;
    } catch (error) {
      console.warn('查找车型失败:', error);
      return null;
    }
  }

  /**
   * 搜索车型
   */
  async searchVehicles(query: string): Promise<Vehicle[]> {
    const response = await this.client.get<Vehicle[]>(`${this.baseEndpoint}/search`, { q: query });
    
    if (!response.success) {
      console.warn('搜索车型失败:', response.error);
      return [];
    }
    
    return (response.data || []).map(vehicle => this.mapFromBackend(vehicle));
  }

  /**
   * 批量删除车型
   */
  async batchDeleteVehicles(ids: string[]): Promise<boolean> {
    const response = await this.batchDelete(ids);
    return response.success;
  }

  /**
   * 验证车型密码
   */
  async verifyVehiclePassword(id: string, password: string): Promise<boolean> {
    const response = await this.client.post<{ isValid: boolean }>(
      `${this.baseEndpoint}/${id}/verify-password`,
      { password }
    );
    
    return response.data?.isValid || false;
  }

  /**
   * 获取车型的文档数量
   */
  async getVehicleDocumentCount(id: string): Promise<number> {
    const response = await this.client.get<{ count: number }>(
      `${this.baseEndpoint}/${id}/documents/count`
    );
    
    return response.data?.count || 0;
  }
}

// 创建单例实例
export const vehicleService = new VehicleService();

// 导出默认实例
export default vehicleService;

// 兼容旧API的包装函数
export const getVehicles = () => vehicleService.getVehicles();
export const createVehicle = (vehicleData: CreateVehicleData) => vehicleService.createVehicle(vehicleData);
export const updateVehicle = (id: string, updates: UpdateVehicleData) => vehicleService.updateVehicle(id, updates);
export const deleteVehicle = (id: string) => vehicleService.deleteVehicle(id);
export const getVehicleStats = () => vehicleService.getVehicleStats();
export const findVehicleByBrandModelYear = (brand: string, model: string, year: string) => 
  vehicleService.findVehicleByBrandModelYear(brand, model, year);
