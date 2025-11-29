import { Feedback, IFeedback } from '../models/Feedback'

export interface CreateFeedbackData {
  name: string
  email: string
  orderNumber?: string
  subject: string
  message: string
  ip?: string
  userAgent?: string
}

export interface UpdateFeedbackData {
  status?: 'pending' | 'read' | 'replied'
}

/**
 * 获取所有反馈
 */
export const getAllFeedback = async (): Promise<IFeedback[]> => {
  try {
    const feedback = await Feedback.find()
      .sort({ submitTime: -1 })
      .exec()
    return feedback
  } catch (error) {
    console.error('获取反馈失败:', error)
    throw new Error('获取反馈失败')
  }
}

/**
 * 创建反馈
 */
export const createFeedback = async (data: CreateFeedbackData): Promise<IFeedback> => {
  try {
    // 验证数据
    if (!data.name || !data.email || !data.subject || !data.message) {
      throw new Error('缺少必要字段')
    }

    const feedback = new Feedback({
      ...data,
      submitTime: new Date(),
      status: 'pending'
    })

    const savedFeedback = await feedback.save()
    return savedFeedback
  } catch (error) {
    console.error('创建反馈失败:', error)
    throw error
  }
}

/**
 * 更新反馈状态
 */
export const updateFeedbackStatus = async (id: string, data: UpdateFeedbackData): Promise<IFeedback> => {
  try {
    const feedback = await Feedback.findById(id)
    if (!feedback) {
      throw new Error('反馈不存在')
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    )

    if (!updatedFeedback) {
      throw new Error('更新反馈失败')
    }

    return updatedFeedback
  } catch (error) {
    console.error('更新反馈失败:', error)
    throw error
  }
}

/**
 * 删除反馈
 */
export const deleteFeedback = async (id: string): Promise<void> => {
  try {
    const result = await Feedback.findByIdAndDelete(id)
    if (!result) {
      throw new Error('反馈不存在')
    }
  } catch (error) {
    console.error('删除反馈失败:', error)
    throw error
  }
}

/**
 * 获取未读反馈数量
 */
export const getUnreadFeedbackCount = async (): Promise<number> => {
  try {
    const count = await Feedback.countDocuments({ status: 'pending' })
    return count
  } catch (error) {
    console.error('获取未读反馈数量失败:', error)
    return 0
  }
}

/**
 * 导出反馈数据
 */
export const exportFeedback = async (): Promise<string> => {
  try {
    const feedback = await Feedback.find().sort({ submitTime: -1 })
    const data = {
      feedback,
      exportDate: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('导出反馈失败:', error)
    throw error
  }
}

/**
 * 清空所有反馈
 */
export const clearAllFeedback = async (): Promise<void> => {
  try {
    await Feedback.deleteMany({})
  } catch (error) {
    console.error('清空反馈失败:', error)
    throw error
  }
}
