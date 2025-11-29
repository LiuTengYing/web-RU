import { Announcement, IAnnouncement } from '../models/Announcement'

/**
 * 获取公告设置
 */
export const getAnnouncement = async (): Promise<IAnnouncement | null> => {
  try {
    // 只保存一条公告记录
    let announcement = await Announcement.findOne()
    
    // 如果不存在，创建默认公告
    if (!announcement) {
      announcement = await Announcement.create({
        enabled: false,
        content: '欢迎访问本站！这是一个示例公告。',
        style: {
          type: 'info',
          fontSize: 'md',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textColor: ''
        },
        behavior: {
          scrolling: true,
          closeable: true,
          closeRememberDays: 7
        }
      })
    }
    
    return announcement
  } catch (error) {
    console.error('获取公告失败:', error)
    throw error
  }
}

/**
 * 更新公告设置
 */
export const updateAnnouncement = async (data: Partial<IAnnouncement>): Promise<IAnnouncement> => {
  try {
    let announcement = await Announcement.findOne()
    
    if (!announcement) {
      // 如果不存在，创建新的
      announcement = await Announcement.create(data)
    } else {
      // 更新现有公告
      Object.assign(announcement, data)
      await announcement.save()
    }
    
    return announcement
  } catch (error) {
    console.error('更新公告失败:', error)
    throw error
  }
}

/**
 * 切换公告启用状态
 */
export const toggleAnnouncement = async (enabled: boolean): Promise<IAnnouncement> => {
  try {
    const announcement = await Announcement.findOne()
    
    if (!announcement) {
      throw new Error('公告不存在')
    }
    
    announcement.enabled = enabled
    await announcement.save()
    
    return announcement
  } catch (error) {
    console.error('切换公告状态失败:', error)
    throw error
  }
}

