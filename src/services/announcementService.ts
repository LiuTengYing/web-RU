export interface AnnouncementStyle {
  type: 'info' | 'warning' | 'danger' | 'success'
  fontSize: 'sm' | 'md' | 'lg'
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textColor?: string
}

export interface AnnouncementBehavior {
  scrolling: boolean
  closeable: boolean
  closeRememberDays: number
}

export interface Announcement {
  _id?: string
  enabled: boolean
  content: string
  style: AnnouncementStyle
  behavior: AnnouncementBehavior
  createdAt?: string
  updatedAt?: string
}

/**
 * 获取公告设置
 */
export const getAnnouncement = async (): Promise<Announcement | null> => {
  try {
    const response = await fetch('/api/announcement')
    const data = await response.json()
    
    if (data.success) {
      return data.announcement
    }
    return null
  } catch (error) {
    console.error('获取公告失败:', error)
    return null
  }
}

/**
 * 更新公告设置
 */
export const updateAnnouncement = async (announcement: Partial<Announcement>): Promise<Announcement | null> => {
  try {
    const response = await fetch('/api/announcement', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(announcement)
    })
    
    const data = await response.json()
    
    if (data.success) {
      return data.announcement
    }
    throw new Error(data.error || '更新失败')
  } catch (error) {
    console.error('更新公告失败:', error)
    throw error
  }
}

/**
 * 切换公告启用状态
 */
export const toggleAnnouncement = async (enabled: boolean): Promise<Announcement | null> => {
  try {
    const response = await fetch('/api/announcement/toggle', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled })
    })
    
    const data = await response.json()
    
    if (data.success) {
      return data.announcement
    }
    throw new Error(data.error || '切换失败')
  } catch (error) {
    console.error('切换公告状态失败:', error)
    throw error
  }
}

/**
 * 检查用户是否已关闭公告
 */
export const isAnnouncementClosed = (): boolean => {
  try {
    const closedData = localStorage.getItem('announcement_closed')
    if (!closedData) return false
    
    const { closedAt, rememberDays } = JSON.parse(closedData)
    const now = Date.now()
    const daysSinceClosed = (now - closedAt) / (1000 * 60 * 60 * 24)
    
    return daysSinceClosed < rememberDays
  } catch (error) {
    return false
  }
}

/**
 * 记录用户关闭公告
 */
export const closeAnnouncement = (rememberDays: number = 7): void => {
  try {
    localStorage.setItem('announcement_closed', JSON.stringify({
      closedAt: Date.now(),
      rememberDays
    }))
  } catch (error) {
    console.error('保存关闭状态失败:', error)
  }
}

/**
 * 清除关闭记录（管理员重新开启时可选调用）
 */
export const clearAnnouncementClosed = (): void => {
  try {
    localStorage.removeItem('announcement_closed')
  } catch (error) {
    console.error('清除关闭状态失败:', error)
  }
}

