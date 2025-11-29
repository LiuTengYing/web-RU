/**
 * 用户留言服务
 * 统一管理用户留言和管理员回复的存储逻辑
 */

export interface UserFeedback {
  id: string
  author: string
  content: string
  timestamp: number
  replies: UserReply[]
}

export interface UserReply {
  id: string
  author: string
  content: string
  timestamp: number
  isAdmin: boolean
}

/**
 * 获取文档的所有留言（包括管理员回复）
 */
export const getDocumentFeedback = async (documentId: string | number): Promise<UserFeedback[]> => {
  try {
    const response = await fetch(`/api/document-feedback/${documentId}`)
    const data = await response.json()
    
    if (data.success) {
      return data.feedback.map((item: any) => ({
        id: item._id,
        author: item.author,
        content: item.content,
        timestamp: item.timestamp,
        replies: item.replies || []
      }))
    }
    return []
  } catch (error) {
    console.warn('Failed to load feedback data:', error)
    return []
  }
}

export interface FeedbackWithDocument extends UserFeedback {
  documentInfo: {
    title: string
    type: 'structured' | 'video' | 'image-text' | 'unknown'
  }
  documentId: string
}

/**
 * 获取所有文档的留言（管理后台使用）
 */
export const getAllDocumentFeedback = async (): Promise<FeedbackWithDocument[]> => {
  try {
    const response = await fetch('/api/document-feedback/all/admin')
    const data = await response.json()
    
    if (data.success) {
      return data.feedback.map((item: any) => ({
        id: item._id,
        documentId: item.documentId,
        author: item.author,
        content: item.content,
        timestamp: item.timestamp,
        replies: item.replies || [],
        documentInfo: item.documentInfo
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to load all feedback:', error)
    throw error
  }
}

/**
 * 获取未回复的留言数量（管理后台使用）
 */
export const getUnrepliedFeedbackCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/document-feedback/stats/unreplied')
    const data = await response.json()
    
    if (data.success) {
      return data.count
    }
    return 0
  } catch (error) {
    console.error('Failed to load unreplied feedback count:', error)
    return 0
  }
}

/**
 * 保存文档的所有留言数据（兼容性函数）
 */
export const saveDocumentFeedback = async (_documentId: string | number, _feedback: UserFeedback[]): Promise<void> => {
  // 这个函数现在不需要实现，因为数据直接保存到数据库
  console.warn('saveDocumentFeedback is deprecated, data is now saved directly to database')
}

/**
 * 添加用户留言
 */
export const addUserFeedback = async (documentId: string | number, author: string, content: string): Promise<UserFeedback> => {
  try {
    // 确保documentId存在且有效
    if (!documentId) {
      throw new Error('文档ID不能为空')
    }

    const response = await fetch('/api/document-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: String(documentId),
        author: author ? author.trim() : '',
        content: content ? content.trim() : ''
      })
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || '添加反馈失败')
    }

    return {
      id: data.feedback._id,
      author: data.feedback.author,
      content: data.feedback.content,
      timestamp: data.feedback.timestamp,
      replies: data.feedback.replies || []
    }
  } catch (error) {
    console.error('添加用户反馈失败:', error)
    throw error
  }
}

/**
 * 添加管理员回复
 */
export const addAdminReply = async (
  _documentId: string | number, 
  feedbackId: string, 
  adminName: string, 
  content: string
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/document-feedback/${feedbackId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: adminName.trim(),
        content: content.trim(),
        isAdmin: true
      })
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || '添加回复失败')
    }

    console.log(`Added admin reply to feedback ${feedbackId}`)
    return true
  } catch (error) {
    console.error('添加管理员回复失败:', error)
    return false
  }
}

/**
 * 删除留言
 */
export const removeFeedback = async (_documentId: string | number, feedbackId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/document-feedback/${feedbackId}`, {
      method: 'DELETE'
    })

    const data = await response.json()
    if (data.success) {
      console.log(`Removed feedback ${feedbackId}`)
      return true
    }
    return false
  } catch (error) {
    console.error('删除反馈失败:', error)
    return false
  }
}

/**
 * 删除回复
 */
export const removeReply = async (_documentId: string | number, feedbackId: string, replyId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/document-feedback/${feedbackId}/reply/${replyId}`, {
      method: 'DELETE'
    })

    const data = await response.json()
    if (data.success) {
      console.log(`Removed reply ${replyId} from feedback ${feedbackId}`)
      return true
    }
    return false
  } catch (error) {
    console.error('删除回复失败:', error)
    return false
  }
}

/**
 * 迁移旧格式的留言数据（兼容性处理）
 */
export const migrateLegacyFeedback = async (documentId: string | number, legacyFeedback: any[]): Promise<void> => {
  if (!legacyFeedback || legacyFeedback.length === 0) return

  try {
    const response = await fetch('/api/document-feedback/migrate/localStorage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        localData: [{
          documentId: documentId.toString(),
          feedback: legacyFeedback
        }]
      })
    })

    const data = await response.json()
    if (data.success) {
      console.log(`Migrated ${data.migratedCount} legacy feedback items for document ${documentId}`)
    }
  } catch (error) {
    console.error('迁移旧格式反馈失败:', error)
  }
}

/**
 * 获取所有文档的留言统计
 */
export const getFeedbackStats = async (): Promise<{ totalFeedback: number, totalReplies: number, documentsWithFeedback: number }> => {
  try {
    const response = await fetch('/api/document-feedback/stats/overview')
    const data = await response.json()
    
    if (data.success) {
      return data.stats
    }
    return { totalFeedback: 0, totalReplies: 0, documentsWithFeedback: 0 }
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    return { totalFeedback: 0, totalReplies: 0, documentsWithFeedback: 0 }
  }
}
