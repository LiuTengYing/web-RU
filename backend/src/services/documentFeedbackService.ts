import { DocumentFeedback, IDocumentFeedback, IUserReply } from '../models/DocumentFeedback'

export interface DocumentFeedbackData {
  _id: string
  documentId: string
  author: string
  content: string
  timestamp: number
  replies: IUserReply[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateFeedbackData {
  documentId: string
  author: string
  content: string
}

export interface CreateReplyData {
  feedbackId: string
  author: string
  content: string
  isAdmin?: boolean
}

/**
 * 获取文档的所有反馈
 */
export const getDocumentFeedback = async (documentId: string): Promise<DocumentFeedbackData[]> => {
  try {
    const feedback = await DocumentFeedback.find({ documentId })
      .sort({ timestamp: -1 })
      .lean()
    
    return feedback as unknown as DocumentFeedbackData[]
  } catch (error) {
    console.error('获取文档反馈失败:', error)
    throw error
  }
}

/**
 * 获取所有反馈（用于管理后台）
 */
export const getAllFeedback = async (): Promise<DocumentFeedbackData[]> => {
  try {
    const feedback = await DocumentFeedback.find()
      .sort({ timestamp: -1 })
      .lean()
    
    return feedback as unknown as DocumentFeedbackData[]
  } catch (error) {
    console.error('获取所有反馈失败:', error)
    throw error
  }
}

/**
 * 创建用户反馈
 */
export const createFeedback = async (data: CreateFeedbackData): Promise<DocumentFeedbackData> => {
  try {
    const feedback = new DocumentFeedback({
      documentId: data.documentId,
      author: data.author.trim(),
      content: data.content.trim(),
      timestamp: Date.now(),
      replies: []
    })

    const savedFeedback = await feedback.save()
    return savedFeedback.toObject() as unknown as DocumentFeedbackData
  } catch (error) {
    console.error('创建反馈失败:', error)
    throw error
  }
}

/**
 * 添加管理员回复
 */
export const addReply = async (data: CreateReplyData): Promise<DocumentFeedbackData> => {
  try {
    const feedback = await DocumentFeedback.findById(data.feedbackId)
    if (!feedback) {
      throw new Error('反馈不存在')
    }

    const reply: IUserReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: data.author.trim(),
      content: data.content.trim(),
      timestamp: Date.now(),
      isAdmin: data.isAdmin || false
    }

    feedback.replies.push(reply)
    const updatedFeedback = await feedback.save()
    
    return updatedFeedback.toObject() as unknown as DocumentFeedbackData
  } catch (error) {
    console.error('添加回复失败:', error)
    throw error
  }
}

/**
 * 删除反馈
 */
export const deleteFeedback = async (feedbackId: string): Promise<boolean> => {
  try {
    const result = await DocumentFeedback.findByIdAndDelete(feedbackId)
    return !!result
  } catch (error) {
    console.error('删除反馈失败:', error)
    throw error
  }
}

/**
 * 删除回复
 */
export const deleteReply = async (feedbackId: string, replyId: string): Promise<DocumentFeedbackData> => {
  try {
    const feedback = await DocumentFeedback.findById(feedbackId)
    if (!feedback) {
      throw new Error('反馈不存在')
    }

    const originalRepliesCount = feedback.replies.length
    feedback.replies = feedback.replies.filter(reply => reply.id !== replyId)
    
    if (feedback.replies.length === originalRepliesCount) {
      throw new Error('回复不存在')
    }

    const updatedFeedback = await feedback.save()
    return updatedFeedback.toObject() as unknown as DocumentFeedbackData
  } catch (error) {
    console.error('删除回复失败:', error)
    throw error
  }
}

/**
 * 获取反馈统计
 */
export const getFeedbackStats = async (): Promise<{
  totalFeedback: number
  totalReplies: number
  documentsWithFeedback: number
}> => {
  try {
    const totalFeedback = await DocumentFeedback.countDocuments()
    const documentsWithFeedback = await DocumentFeedback.distinct('documentId').countDocuments()
    
    const allFeedback = await DocumentFeedback.find().lean()
    const totalReplies = allFeedback.reduce((sum, feedback) => sum + feedback.replies.length, 0)

    return {
      totalFeedback,
      totalReplies,
      documentsWithFeedback
    }
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    throw error
  }
}

/**
 * 获取未回复的留言数量
 */
export const getUnrepliedFeedbackCount = async (): Promise<number> => {
  try {
    const allFeedback = await DocumentFeedback.find().lean()
    // 计算没有管理员回复的留言数量
    const unrepliedCount = allFeedback.filter(feedback => {
      const hasAdminReply = feedback.replies.some(reply => reply.isAdmin)
      return !hasAdminReply
    }).length
    
    return unrepliedCount
  } catch (error) {
    console.error('获取未回复留言数量失败:', error)
    return 0
  }
}

/**
 * 从localStorage迁移数据
 */
export const migrateFromLocalStorage = async (localData: any[]): Promise<number> => {
  try {
    let migratedCount = 0
    
    for (const item of localData) {
      if (item.documentId && item.feedback && Array.isArray(item.feedback)) {
        for (const feedback of item.feedback) {
          const feedbackData = {
            documentId: item.documentId,
            author: feedback.author || feedback.user || '',
            content: feedback.content || '',
            timestamp: feedback.timestamp || Date.now(),
            replies: (feedback.replies || []).map((reply: any) => ({
              id: reply.id || `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              author: reply.author || '',
              content: reply.content || '',
              timestamp: reply.timestamp || Date.now(),
              isAdmin: reply.author?.includes('管理员') || reply.author?.includes('Admin') || false
            }))
          }

          await DocumentFeedback.create(feedbackData)
          migratedCount++
        }
      }
    }

    return migratedCount
  } catch (error) {
    console.error('迁移localStorage数据失败:', error)
    throw error
  }
}
