/**
 * 音频预设服务
 * 管理音频均衡器的预设配置
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

/**
 * 音频预设接口
 */
export interface AudioPreset {
  id: string
  name: string
  settings: {
    bass: number
    treble: number
    mid: number
    volume: number
    [key: string]: number
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建音频预设数据接口
 */
export interface CreateAudioPresetData {
  name: string
  settings: {
    bass: number
    treble: number
    mid: number
    volume: number
    [key: string]: number
  }
}

/**
 * 更新音频预设数据接口
 */
export interface UpdateAudioPresetData {
  name?: string
  settings?: {
    bass?: number
    treble?: number
    mid?: number
    volume?: number
    [key: string]: number | undefined
  }
}

/**
 * 获取所有音频预设
 */
export const getAudioPresets = async (): Promise<AudioPreset[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/audio-presets`)
    const data = await response.json()
    
    if (data.success) {
      return data.presets
    }
    return []
  } catch (error) {
    console.error('获取音频预设失败:', error)
    return []
  }
}

/**
 * 创建音频预设
 */
export const createAudioPreset = async (preset: CreateAudioPresetData): Promise<AudioPreset> => {
  try {
    const response = await fetch(`${API_BASE_URL}/audio-presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preset)
    })
    
    const data = await response.json()
    if (data.success) {
      return data.preset
    }
    throw new Error(data.error || '创建音频预设失败')
  } catch (error) {
    console.error('创建音频预设失败:', error)
    throw error
  }
}

/**
 * 更新音频预设
 */
export const updateAudioPreset = async (id: string, updates: UpdateAudioPresetData): Promise<AudioPreset> => {
  try {
    const response = await fetch(`${API_BASE_URL}/audio-presets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    
    const data = await response.json()
    if (data.success) {
      return data.preset
    }
    throw new Error(data.error || '更新音频预设失败')
  } catch (error) {
    console.error('更新音频预设失败:', error)
    throw error
  }
}

/**
 * 删除音频预设
 */
export const deleteAudioPreset = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/audio-presets/${id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('删除音频预设失败:', error)
    return false
  }
}

/**
 * 保存预设（兼容旧接口）
 */
export const savePreset = async (preset: CreateAudioPresetData): Promise<AudioPreset> => {
  return createAudioPreset(preset)
}
