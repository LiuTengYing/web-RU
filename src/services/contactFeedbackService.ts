/**
 * 联系表单反馈服务
 * 管理联系表单的反馈和留言
 */

// 反馈接口
export interface ContactFeedback {
  id: string
  name: string
  email: string
  subject: string
  message: string
  submitTime: string
  status: 'pending' | 'read' | 'replied'
  ip?: string
  userAgent?: string
}

/**
 * 获取所有反馈
 */
export const getAllContactFeedback = async (): Promise<ContactFeedback[]> => {
  try {
    const response = await fetch('/api/feedback')
    const data = await response.json()
    
    if (data.success) {
      return data.feedback.map((item: any) => ({
        id: item._id,
        name: item.name,
        email: item.email,
        subject: item.subject,
        message: item.message,
        submitTime: item.submitTime,
        status: item.status,
        ip: item.ip,
        userAgent: item.userAgent
      }))
    }
    return []
  } catch (error) {
    console.error('获取反馈失败:', error)
    return []
  }
}

/**
 * 添加反馈
 */
export const addContactFeedback = async (feedback: Omit<ContactFeedback, 'id'>): Promise<ContactFeedback> => {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedback)
    })
    
    const data = await response.json()
    if (data.success) {
      return {
        id: data.feedback._id,
        name: data.feedback.name,
        email: data.feedback.email,
        subject: data.feedback.subject,
        message: data.feedback.message,
        submitTime: data.feedback.submitTime,
        status: data.feedback.status,
        ip: data.feedback.ip,
        userAgent: data.feedback.userAgent
      }
    }
    throw new Error(data.error || '添加反馈失败')
  } catch (error) {
    console.error('添加反馈失败:', error)
    throw error
  }
}

/**
 * 更新反馈状态
 */
export const updateContactFeedbackStatus = async (id: string, status: ContactFeedback['status']): Promise<ContactFeedback | null> => {
  try {
    const response = await fetch(`/api/feedback/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
    
    const data = await response.json()
    if (data.success) {
      return {
        id: data.feedback._id,
        name: data.feedback.name,
        email: data.feedback.email,
        subject: data.feedback.subject,
        message: data.feedback.message,
        submitTime: data.feedback.submitTime,
        status: data.feedback.status,
        ip: data.feedback.ip,
        userAgent: data.feedback.userAgent
      }
    }
    return null
  } catch (error) {
    console.error('更新反馈状态失败:', error)
    return null
  }
}

/**
 * 删除反馈
 */
export const deleteContactFeedback = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/feedback/${id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('删除反馈失败:', error)
    return false
  }
}

/**
 * 获取未读反馈数量
 */
export const getUnreadContactFeedbackCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/feedback/unread/count')
    const data = await response.json()
    
    if (data.success) {
      return data.count
    }
    return 0
  } catch (error) {
    console.error('获取未读反馈数量失败:', error)
    return 0
  }
}

/**
 * 导出反馈数据
 */
export const exportContactFeedback = async (): Promise<string> => {
  try {
    const response = await fetch('/api/feedback/export')
    return await response.text()
  } catch (error) {
    console.error('导出反馈失败:', error)
    throw error
  }
}

/**
 * 清空所有反馈
 */
export const clearAllContactFeedback = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/feedback', {
      method: 'DELETE'
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('清空反馈失败:', error)
    return false
  }
}

/**
 * 搜索反馈
 */
export const searchContactFeedback = async (query: string): Promise<ContactFeedback[]> => {
  try {
    const allFeedback = await getAllContactFeedback()
    const lowerQuery = query.toLowerCase()
    
    return allFeedback.filter(feedback => 
      feedback.name.toLowerCase().includes(lowerQuery) ||
      feedback.email.toLowerCase().includes(lowerQuery) ||
      feedback.subject.toLowerCase().includes(lowerQuery) ||
      feedback.message.toLowerCase().includes(lowerQuery)
    )
  } catch (error) {
    console.error('搜索反馈失败:', error)
    return []
  }
}

/**
 * 按状态筛选反馈
 */
export const filterContactFeedbackByStatus = async (status: ContactFeedback['status']): Promise<ContactFeedback[]> => {
  try {
    const allFeedback = await getAllContactFeedback()
    return allFeedback.filter(feedback => feedback.status === status)
  } catch (error) {
    console.error('按状态筛选反馈失败:', error)
    return []
  }
}

/**
 * 按时间范围筛选反馈
 */
export const filterContactFeedbackByDateRange = async (startDate: string, endDate: string): Promise<ContactFeedback[]> => {
  try {
    const allFeedback = await getAllContactFeedback()
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    
    return allFeedback.filter(feedback => {
      const feedbackTime = new Date(feedback.submitTime).getTime()
      return feedbackTime >= start && feedbackTime <= end
    })
  } catch (error) {
    console.error('按时间范围筛选反馈失败:', error)
    return []
  }
}

/**
 * 获取反馈统计信息
 */
export const getContactFeedbackStats = async () => {
  try {
    const feedbacks = await getAllContactFeedback()
    
    const total = feedbacks.length
    const pending = feedbacks.filter(f => f.status === 'pending').length
    const read = feedbacks.filter(f => f.status === 'read').length
    const replied = feedbacks.filter(f => f.status === 'replied').length
    
    return {
      total,
      pending,
      read,
      replied
    }
  } catch (error) {
    console.error('获取反馈统计信息失败:', error)
    return {
      total: 0,
      pending: 0,
      read: 0,
      replied: 0
    }
  }
}

/**
 * 批量更新反馈状态
 */
export const batchUpdateContactFeedbackStatus = async (ids: string[], status: ContactFeedback['status']): Promise<boolean> => {
  try {
    const promises = ids.map(id => updateContactFeedbackStatus(id, status))
    const results = await Promise.all(promises)
    return results.every(result => result !== null)
  } catch (error) {
    console.error('批量更新反馈状态失败:', error)
    return false
  }
}

/**
 * 批量删除反馈
 */
export const batchDeleteContactFeedback = async (ids: string[]): Promise<boolean> => {
  try {
    const promises = ids.map(id => deleteContactFeedback(id))
    const results = await Promise.all(promises)
    return results.every(result => result === true)
  } catch (error) {
    console.error('批量删除反馈失败:', error)
    return false
  }
}
