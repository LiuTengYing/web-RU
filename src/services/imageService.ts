/**
 * 图片服务 - 完全基于后端API，避免本地存储
 * 确保所有设备都能看到相同的图片
 */

export interface HomepageImage {
  id: string
  name: string
  url: string
  alt: string
  type: 'hero' | 'installation' | 'vehicle-preview'
  createdAt: string
  updatedAt: string
}

// 默认图片配置 - 使用本地图片资源
const DEFAULT_IMAGES: HomepageImage[] = [
  {
    id: 'hero-bg',
    name: 'Hero Background',
    url: '/images/hero.png',
    alt: '汽车中控台背景图',
    type: 'hero',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'installation-scene',
    name: 'Installation Scene',
    url: '/images/install.png',
    alt: '汽车中控台安装场景图片',
    type: 'installation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

class ImageService {
  /**
   * 从后端API获取图片数据
   */
  async fetchImagesFromAPI(): Promise<HomepageImage[]> {
    try {
      const response = await fetch('/api/images')
      if (response.ok) {
        const data = await response.json()
        return data.images || DEFAULT_IMAGES
      }
    } catch (error) {
      console.error('从API获取图片失败:', error)
    }
    return DEFAULT_IMAGES
  }

  /**
   * 获取所有图片（只从API获取，不使用本地存储）
   */
  async getImages(): Promise<HomepageImage[]> {
    try {
      const apiImages = await this.fetchImagesFromAPI()
      return apiImages
    } catch (error) {
      console.error('获取图片失败，使用默认图片:', error)
      return DEFAULT_IMAGES
    }
  }

  /**
   * 根据类型获取图片（只从API获取）
   */
  async getImagesByType(type: HomepageImage['type']): Promise<HomepageImage[]> {
    try {
      const images = await this.getImages()
      return images.filter(img => img.type === type)
    } catch (error) {
      console.error('根据类型获取图片失败:', error)
      return DEFAULT_IMAGES.filter(img => img.type === type)
    }
  }

  /**
   * 根据ID获取图片（只从API获取）
   */
  async getImageById(id: string): Promise<HomepageImage | undefined> {
    try {
      const images = await this.getImages()
      return images.find(img => img.id === id)
    } catch (error) {
      console.error('根据ID获取图片失败:', error)
      return DEFAULT_IMAGES.find(img => img.id === id)
    }
  }

  /**
   * 更新图片到后端API
   */
  async updateImageToAPI(id: string, updates: Partial<HomepageImage>): Promise<boolean> {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      return response.ok
    } catch (error) {
      console.error('更新图片到API失败:', error)
      return false
    }
  }

  /**
   * 更新图片（只更新API，不使用本地存储）
   */
  async updateImage(id: string, updates: Partial<HomepageImage>): Promise<boolean> {
    try {
      const success = await this.updateImageToAPI(id, updates)
      if (success) {
        // 触发页面刷新，确保所有组件都能看到最新数据
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return success
    } catch (error) {
      console.error('更新图片失败:', error)
      return false
    }
  }

  /**
   * 删除图片（只从API删除）
   */
  async deleteImage(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE'
      })
      const success = response.ok
      if (success) {
        // 触发页面刷新
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return success
    } catch (error) {
      console.error('删除图片失败:', error)
      return false
    }
  }

  /**
   * 添加新图片（只保存到API）
   */
  async addImage(image: Omit<HomepageImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const newImage: HomepageImage = {
        ...image,
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newImage)
      })
      
      const success = response.ok
      if (success) {
        // 触发页面刷新
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return success
    } catch (error) {
      console.error('添加图片失败:', error)
      return false
    }
  }

  /**
   * 重置为默认图片（只更新API）
   */
  async resetToDefault(): Promise<boolean> {
    try {
      const response = await fetch('/api/images/reset', {
        method: 'POST'
      })
      const success = response.ok
      if (success) {
        // 触发页面刷新
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return success
    } catch (error) {
      console.error('重置图片失败:', error)
      return false
    }
  }

  // 保持向后兼容的同步方法（但实际调用异步方法）
  getImagesSync(): HomepageImage[] {
    console.warn('getImagesSync已废弃，请使用异步方法getImages()')
    return DEFAULT_IMAGES
  }

  getImagesByTypeSync(type: HomepageImage['type']): HomepageImage[] {
    console.warn('getImagesByTypeSync已废弃，请使用异步方法getImagesByType()')
    return DEFAULT_IMAGES.filter(img => img.type === type)
  }

  getImageByIdSync(id: string): HomepageImage | undefined {
    console.warn('getImageByIdSync已废弃，请使用异步方法getImageById()')
    return DEFAULT_IMAGES.find(img => img.id === id)
  }

  updateImageSync(_id: string, _updates: Partial<HomepageImage>): boolean {
    console.warn('updateImageSync已废弃，请使用异步方法updateImage()')
    return false
  }

  deleteImageSync(_id: string): boolean {
    console.warn('deleteImageSync已废弃，请使用异步方法deleteImage()')
    return false
  }

  addImageSync(_image: Omit<HomepageImage, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    console.warn('addImageSync已废弃，请使用异步方法addImage()')
    return false
  }

  resetToDefaultSync(): void {
    console.warn('resetToDefaultSync已废弃，请使用异步方法resetToDefault()')
  }
}

export const imageService = new ImageService()