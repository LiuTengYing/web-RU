// AI服务 - 处理与后端AI API的通信

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface KnowledgeSource {
  type: 'general' | 'video' | 'structured'
  id: string
  title: string
  summary?: string
  description?: string
  content?: string
  category?: string
  tags?: string[]
  images?: Array<{
    url: string
    alt?: string
    order?: number
  }>
  sections?: Array<{
    id: string
    heading: string
    content: string
    imageUrl?: string
    imageAlt?: string
    layout: 'imageLeft' | 'imageRight'
  }>
  videoUrl?: string
  platform?: string
  thumbnail?: string
  duration?: string
  basicInfo?: {
    vehicleImage: string
    introduction: string
    brand: string
    model: string
    yearRange: string
  }
  matchingFaqs?: Array<{
    id: string
    title: string
    description: string
    images: string[]
  }>
  matchingCompatibleModels?: Array<{
    id: string
    name: string
    description: string
    dashboardImage?: string
  }>
  relevance: number
  createdAt: string
}

export interface AIResponse {
  success: boolean
  message?: string
  sources?: KnowledgeSource[]
  error?: string
  requiresSelection?: boolean  // 标记是否需要用户选择
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export type AIProvider = 'openai' | 'deepseek'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string;  // 添加apiKey属性，设为可选
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  baseURL?: string
}

class AIService {
  private baseURL = '/api/ai'

  /**
   * 发送消息到AI助手
   */
  async sendMessage(
    messages: AIMessage[], 
    config?: Partial<AIConfig>
  ): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          config
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('AI service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * 处理用户资源选择
   */
  async handleResourceSelection(
    selectionNumber: number,
    sources: any[],
    userLanguage: 'zh' | 'en',
    originalQuery?: string
  ): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectionNumber,
          sources,
          userLanguage,
          originalQuery
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('AI resource selection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * 获取AI配置
   */
  async getConfig(): Promise<{ success: boolean; config?: AIConfig; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/config`, {
        credentials: 'include' // 确保发送cookie和session信息
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get AI config error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI config'
      }
    }
  }

  /**
   * 更新AI配置
   */
  async updateConfig(config: {
    provider?: AIProvider
    apiKey?: string
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
    baseURL?: string
  }): Promise<{
    success: boolean
    message?: string
    warning?: string
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseURL}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 确保发送cookie和session信息
        body: JSON.stringify(config),
      })

      console.log('配置更新响应状态:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('配置更新失败响应:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('配置更新成功响应:', data)
      
      // 如果有警告信息，在控制台显示
      if (data.warning) {
        console.warn('配置更新警告:', data.warning)
      }
      
      return data
    } catch (error) {
      console.error('Update AI config error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update AI config'
      }
    }
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(): Promise<{
    success: boolean
    stats?: {
      totalMessages: number
      totalTokens: number
      todayMessages: number
      todayTokens: number
      monthlyMessages: number
      monthlyTokens: number
    }
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseURL}/usage`, {
        credentials: 'include' // 确保发送cookie和session信息
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get AI usage stats error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get usage stats'
      }
    }
  }

  /**
   * 搜索知识库内容
   */
  async searchKnowledge(query: string): Promise<{
    success: boolean
    results?: Array<{
      type: 'document' | 'video' | 'faq'
      title: string
      content: string
      relevance: number
      metadata?: any
    }>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Search knowledge error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search knowledge base'
      }
    }
  }
}

// 创建单例实例
export const aiService = new AIService()

// 便捷函数
export const sendAIMessage = async (
  userMessage: string, 
  conversationHistory: AIMessage[] = [],
  config?: Partial<AIConfig>
): Promise<AIResponse> => {
  const messages: AIMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]
  
  return aiService.sendMessage(messages, config)
}

export default aiService
