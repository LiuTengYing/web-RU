/**
 * 草稿服务
 * 管理文章草稿数据的API调用
 */

export interface DraftData {
  _id?: string
  articleId?: string
  data: any
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateDraftData {
  articleId?: string
  data: any
}

const API_BASE_URL = '/api/drafts'

/**
 * 保存草稿
 */
export const saveDraft = async (draftData: CreateDraftData): Promise<DraftData> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.draft
  } catch (error) {
    console.error('保存草稿失败:', error)
    throw error
  }
}

/**
 * 获取草稿
 */
export const getDraft = async (articleId?: string): Promise<DraftData | null> => {
  try {
    const url = articleId ? `${API_BASE_URL}/${articleId}` : `${API_BASE_URL}/new`
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.draft
  } catch (error) {
    console.error('获取草稿失败:', error)
    return null
  }
}

/**
 * 删除草稿
 */
export const deleteDraft = async (articleId?: string): Promise<boolean> => {
  try {
    const url = articleId ? `${API_BASE_URL}/${articleId}` : `${API_BASE_URL}/new`
    const response = await fetch(url, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('删除草稿失败:', error)
    return false
  }
}
