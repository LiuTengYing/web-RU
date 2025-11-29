import { Vehicle, IVehicle } from '../models/Vehicle'

export interface VehicleData {
  _id: string
  id: number
  brand: string
  model: string
  year: string
  password: string
  documents: number
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateVehicleData {
  brand: string
  modelName: string
  year: string
  password?: string
}

export interface UpdateVehicleData {
  brand?: string
  modelName?: string
  year?: string
  password?: string
  documents?: number
}

/**
 * 获取所有车型
 */
export const getVehicles = async (): Promise<VehicleData[]> => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean()
    return vehicles as unknown as VehicleData[]
  } catch (error) {
    console.error('获取车型失败:', error)
    throw error
  }
}

/**
 * 创建新车型
 */
export const createVehicle = async (data: CreateVehicleData): Promise<VehicleData> => {
  try {
    // 生成唯一ID
    const lastVehicle = await Vehicle.findOne().sort({ id: -1 })
    const newId = lastVehicle ? lastVehicle.id + 1 : 1

    const vehicle = new Vehicle({
      id: newId,
      brand: data.brand.trim(),
      modelName: data.modelName.trim(),
      year: data.year.trim(),
      password: data.password ? data.password.trim() : '',
      documents: 0
    })

    const savedVehicle = await vehicle.save()
    return savedVehicle.toObject() as unknown as VehicleData
  } catch (error) {
    console.error('创建车型失败:', error)
    throw error
  }
}

/**
 * 更新车型
 */
export const updateVehicle = async (id: string, updates: UpdateVehicleData): Promise<VehicleData> => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )

    if (!vehicle) {
      throw new Error('车型不存在')
    }

    return vehicle.toObject() as unknown as VehicleData
  } catch (error) {
    console.error('更新车型失败:', error)
    throw error
  }
}

/**
 * 删除车型
 */
export const deleteVehicle = async (id: string): Promise<boolean> => {
  try {
    const result = await Vehicle.findByIdAndDelete(id)
    return !!result
  } catch (error) {
    console.error('删除车型失败:', error)
    throw error
  }
}

/**
 * 获取车型统计
 */
export const getVehicleStats = async (): Promise<{
  totalVehicles: number
  totalDocuments: number
  averageDocumentsPerVehicle: number
}> => {
  try {
    const totalVehicles = await Vehicle.countDocuments()
    const vehicles = await Vehicle.find().lean()
    const totalDocuments = vehicles.reduce((sum, vehicle) => sum + vehicle.documents, 0)
    const averageDocumentsPerVehicle = totalVehicles > 0 ? totalDocuments / totalVehicles : 0

    return {
      totalVehicles,
      totalDocuments,
      averageDocumentsPerVehicle: Math.round(averageDocumentsPerVehicle * 100) / 100
    }
  } catch (error) {
    console.error('获取车型统计失败:', error)
    throw error
  }
}

/**
 * 从localStorage迁移数据
 */
export const migrateFromLocalStorage = async (localData: any[]): Promise<number> => {
  try {
    let migratedCount = 0
    
    for (const vehicle of localData) {
      try {
        await createVehicle({
          brand: vehicle.brand || '',
          modelName: vehicle.modelName || '',
          year: vehicle.year || '',
          password: vehicle.password || ''
        })
        migratedCount++
      } catch (error) {
        console.error(`迁移车型失败 ${vehicle.brand} ${vehicle.model}:`, error)
      }
    }

    return migratedCount
  } catch (error) {
    console.error('迁移车型数据失败:', error)
    throw error
  }
}
