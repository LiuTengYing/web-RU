import SoftwareCategory, { ISoftwareCategory } from '../models/SoftwareCategory';
import Software, { ISoftware } from '../models/Software';

export class SoftwareService {
  // 软件分类管理
  async getAllCategories(): Promise<ISoftwareCategory[]> {
    return await SoftwareCategory.find().sort({ order: 1, createdAt: -1 });
  }

  async createCategory(categoryData: { name: string; order?: number }): Promise<ISoftwareCategory> {
    const category = new SoftwareCategory(categoryData);
    return await category.save();
  }

  async updateCategory(id: string, categoryData: { name?: string; order?: number }): Promise<ISoftwareCategory | null> {
    return await SoftwareCategory.findByIdAndUpdate(id, categoryData, { new: true });
  }

  async deleteCategory(id: string): Promise<boolean> {
    // 检查是否有软件使用此分类
    const softwareCount = await Software.countDocuments({ categoryId: id });
    if (softwareCount > 0) {
      throw new Error('Cannot delete category with existing software');
    }
    
    const result = await SoftwareCategory.findByIdAndDelete(id);
    return !!result;
  }

  // 软件管理
  async getAllSoftware(): Promise<ISoftware[]> {
    return await Software.find().populate('categoryId').sort({ createdAt: -1 });
  }

  async getSoftwareByCategory(categoryId: string): Promise<ISoftware[]> {
    return await Software.find({ categoryId }).populate('categoryId').sort({ createdAt: -1 });
  }

  async getSoftwareById(id: string): Promise<ISoftware | null> {
    return await Software.findById(id).populate('categoryId');
  }

  async createSoftware(softwareData: {
    name: string;
    categoryId: string;
    description: string;
    downloadUrl: string;
    importantNote?: string;
  }): Promise<ISoftware> {
    const software = new Software(softwareData);
    return await software.save();
  }

  async updateSoftware(id: string, softwareData: {
    name?: string;
    categoryId?: string;
    description?: string;
    downloadUrl?: string;
    importantNote?: string;
  }): Promise<ISoftware | null> {
    return await Software.findByIdAndUpdate(id, softwareData, { new: true }).populate('categoryId');
  }

  async deleteSoftware(id: string): Promise<boolean> {
    const result = await Software.findByIdAndDelete(id);
    return !!result;
  }
}

export const softwareService = new SoftwareService();
