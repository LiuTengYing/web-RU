import { ContactInfo, IContactInfo } from '../models/ContactInfo'

export interface CreateContactInfoData {
  type: 'email' | 'phone' | 'address' | 'online' | 'forum' | 'whatsapp'
  label: string
  value: string
  icon: string
  isActive?: boolean
  order?: number
}

export interface UpdateContactInfoData {
  type?: 'email' | 'phone' | 'address' | 'online' | 'forum' | 'whatsapp'
  label?: string
  value?: string
  icon?: string
  isActive?: boolean
  order?: number
}

/**
 * 获取所有联系信息
 */
export const getAllContactInfo = async (): Promise<IContactInfo[]> => {
  try {
    const contactInfo = await ContactInfo.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .exec()
    return contactInfo
  } catch (error) {
    console.error('获取联系信息失败:', error)
    throw new Error('获取联系信息失败')
  }
}

/**
 * 获取所有联系信息（包括非活跃的，用于管理后台）
 */
export const getAllContactInfoForAdmin = async (): Promise<IContactInfo[]> => {
  try {
    const contactInfo = await ContactInfo.find()
      .sort({ order: 1, createdAt: 1 })
      .exec()
    return contactInfo
  } catch (error) {
    console.error('获取联系信息失败:', error)
    throw new Error('获取联系信息失败')
  }
}

/**
 * 创建联系信息
 */
export const createContactInfo = async (data: CreateContactInfoData): Promise<IContactInfo> => {
  try {
    // 验证数据
    if (!data.type || !data.label || !data.value || !data.icon) {
      throw new Error('缺少必要字段')
    }

    // 检查是否已存在相同类型的联系信息
    const existing = await ContactInfo.findOne({ type: data.type, isActive: true })
    if (existing) {
      throw new Error('该类型的联系信息已存在')
    }

    const contactInfo = new ContactInfo({
      ...data,
      isActive: data.isActive ?? true,
      order: data.order ?? 0
    })

    const savedContactInfo = await contactInfo.save()
    return savedContactInfo
  } catch (error) {
    console.error('创建联系信息失败:', error)
    throw error
  }
}

/**
 * 更新联系信息
 */
export const updateContactInfo = async (id: string, data: UpdateContactInfoData): Promise<IContactInfo> => {
  try {
    const contactInfo = await ContactInfo.findById(id)
    if (!contactInfo) {
      throw new Error('联系信息不存在')
    }

    // 如果要更改类型，检查新类型是否已存在
    if (data.type && data.type !== contactInfo.type) {
      const existing = await ContactInfo.findOne({ 
        type: data.type, 
        isActive: true,
        _id: { $ne: id }
      })
      if (existing) {
        throw new Error('该类型的联系信息已存在')
      }
    }

    const updatedContactInfo = await ContactInfo.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    )

    if (!updatedContactInfo) {
      throw new Error('更新联系信息失败')
    }

    return updatedContactInfo
  } catch (error) {
    console.error('更新联系信息失败:', error)
    throw error
  }
}

/**
 * 删除联系信息
 */
export const deleteContactInfo = async (id: string): Promise<void> => {
  try {
    const result = await ContactInfo.findByIdAndDelete(id)
    if (!result) {
      throw new Error('联系信息不存在')
    }
  } catch (error) {
    console.error('删除联系信息失败:', error)
    throw error
  }
}

/**
 * 切换联系信息状态
 */
export const toggleContactInfoStatus = async (id: string): Promise<IContactInfo> => {
  try {
    const contactInfo = await ContactInfo.findById(id)
    if (!contactInfo) {
      throw new Error('联系信息不存在')
    }

    contactInfo.isActive = !contactInfo.isActive
    const updatedContactInfo = await contactInfo.save()
    return updatedContactInfo
  } catch (error) {
    console.error('切换联系信息状态失败:', error)
    throw error
  }
}
